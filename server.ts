import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiInstance;
}

// Smart model wrapper that falls back to gemini-3.1-flash-lite on QuotaExceeded or Rate Limits
async function generateContentWithFallback(ai: GoogleGenAI, params: {
  contents: any;
  config?: any;
}) {
  try {
    return await ai.models.generateContent({
      model: "gemini-3.5-flash",
      ...params
    });
  } catch (error: any) {
    const errMsg = String(error?.message || error || "").toLowerCase();
    const isQuotaError = errMsg.includes("429") || 
                         errMsg.includes("quota") || 
                         errMsg.includes("limit") ||
                         errMsg.includes("exhausted") ||
                         (error?.status === 429) ||
                         (error?.statusCode === 429);
                         
    if (isQuotaError) {
      console.warn("Primary gemini-3.5-flash model rate-limited or quota exhausted. Falling back to secondary gemini-3.1-flash-lite...");
      try {
        return await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          ...params
        });
      } catch (liteError: any) {
        console.error("Secondary gemini-3.1-flash-lite also failed:", liteError instanceof Error ? liteError.message : liteError);
        throw error;
      }
    }
    throw error;
  }
}

// 1. Resume validation endpoint
app.post("/api/resume-validator", async (req, res) => {
  const { resumeText, company } = req.body;
  if (!resumeText || !company) {
    return res.status(400).json({ error: "Missing resumeText or company parameter" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Graceful fallback when API Key is missing
    return res.json(getMockValidationResult(resumeText, company));
  }

  try {
    const prompt = `
      You are an expert technical recruiter validating an engineering student's resume against the recruitment criteria of ${company}.
      The candidate is from an Anna University affiliated engineering college in Tamil Nadu.
      Analyze the resume below:
      
      \"\"\"
      ${resumeText}
      \"\"\"

      Provide rating, CGPA cutoff check, skills analysis, project review, and action items.
      Format the output structure according to the specified JSON schema.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "Overall resume score out of 100",
            },
            company: {
              type: Type.STRING,
              description: "Name of the target company",
            },
            cgpaValidation: {
              type: Type.OBJECT,
              properties: {
                passed: { type: Type.BOOLEAN },
                cutoff: { type: Type.NUMBER },
                message: { type: Type.STRING },
              },
              required: ["passed", "cutoff", "message"],
            },
            keyFeedback: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key structural and qualitative feedback lines",
            },
            matchingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Skills present in resume that match company needs",
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Highly relevant skills this company looks for that are missing",
            },
            projectFeedback: {
              type: Type.STRING,
              description: "Evaluation and suggestions for the projects section",
            },
            actionItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Pragmatic, concrete steps the candidate must take to boost their score",
            },
          },
          required: [
            "score",
            "company",
            "cgpaValidation",
            "keyFeedback",
            "matchingSkills",
            "missingSkills",
            "projectFeedback",
            "actionItems",
          ],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API");
    }

    const result = JSON.parse(resultText);
    res.json({ ...result, isLiveAI: true });
  } catch (error: any) {
    console.warn("Gemini Resume Validation (Quota/Rate-Limit fallback):", error instanceof Error ? error.message : error);
    // On error, send highly realistic feedback on behalf of the company so user has continuous experience
    res.json({
      ...getMockValidationResult(resumeText, company),
      warning: "Live AI call encountered an error. Showing simulated review.",
    });
  }
});

// 2. Explanation route
app.post("/api/adaptive-explain", async (req, res) => {
  const { questionText, chosenAnswer, correctAnswer, category, topic, explanationEn, language } = req.body;
  
  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      explanation: language === "tamil" 
        ? `தவறான பதிலைக் கொடுத்துள்ளீர்கள். சரியான பதில்: ${correctAnswer}. கணித தர்க்கங்களை தெளிவாக்க, உங்கள் தயாரிப்பு தளத்தில் உள்ள விளக்கங்களைப் பார்க்கவும்.` 
        : `Simulated AI Explanations: You answered "${chosenAnswer}". The correct answer is "${correctAnswer}". Here is an analysis: ${explanationEn}`,
      isLiveAI: false
    });
  }

  try {
    const prompt = `
      The student is practicing for placement.
      Question: "${questionText}"
      Category: "${category} (${topic})"
      Student selected: "${chosenAnswer}"
      Correct answer is: "${correctAnswer}"
      Standard explanation: "${explanationEn}"
      
      Respond with a highly encouraging and easy-to-understand explanation of how to solve this step-by-step.
      Deliver the response in ${language === "tamil" ? "Tamil language" : "English language"}.
      Keep it friendly and structured.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
    });

    res.json({
      explanation: response.text || explanationEn,
      isLiveAI: true
    });
  } catch (err) {
    console.warn("Gemini Explanation (Quota/Rate-Limit fallback):", err instanceof Error ? err.message : err);
    res.json({
      explanation: language === "tamil" 
        ? `தயவுசெய்து மீண்டும் முயற்சிக்கவும். நேரடி AI விளக்குவதில் தோல்வி அடைந்தது. நிலையான விளக்கம்: ${explanationEn}`
        : `Failed to fetch live AI explanation. Standard explanation: ${explanationEn}`,
      isLiveAI: false
    });
  }
});

// 3. Generate adaptive questions
app.post("/api/adaptive-generate", async (req, res) => {
  const { branch, weakTopic } = req.body;

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      questions: getFallbackAdaptiveQuestions(branch, weakTopic),
      isLiveAI: false
    });
  }

  try {
    const prompt = `
      Create exactly 5 multiple choice questions for a ${branch} Engineering student on their weak topic: "${weakTopic}".
      These are for placement tests of software/technical companies visiting Anna University (like TCS, Zoho).
      Format your response as a JSON array where each question contains:
      - questionText (in clear English)
      - questionTextTamil (accurate direct translation of the question into Tamil)
      - options (exactly 4 distinct choices in English)
      - optionsTamil (exactly 4 direct Tamil translations of the choices)
      - correctIndex (0-3 index of correct choice)
      - explanation (step by step mathematical/logical explanation in English)
      - explanationTamil (Tamil translation of the explanation)
      - topic (specific subtopic string)
      - category (always "technical")
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              questionTextTamil: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              optionsTamil: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              explanationTamil: { type: Type.STRING },
              topic: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["questionText", "questionTextTamil", "options", "optionsTamil", "correctIndex", "explanation", "explanationTamil", "topic", "category"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Null response");
    const parsed = JSON.parse(resultText);
    res.json({ questions: parsed.map((q: any, index: number) => ({ ...q, id: `gen_${Date.now()}_${index}` })), isLiveAI: true });
  } catch (err) {
    console.warn("Gemini Generate (Quota/Rate-Limit fallback):", err instanceof Error ? err.message : err);
    res.json({
      questions: getFallbackAdaptiveQuestions(branch, weakTopic),
      isLiveAI: false,
      warning: "Could not generate live questions. Displaying offline tailored questions instead."
    });
  }
});


// 4. HR Interview - Start
app.post("/api/hr-interview/start", async (req, res) => {
  const { company, branch, resumeText } = req.body;
  
  const ai = getGeminiClient();
  if (!ai) {
    const question = getFallbackHRQuestion(company, 1, branch);
    return res.json({
      question,
      sessionMessages: [{ role: "model", text: question }],
      isLiveAI: false,
      warning: "Live AI call unavailable. Showing simulated recruiter interview."
    });
  }

  try {
    const prompt = `
      You are a professional, objective Senior HR Recruiter conducting a standard business corporate interview for ${company}.
      The candidate is a ${branch} engineering student undergoing a formal placement assessment.
      
      Your style is direct, clear, polite, and strictly professional. Do not use babying language, soft flattery, or informal Tamil mixed phrases. Keep the conversation in standard professional corporate English.
      
      CRITICAL RULE: Ask EXACTLY ONE question in this initial statement. Do not combine multiple inquiries.
      
      Begin Round 1:
      - Coordinate a professional greeting in corporate English.
      - State your title as Ms. Priya Sharma, Senior HR Panel Lead at ${company}.
      - Ask the candidate to present their formal self-introduction, focusing on their academic background and core technical domain.
      
      Output ONLY this clear, professional statement. Do not output thinking, code blocks, or markdown wrappers.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
    });

    const question = response.text?.trim() || getFallbackHRQuestion(company, 1, branch);

    res.json({
      question,
      sessionMessages: [{ role: "model", text: question }],
      isLiveAI: true
    });
  } catch (err) {
    console.warn("Gemini HR Start (Quota/Rate-Limit fallback):", err instanceof Error ? err.message : err);
    const question = getFallbackHRQuestion(company, 1, branch);
    res.json({
      question,
      sessionMessages: [{ role: "model", text: question }],
      isLiveAI: false,
      warning: "Error starting Live AI. Using simulated recruiter question."
    });
  }
});

// 5. HR Interview - Next Question
app.post("/api/hr-interview/next", async (req, res) => {
  const { company, branch, resumeText, messages, latestAnswer } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid messages parameter" });
  }

  // Append user's latest message to history
  const updatedHistory = [...messages, { role: "user", text: latestAnswer }];

  const ai = getGeminiClient();
  if (!ai) {
    const roundNo = Math.floor(updatedHistory.length / 2) + 1;
    const question = getFallbackHRQuestion(company, roundNo, branch);
    return res.json({
      question,
      sessionMessages: [...updatedHistory, { role: "model", text: question }],
      isLiveAI: false
    });
  }

  try {
    const formattedTranscript = updatedHistory
      .map(m => `${m.role === "user" ? "Candidate" : "HR Recruiter"}: ${m.text}`)
      .join("\n\n");

    const userAnswersCount = updatedHistory.filter(m => m.role === "user").length;

    const prompt = `
      You are a professional, objective Senior HR Recruiter conducting a standard corporate interview for ${company}.
      The candidate is a ${branch} engineering student undergoing a formal placement assessment.
      
      Your style is direct, clear, polite, and strictly professional (standard business English). Do not flatter, praise excessively, or coddle the candidate.
      
      CRITICAL RULE: Ask EXACTLY ONE question in your output message. Never combine different questions or multiple requests.
      
      Here is the interview conversation history so far:
      \"\"\"
      ${formattedTranscript}
      \"\"\"
      
      Currently, the student has answered ${userAnswersCount} questions. Ask exactly one straightforward, objective question for the next progressive round:
      
      1. Since they gave their personal introduction, you are now on ROUND 2 (College Project Details):
         - Acknowledge their introduction briefly and formally (e.g. "Thank you for the self-introduction. We will now move to technical systems.").
         - Ask them to describe ONE major collegiate project, mini-project, or lab engineering exercise they worked on. Ask them to clearly specify their individual role and what core technologies were used.
         
      2. Since they explained their project, you are now on ROUND 3 (Core Engineering Concept from ${branch}):
         - Acknowledge their project overview concisely (e.g. "Understood. Thank you for the project summary.").
         - Ask them to explain a fundamental technical concept in their field to test their theoretical grasp, such as:
           * If CSE/IT: "Could you explain the difference between a frontend framework and a backend database service?"
           * If ECE: "Could you outline the core difference between an analog signal and a digital signal?"
           * If EEE: "Could you articulate the main difference between AC power and DC power?"
           * If Mechanical: "Could you describe the basic working cycle of a four-stroke internal combustion engine?"
           * If Other/General: "Could you explain any fundamental concept or definition related to the ${branch} branch?"
         - Ask them to explain it clearly in simple business terms.
         
      3. Since they answered the basic concept, you are now on ROUND 4 (Teamwork & Conflict Scenario):
         - Acknowledge their explanation directly (e.g. "Alright, thank you for explaining that concept.").
         - Ask a standard behavioral conflict scenario: "In a corporate team at ${company}, you may encounter varying opinions during project execution. If you and a teammate have contrasting technical ideas, how do you resolve it professionally?"
         
      If they have answered 4 or more rounds, politely bring the conversation to a formal close:
      "Thank you for completing this assessment today. We have completed all 4 scheduled corporate interview rounds. Please click the 'Evaluate Interview' button below to submit your interview transcripts to our candidate evaluation dashboard for a comprehensive, genuine scoring and professional breakdown. Have a great day!"
      
      Ask EXACTLY ONE response. Do not output any thinking or meta text. Do not use markdown backticks around the response.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
    });

    const question = response.text?.trim() || getFallbackHRQuestion(company, Math.floor(updatedHistory.length / 2) + 1, branch);

    res.json({
      question,
      sessionMessages: [...updatedHistory, { role: "model", text: question }],
      isLiveAI: true
    });
  } catch (err) {
    console.warn("Gemini HR Next (Quota/Rate-Limit fallback):", err instanceof Error ? err.message : err);
    const roundNo = Math.floor(updatedHistory.length / 2) + 1;
    const question = getFallbackHRQuestion(company, roundNo, branch);
    res.json({
      question,
      sessionMessages: [...updatedHistory, { role: "model", text: question }],
      isLiveAI: false,
      warning: "Error fetching live response. Continuing with simulated prompt."
    });
  }
});

// 6. HR Interview - Final Feedback & Evaluation
app.post("/api/hr-interview/feedback", async (req, res) => {
  const { company, branch, messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid messages parameter" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      ...getMockHRFeedback(messages, company, branch),
      isLiveAI: false
    });
  }

  try {
    const formattedTranscript = messages
      .map(m => `${m.role === "user" ? "Candidate" : "HR Recruiter"}: ${m.text}`)
      .join("\n\n");

    const prompt = `
      You are a professional, objective Senior HR Director and Lead Auditing Panelist evaluating a candidate's placement mock interview transcript.
      The candidate is applying to ${company} and is a ${branch} engineering student.
      Your core mission is to evaluate their answers strictly, genuinely, and truthfully. Provide an authentic representation of standard corporate placement selection criteria.
      
      Interview Transcript:
      \"\"\"
      ${formattedTranscript}
      \"\"\"

      SCORING MATRIX & CRITERIA:
      - Score ranges from 0 to 100 representing raw industrial employment readiness.
      - If the candidate answers are extremely brief (e.g. 1-5 words, e.g. "student", "yes", "i don't know", "my project is good"), repetitious, or lazy: give a strict score of 15 to 45.
      - If the candidate presents average answers but with major structural, grammatical, or technical description gaps: give a realistic score of 45 to 65.
      - Only if the candidate structures their thoughts clearly, names relevant tools/libraries, explains technical concepts correctly, and demonstrates proactive collaboration: give a professional score of 70 to 95.
      - Never inflate scores. The score must reflect their genuine verbal behavior and commitment!

      Provide a comprehensive, objective feedback evaluation in JSON matching this schema exactly:
      {
        "score": number (an integer score 0-100 representing standard placement selection readiness under strict criteria),
        "strengths": array of strings (3 real strengths identified or praise of specific areas, quoting or referencing their statements when possible),
        "weaknesses": array of strings (3 professional growth opportunities or candid developmental areas representing communication, detail, or grammar gaps),
        "improvements": array of objects describing professional corporate rewrites:
          [
            {
              "question": "The corporate HR question asked",
              "answer": "Candidate's actual response text",
              "constructiveRewrite": "A highly polished, structured, and formal professional corporate response that the student should study and learn (using terms like STAR format where applicable)"
            }
          ],
        "tamilLanguageTips": "Direct, practical advice on English corporate phrase patterns, vocabulary builders, and transitions to help Tier-2/3 candidates express themselves on the job.",
        "verdict": "A brief, clear corporate recruitment verdict (e.g., 'Selected', 'Awaiting further preparation', 'Needs rigorous technical and verbal practice')."
      }
      
      Output ONLY valid, parseable JSON conforming strictly to the schema.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            improvements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  constructiveRewrite: { type: Type.STRING }
                },
                required: ["question", "answer", "constructiveRewrite"]
              }
            },
            tamilLanguageTips: { type: Type.STRING },
            verdict: { type: Type.STRING }
          },
          required: ["score", "strengths", "weaknesses", "improvements", "tamilLanguageTips", "verdict"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Null response");
    const parsed = JSON.parse(resultText);
    res.json({ ...parsed, isLiveAI: true });
  } catch (err) {
    console.warn("Gemini HR Feedback (Quota/Rate-Limit fallback):", err instanceof Error ? err.message : err);
    res.json({
      ...getMockHRFeedback(messages, company, branch),
      isLiveAI: false,
      warning: "Could not generate live feedback. Displaying simulated review instead."
    });
  }
});


function getFallbackHRQuestion(company: string, roundNo: number, branch: string = "Engineering"): string {
  const normalizedBranch = (branch || "Engineering").toLowerCase();
  
  if (roundNo === 1) {
    return `Good morning. Thank you for attending this placement screening session for ${company}. I am Ms. Priya Sharma, Senior HR Panel Lead. To start, could you please present a brief, professional self-introduction covering your academic background?`;
  }
  
  if (roundNo === 2) {
    return `Thank you for the self-introduction. Let's move to technical systems. Could you describe one major collegiate project, mini-project, or lab engineering exercise you worked on, highlighting your individual role and the technologies used?`;
  }
  
  if (roundNo === 3) {
    let techConcept = "how software communicates";
    if (normalizedBranch.includes("computer") || normalizedBranch.includes("it") || normalizedBranch.includes("information") || normalizedBranch.includes("cse")) {
      techConcept = "the operational difference between a frontend framework and a backend database service";
    } else if (normalizedBranch.includes("ece") || normalizedBranch.includes("electronic") || normalizedBranch.includes("communication")) {
      techConcept = "the difference between an analog signal and a digital signal, and why signal conversion is necessary";
    } else if (normalizedBranch.includes("eee") || normalizedBranch.includes("electrical")) {
      techConcept = "the functional difference between AC and DC power transmission";
    } else if (normalizedBranch.includes("mechanical") || normalizedBranch.includes("mech")) {
      techConcept = "the thermodynamic cycle of a simple four-stroke engine";
    } else if (normalizedBranch.includes("civil")) {
      techConcept = "the load-bearing differences between concrete and structural steel";
    }
    
    return `Understood. Thank you for the project overview. Let's proceed to the theoretical aspect. Could you explain ${techConcept} clearly in standard business terms?`;
  }
  
  // Round 4 or more
  return `Thank you for the conceptual explanation. Finally, let's address professional team dynamics. In a corporate environment, teammates often have contrasting technical ideas. How do you resolve such professional conflicts to ensure project success?`;
}

function getMockHRFeedback(messages: any[], company: string, branch: string): any {
  // Extract user messages for dynamic evaluation mapping
  const userAnswers = messages.filter(m => m.role === "user");
  const modelQuestions = messages.filter(m => m.role === "model");

  // Dynamic score calculator based on candidate effort & responsiveness
  let totalWords = 0;
  userAnswers.forEach(ans => {
    const text = ans.text || "";
    totalWords += text.split(/\s+/).filter(Boolean).length;
  });

  const avgWords = userAnswers.length > 0 ? (totalWords / userAnswers.length) : 0;
  
  // Calculate a strict, genuine score
  let score = 30; // low effort base
  let verdictScoreLabel = "Needs rigorous technical and verbal practice";
  
  if (userAnswers.length === 0) {
    score = 0;
    verdictScoreLabel = "Incomplete Interview - No Responses Detected";
  } else if (avgWords < 5) {
    // Extremely brief/one-word answers (e.g. "yes", "my project", "i don't know")
    score = Math.floor(25 + Math.random() * 15); // 25-40
    verdictScoreLabel = "Unsatisfactory - Responses lack professional core structure and depth";
  } else if (avgWords < 12) {
    // Barely answering in short phrases
    score = Math.floor(45 + Math.random() * 15); // 45-60
    verdictScoreLabel = "Awaiting further preparation - Brief conceptual grasp with structural communication gaps";
  } else {
    // Solid responses
    score = Math.min(Math.floor(70 + (avgWords - 12) * 1.5 + Math.random() * 8), 95); // Up to 95 max
    verdictScoreLabel = score >= 85 ? "Selected - Strong technical articulation and solid behavioral structure" : "Provisionally Selected - Good conceptual foundation with minute polish needed";
  }

  const improvements = userAnswers.map((ans, idx) => {
    const qText = modelQuestions[idx]?.text || "Tell me about your technical background.";
    const aText = ans.text || "...";
    return {
      question: qText,
      answer: aText,
      constructiveRewrite: `To structure this professionally utilizing the STAR method, state: "In my academic laboratory courses, I actively developed a ${branch} project using industry-standard tools. My individual contribution was implementing... which resulted in..." This articulates your skill with professional clarity.`
    };
  });

  // Strengths and weaknesses dynamically customized to build genuine improvement directions
  const strengths = [
    "Followed the sequential 4-round formal presentation format.",
    avgWords >= 12 ? "Expressed core academic and technical attributes with appropriate detail." : "Attempted the mock interview to test placement baseline.",
    "Exhibited a polite, industry-aligned posture with business topics."
  ];

  const weaknesses = [
    avgWords < 12 ? "Responses are extremely brief. Standard corporate HR screens require candidate answers of at least 30-45 seconds in duration to assess competence." : "Can refine the integration of exact analytical frameworks in technical definitions.",
    "Ensure clear, professional syntax with specialized key terminology from the branch.",
    "Focus on describing concrete personal contributions rather than general team functions."
  ];

  return {
    score,
    strengths,
    weaknesses,
    improvements: improvements.length > 0 ? improvements : [
      {
        question: "Please introduce yourself formally.",
        answer: userAnswers[0]?.text || "No response provided",
        constructiveRewrite: `State: "Good morning. I am a graduate of ${branch} engineering, focused on active academic research and systems development in my main technical domain."`
      }
    ],
    tamilLanguageTips: "To speak confidently in business interviews, prepare solid professional drafts beforehand. Highlight relevant tool names, clarify individual achievements, and use connectors like 'firstly, secondly, and consequently' to structure long answers.",
    verdict: verdictScoreLabel
  };
}


// Helper mock fallback validator
function getMockValidationResult(text: string, company: string): any {
  // Simple heuristic checks for mock scoring
  let score = 55; // base
  const resumeLower = text.toLowerCase();
  
  if (resumeLower.includes("react") || resumeLower.includes("angular") || resumeLower.includes("vue")) score += 8;
  if (resumeLower.includes("node") || resumeLower.includes("express") || resumeLower.includes("python")) score += 8;
  if (resumeLower.includes("sql") || resumeLower.includes("database") || resumeLower.includes("mongodb")) score += 6;
  if (resumeLower.includes("project")) score += 10;
  if (resumeLower.includes("internship")) score += 10;
  
  // Cutoffs
  let cgpaLimit = 6.0;
  if (company === "Zoho") cgpaLimit = 7.0;
  if (company === "TCS") cgpaLimit = 6.0;
  if (company === "L&T") cgpaLimit = 7.5;
  if (company === "Infosys") cgpaLimit = 6.0;
  if (company === "Wipro") cgpaLimit = 6.0;

  // Extract pseudo CGPA
  let parsedCGPA = 7.5;
  const gpaMatch = text.match(/cgpa:?\s*(\d+(\.\d+)?)/i) || text.match(/gpa:?\s*(\d+(\.\d+)?)/i);
  if (gpaMatch && gpaMatch[1]) {
    parsedCGPA = parseFloat(gpaMatch[1]);
  }

  const passedCgpa = parsedCGPA >= cgpaLimit;
  if (passedCgpa) {
    score += 8;
  } else {
    score -= 15;
  }

  if (score > 100) score = 97;
  if (score < 10) score = 15;

  const requirementsMap: { [key: string]: string[] } = {
    TCS: ["Java/C++ programming", "Basic SQL queries", "Data structures", "Aptitude agility", "Good communication"],
    Zoho: ["Strong problem solving", "Core DSA", "C/C++ or Java expertise", "App building knowledge", "Database concepts"],
    Infosys: ["Enterprise programming", "Web dev foundations", "Cloud basics", "Critical thinking"],
    Wipro: ["Functional programming", "Operating system concepts", "Agile awareness", "Technical debugging"],
    "L&T": ["Core engineering background", "Embedded/power systems basics", "MATLAB or CAD basics", "Analytical reasoning"]
  };

  const req = requirementsMap[company] || ["Aptitude", "Project work", "Coding"];
  const matchingSkills = req.filter(sk => resumeLower.includes(sk.split(" ")[0].toLowerCase()));
  const missingSkills = req.filter(sk => !resumeLower.includes(sk.split(" ")[0].toLowerCase()));

  return {
    score,
    company,
    cgpaValidation: {
      passed: passedCgpa,
      cutoff: cgpaLimit,
      message: passedCgpa 
        ? `Passed! Your evaluated CGPA of ${parsedCGPA} is above the ${cgpaLimit} cutoff threshold for ${company}.`
        : `Ineligible or high risk. Your evaluated CGPA of ${parsedCGPA} is below the ${cgpaLimit} cutoff for ${company}.`
    },
    keyFeedback: [
      `Your projects describe several technical applications, but can utilize stronger action verbs of impact.`,
      `Resume includes ${matchingSkills.length} key alignment factors for ${company} recruitment.`,
      `Ensure full formatting matches Anna University's placement standards (e.g., standard layout, font guidelines).`
    ],
    matchingSkills,
    missingSkills: missingSkills.length > 0 ? missingSkills : ["No major missing skills identified"],
    projectFeedback: `The listed project components are decent, but they should emphasize numeric value metrics (e.g. \"improved efficiency by 20%\" or \"reduced databases load delays\"). Incorporate architectural detail like your API mechanisms or framework choices.`,
    actionItems: [
      `Add the following skills to address alignment gaps: ${missingSkills.slice(0, 2).join(", ")}.`,
      `Incorporate a clear "Achievements / Academic Honors" category highlighting Anna University scores if available.`,
      `Refine sentences using the STAR format (Situation, Task, Action, Result) to maximize impact.`
    ],
    isLiveAI: false
  };
}

// Fallback adaptive questions generator
function getFallbackAdaptiveQuestions(branch: string, weakTopic: string): any[] {
  return [
    {
      id: `fallback_${Date.now()}_1`,
      category: "technical",
      topic: weakTopic,
      questionText: `Which of the following describes a foundational system model related to "${weakTopic}"?`,
      questionTextTamil: `"${weakTopic}" தொடர்பான அடிப்படை முறைமை மாதிரியை விவரிப்பது எது?`,
      options: [
        "Optimal predictive planning index",
        "Deterministic states recursion",
        "Linear systems response validation",
        "Asymptotic behavior optimization"
      ],
      optionsTamil: [
        "சிறந்த முன்கணிப்பு திட்டமிடல் குறியீடு",
        "நிச்சயிக்கப்பட்ட நிலைகளின் மறுநிகழ்வு",
        "நேரியல் அமைப்புகளின் மறுமொழி சரிபார்ப்பு",
        "அசிம்ப்டோடிக் நடத்தை மேம்படுத்தல்"
      ],
      correctIndex: 1,
      explanation: "Deterministic states recursion provides the primary math outline standard to configure appropriate nodes in this design category.",
      explanationTamil: "இந்த வடிவமைப்பு பிரிவில் பொருத்தமான முனைகளை கட்டமைக்க பிரதான கணித வரைபட தரநிலையை வழங்குகிறது.",
    },
    {
      id: `fallback_${Date.now()}_2`,
      category: "technical",
      topic: weakTopic,
      questionText: "What is the primary constraint while designing real-world architectures in this domain?",
      questionTextTamil: "இந்த டொமைனில் நிஜ உலக கட்டமைப்புகளை வடிவமைக்கும் போது முதன்மையான கட்டுப்பாடு எது?",
      options: [
        "Finite memory buffers size",
        "High processing latency thresholds",
        "Data synchronization boundaries",
        "All of the above"
      ],
      optionsTamil: [
        "வரையறுக்கப்பட்ட நினைவக தாங்கல் அளவு",
        "அதிவேக செயலாக்க தாமத வரம்புகள்",
        "தரவு ஒத்திசைவு எல்லைகள்",
        "மேலே உள்ள அனைத்தும்"
      ],
      correctIndex: 3,
      explanation: "Each mentioned parameter serves as an active barrier defining real-world performance constraints.",
      explanationTamil: "குறிப்பிடப்பட்ட ஒவ்வொரு அளவுருவும் நிஜ உலக செயல்திறன் கட்டுப்பாடுகளை வரையறுக்கும் செயலில் உள்ள தடையாக செயல்படுகிறது."
    }
  ];
}


// Setup Vite Dev Server / Static In Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CrackIt Backend] Running at http://localhost:${PORT}`);
  });
}

startServer();
