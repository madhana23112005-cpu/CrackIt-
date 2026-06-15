import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  Award, 
  BookOpen, 
  FileText, 
  ClipboardCheck, 
  TrendingUp, 
  Users, 
  Building, 
  Download, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Languages, 
  ExternalLink,
  ChevronRight,
  Edit,
  User,
  UserCheck,
  Trash2,
  Search,
  BookMarked,
  Hourglass,
  RefreshCw,
  Send,
  Sliders,
  Filter,
  Check,
  Percent,
  Play,
  RotateCcw,
  Brain,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldAlert
} from 'lucide-react';
import Header from './components/Header';
import AuthScreen from './components/AuthScreen';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { mockColleges, mockStudents, mockQuestions, mockTests, sampleResumes } from './mockData';
import { generateIntegratedMasterDB } from './questionGenerator';
import { StudentProfile, College, Question, MockTest, ResumeValidationResult } from './types';

const defaultCleanStudent: StudentProfile = {
  id: 'guest',
  name: 'Placement Student',
  email: '',
  collegeId: 'c1',
  collegeName: 'Affiliated College',
  branch: 'CSE',
  cgpa: 0,
  aptitudeAccuracy: 0,
  technicalAccuracy: 0,
  mockTestAverage: 0,
  resumeScore: 0,
  readinessScore: 0,
  weakTopics: [],
  strongTopics: [],
  questionsAnsweredToday: 0,
  dailyStreak: 0,
  assignedTestsIds: ['t1', 't2'],
  attendedQuestionIds: []
};

export default function App() {
  // Firebase Auth states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global States
  const [currentRole, setCurrentRole] = useState<'student' | 'tpo' | 'superadmin'>(() => {
    const saved = localStorage.getItem('crackit_user_role');
    if (saved === 'tpo' || saved === 'superadmin' || saved === 'student') {
      return saved;
    }
    return 'student';
  });

  // Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const isVerified = user && (user.emailVerified || user.email === 'madhana23112005@gmail.com');
      if (isVerified) {
        setFirebaseUser(user);
        try {
          const profileRef = doc(db, 'users', user.uid);
          let profileSnap;
          try {
            profileSnap = await getDoc(profileRef);
          } catch (getErr: any) {
            handleFirestoreError(getErr, OperationType.GET, `users/${user.uid}`);
          }

          if (profileSnap && profileSnap.exists()) {
            const data = profileSnap.data();
            let dbRole = data.role as 'student' | 'tpo' | 'superadmin';
            if (!dbRole) {
              dbRole = user.email === 'madhana23112005@gmail.com' ? 'superadmin' : 'student';
            }
            setCurrentRole(dbRole);
            localStorage.setItem('crackit_user_role', dbRole);
            localStorage.setItem('crackit_user_auth_role', dbRole);
            if (user.email) {
              localStorage.setItem('crackit_role_' + user.email.toLowerCase().trim(), dbRole);
            }
            localStorage.setItem('crackit_role_' + user.uid, dbRole);

            if (dbRole === 'student') {
              // Read values from database with fallback to 0
              let readinessVal = data.readinessScore !== undefined ? Number(data.readinessScore) : 0;
              let resumeVal = data.resumeScore !== undefined ? Number(data.resumeScore) : 0;
              let aptitudeVal = data.aptitudeAccuracy !== undefined ? Number(data.aptitudeAccuracy) : 0;
              let technicalVal = data.technicalAccuracy !== undefined ? Number(data.technicalAccuracy) : 0;
              let mockTestVal = data.mockTestAverage !== undefined ? Number(data.mockTestAverage) : 0;

              // Force-cleanse any legacy prefilled mock values (e.g. 82, 78, 85, 84, 81 from s1 model)
              if (readinessVal === 82 || resumeVal === 78 || resumeVal === 85 || aptitudeVal === 84 || technicalVal === 81) {
                readinessVal = 0;
                resumeVal = 0;
                aptitudeVal = 0;
                technicalVal = 0;
                mockTestVal = 0;
              }

              const profileStudent: StudentProfile = {
                id: user.uid,
                name: data.name,
                email: user.email || '',
                collegeId: data.collegeId || 'c1',
                branch: (data.department || data.branch || "CSE") as any,
                collegeName: data.college || data.collegeName || "Affiliated College",
                readinessScore: readinessVal,
                dailyStreak: data.dailyStreak !== undefined ? Number(data.dailyStreak) : 0,
                resumeScore: resumeVal,
                aptitudeAccuracy: aptitudeVal,
                technicalAccuracy: technicalVal,
                mockTestAverage: mockTestVal,
                weakTopics: data.weakTopics || [],
                strongTopics: data.strongTopics || [],
                questionsAnsweredToday: data.questionsAnsweredToday !== undefined ? Number(data.questionsAnsweredToday) : 0,
                attendedQuestionIds: data.attendedQuestionIds || [],
                assignedTestsIds: data.assignedTestsIds || ["t1", "t2"],
                cgpa: data.cgpa !== undefined ? Number(data.cgpa) : 0
              };
              setActiveStudent(profileStudent);
              
              // Ensure this student is dynamically appended/updated in the students list
              setStudents((prev) => {
                if (prev.some((s) => s.id === user.uid)) {
                  return prev.map((s) => s.id === user.uid ? profileStudent : s);
                }
                return [profileStudent, ...prev];
              });

              // Write sanitized default scores to Firestore if they were just cleaned or aren't present
              if (data.readinessScore === undefined || data.readinessScore === 82 || data.resumeScore === 78 || data.resumeScore === 85) {
                try {
                  const { id, ...dataToSave } = profileStudent;
                  await setDoc(profileRef, {
                    ...dataToSave,
                    uid: user.uid,
                    department: profileStudent.branch,
                    college: profileStudent.collegeName
                  }, { merge: true });
                } catch (writeErr: any) {
                  try {
                    handleFirestoreError(writeErr, OperationType.WRITE, `users/${user.uid}`);
                  } catch (processedErr: any) {
                    // Only rethrow permission errors
                    if (processedErr.message.includes('permission') || processedErr.message.includes('insufficient')) {
                      throw processedErr;
                    }
                    console.warn("Firestore default profile sync delayed (running offline).");
                  }
                }
              }
            } else {
              // Populate TPO admin name and college info dynamically
              setActiveStudent((prev) => ({
                ...prev,
                id: user.uid,
                name: `${data.name} (${dbRole === 'superadmin' ? 'Superadmin' : 'TPO'})`,
                collegeName: data.college || "Affiliated College"
              }));
            }
          } else {
            const savedRole = localStorage.getItem('crackit_user_role');
            if (savedRole === 'tpo' || savedRole === 'superadmin' || savedRole === 'student') {
              setCurrentRole(savedRole);
            } else {
              setCurrentRole('student');
            }
          }
        } catch (err: any) {
          console.warn("Offline fallback profile loading initialized:", err.message || err);
          // GRACEFUL OFFLINE FALLBACK: If Firestore cannot be accessed,
          // restore cached roles and build offline profiles so the user isn't stuck.
          const emailKey = user.email ? user.email.toLowerCase().trim() : '';
          let savedRole = (localStorage.getItem('crackit_role_' + emailKey) || localStorage.getItem('crackit_role_' + user.uid) || localStorage.getItem('crackit_user_role') || 'student') as 'student' | 'tpo' | 'superadmin';
          if (user.email === 'madhana23112005@gmail.com') {
            savedRole = 'superadmin';
          }
          setCurrentRole(savedRole);

          const fallbackName = user.email ? user.email.split('@')[0].split(/[._-]/).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : "Placement Student";

          if (savedRole === 'student') {
            const profileStudent: StudentProfile = {
              id: user.uid,
              name: fallbackName,
              email: user.email || '',
              collegeId: 'c1',
              branch: "CSE",
              collegeName: "Affiliated College",
              readinessScore: 0,
              dailyStreak: 0,
              resumeScore: 0,
              aptitudeAccuracy: 0,
              technicalAccuracy: 0,
              mockTestAverage: 0,
              weakTopics: [],
              strongTopics: [],
              questionsAnsweredToday: 0,
              attendedQuestionIds: [],
              assignedTestsIds: ["t1", "t2"],
              cgpa: 0
            };
            setActiveStudent(profileStudent);

            setStudents((prev) => {
              if (prev.some((s) => s.id === user.uid)) {
                return prev.map((s) => s.id === user.uid ? { ...s, name: fallbackName } : s);
              }
              return [profileStudent, ...prev];
            });
          } else {
            setActiveStudent((prev) => ({
              ...prev,
              id: user.uid,
              name: `${fallbackName} (${savedRole === 'superadmin' ? 'Superadmin' : 'TPO'})`,
              collegeName: "Affiliated College"
            }));
          }
        }
      } else {
        setFirebaseUser(null);
        setCurrentRole('student');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const [language, setLanguage] = useState<'english' | 'tamil'>('english');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'practice' | 'mocktests' | 'resumelab' | 'leaderboard' | 'hr-interview'>('dashboard');
  
  // AI HR Interview Simulator States
  const [hrCompany, setHrCompany] = useState<string>('TCS');
  const [hrMessages, setHrMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [hrInputValue, setHrInputValue] = useState<string>('');
  const [hrLoading, setHrLoading] = useState<boolean>(false);
  const [isHrInterviewActive, setIsHrInterviewActive] = useState<boolean>(false);
  const [hrFeedback, setHrFeedback] = useState<any | null>(null);
  const [hrFeedbackLoading, setHrFeedbackLoading] = useState<boolean>(false);
  const [isSpeakEnabled, setIsSpeakEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  
  // Data States
  const [students, setStudents] = useState<StudentProfile[]>(mockStudents);
  const [colleges, setColleges] = useState<College[]>(mockColleges);
  const [questions, setQuestions] = useState<Question[]>(generateIntegratedMasterDB());
  const [tests, setTests] = useState<MockTest[]>(mockTests);
  const [isEditingCgpa, setIsEditingCgpa] = useState(false);
  const [cgpaInput, setCgpaInput] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  
  // Active Student State (Default to clean slate student to avoid pre-loaded fake/mock metrics)
  const [activeStudent, setActiveStudent] = useState<StudentProfile>(defaultCleanStudent);

  // Save student profile properties and metrics to Firestore
  const saveStudentProfile = async (profile: StudentProfile) => {
    if (!profile.id) return;
    
    // Always sync locally first for high availability offline
    try {
      localStorage.setItem('crackit_cached_profile_' + profile.id, JSON.stringify(profile));
    } catch (e) {
      console.warn("Could not cache profile locally:", e);
    }

    try {
      const profileRef = doc(db, 'users', profile.id);
      const { id, ...dataToSave } = profile;
      await setDoc(profileRef, {
        ...dataToSave,
        uid: profile.id,
        department: profile.branch,
        college: profile.collegeName
      }, { merge: true });
    } catch (err: any) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${profile.id}`);
      } catch (processedErr: any) {
        // Only rethrow permission errors
        if (processedErr.message.includes('permission') || processedErr.message.includes('insufficient')) {
          throw processedErr;
        }
        console.warn("Firestore profile write deferred (running offline). State is cached in local storage.");
      }
    }
  };

  // 1. Practice Tab States
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceRound, setPracticeRound] = useState<1 | 2 | 3>(1);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [selectedPracticeAnswers, setSelectedPracticeAnswers] = useState<{ [qId: string]: number }>({});
  const [practiceExplaining, setPracticeExplaining] = useState<{ [qId: string]: boolean }>({});
  const [practiceExplanations, setPracticeExplanations] = useState<{ [qId: string]: { text: string; isLive: boolean } }>({});
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [generationAlert, setGenerationAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completedPracticeScores, setCompletedPracticeScores] = useState<{ [round: number]: number }>({ 1: 0, 2: 0, 3: 0 });
  const [hasCompletedAllRounds, setHasCompletedAllRounds] = useState(false);

  // 2. Resume Lab States
  const [resumeText, setResumeText] = useState('');
  const [targetCompany, setTargetCompany] = useState<string>('Zoho');
  const [isValidatingResume, setIsValidatingResume] = useState(false);
  const [validationResult, setValidationResult] = useState<
    (ResumeValidationResult & { isLiveAI?: boolean; warning?: string }) | null
  >(null);

  // 3. Mock Test States
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testAnswers, setTestAnswers] = useState<{ [qIndex: number]: number }>({});
  const [testTimeLeft, setTestTimeLeft] = useState(0);
  const [testTimerId, setTestTimerId] = useState<number | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{ score: number; total: number; correctAnswersCount: number; answersMap: { [key: number]: number } } | null>(null);
  const [reviewingTestId, setReviewingTestId] = useState<string | null>(null);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  // 4. TPO Admin States
  const [tpoSelectedCollege, setTpoSelectedCollege] = useState('ceg');
  const [tpoSearchQuery, setTpoSearchQuery] = useState('');
  const [tpoBranchFilter, setTpoBranchFilter] = useState<'ALL' | 'CSE' | 'ECE' | 'EEE'>('ALL');
  const [tpoStatusFilter, setTpoStatusFilter] = useState<'ALL' | 'READY' | 'TRAINING'>('ALL');
  const [displayNotification, setDisplayNotification] = useState<string | null>(null);
  const [assignedTestInputs, setAssignedTestInputs] = useState<string[]>([]);

  // 5. Super Admin (Madhan) States
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeTpo, setNewCollegeTpo] = useState('');
  const [newCollegeLocation, setNewCollegeLocation] = useState('');
  const [newCollegeStudentCount, setNewCollegeStudentCount] = useState(150);

  // Reset practiceRound and answers when the active student changes
  useEffect(() => {
    setPracticeRound(1);
    setSelectedPracticeAnswers({});
    setPracticeExplanations({});
    setCompletedPracticeScores({ 1: 0, 2: 0, 3: 0 });
    setHasCompletedAllRounds(false);
  }, [activeStudent.id]);

  // Load / Sync active student default set of questions based on round
  useEffect(() => {
    let rawSet: Question[] = [];
    const attendedIds = activeStudent.attendedQuestionIds || [];

    if (practiceRound === 1) {
      // Round 1: Aptitude + Technical
      const branchSpecific = questions.filter(
        q => q.category === 'technical' && q.branchKey === activeStudent.branch && !attendedIds.includes(q.id)
      );
      const generalApt = questions.filter(q => q.category === 'aptitude' && !attendedIds.includes(q.id));
      rawSet = [...generalApt, ...branchSpecific];
    } else if (practiceRound === 2) {
      // Round 2: Communication
      rawSet = questions.filter(q => q.category === 'communication' && !attendedIds.includes(q.id));
    } else if (practiceRound === 3) {
      // Round 3: HR
      rawSet = questions.filter(q => q.category === 'hr' && !attendedIds.includes(q.id));
    }

    // Deduplicate rawSet
    const uniqueMap = new Map<string, Question>();
    rawSet.forEach(q => uniqueMap.set(q.id, q));
    let uniqueList = Array.from(uniqueMap.values());

    // If we have fewer than 25 unique non-repeated questions, fallback to allow recycled questions (from entire category pool)
    if (uniqueList.length < 25) {
      let recycleSource: Question[] = [];
      if (practiceRound === 1) {
        const branchSpecific = questions.filter(
          q => q.category === 'technical' && q.branchKey === activeStudent.branch
        );
        const generalApt = questions.filter(q => q.category === 'aptitude');
        recycleSource = [...generalApt, ...branchSpecific];
      } else if (practiceRound === 2) {
        recycleSource = questions.filter(q => q.category === 'communication');
      } else if (practiceRound === 3) {
        recycleSource = questions.filter(q => q.category === 'hr');
      }
      
      // Merge with those not already in uniqueList
      recycleSource.forEach(q => {
        if (!uniqueMap.has(q.id)) {
          uniqueMap.set(q.id, q);
        }
      });
      uniqueList = Array.from(uniqueMap.values());
    }
    
    // Choose exactly 25 non-repeated, unique questions for each round
    const distinctSet = [...uniqueList].sort(() => Math.random() - 0.5).slice(0, 25);
    
    setPracticeQuestions(distinctSet);
    setCurrentPracticeIndex(0);
  }, [activeStudent.id, activeStudent.branch, practiceRound, questions]);

  // Handle Mock Test Timer
  useEffect(() => {
    if (isTestRunning && testTimeLeft > 0) {
      const timer = window.setInterval(() => {
        setTestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitMockTestDirectly();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isTestRunning, testTimeLeft]);

  // Show persistent feedback
  const showToast = (msg: string) => {
    setDisplayNotification(msg);
    setTimeout(() => {
      setDisplayNotification(null);
    }, 4000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('crackit_user_auth_role');
      localStorage.removeItem('crackit_user_role');
      setCurrentRole('student');
      showToast(language === 'tamil' ? 'வெற்றிகரமாக வெளியேறியது!' : 'Logged out successfully!');
    } catch (error) {
      showToast('Error logging out.');
    }
  };

  // 1. Adaptive daily practicing
  const handleAnswerSelection = (optionIndex: number) => {
    const activeQuestion = practiceQuestions[currentPracticeIndex];
    if (!activeQuestion) return;

    // Save choice
    setSelectedPracticeAnswers(prev => ({
      ...prev,
      [activeQuestion.id]: optionIndex
    }));

    // Update active student scores dynamically to simulate real-time learning!
    const isCorrect = optionIndex === activeQuestion.correctIndex;
    
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === activeStudent.id) {
          const totalAnswered = student.questionsAnsweredToday + 1;
          
          // Increment accuracy slightly for simulated growth
          let apt = student.aptitudeAccuracy;
          let tech = student.technicalAccuracy;
          
          if (activeQuestion.category === 'aptitude' || activeQuestion.category === 'communication') {
            const currentCorrectRatio = (apt / 100) * 10;
            const updatedRatio = isCorrect ? currentCorrectRatio + 1 : currentCorrectRatio;
            apt = Math.min(100, Math.round(((updatedRatio) / 11) * 100));
          } else {
            const currentCorrectRatio = (tech / 100) * 10;
            const updatedRatio = isCorrect ? currentCorrectRatio + 1 : currentCorrectRatio;
            tech = Math.min(100, Math.round(((updatedRatio) / 11) * 100));
          }

          // Calculate readiness score
          const readiness = Math.round((apt + tech + student.mockTestAverage + student.resumeScore) / 4);

          const updatedProfile: StudentProfile = {
            ...student,
            questionsAnsweredToday: totalAnswered,
            aptitudeAccuracy: apt,
            technicalAccuracy: tech,
            readinessScore: readiness
          };

          // Synchronize active student component as well
          setTimeout(() => {
            setActiveStudent(updatedProfile);
            saveStudentProfile(updatedProfile);
          }, 0);
          return updatedProfile;
        }
        return student;
      })
    );
  };

  // Get Step-by-Step AI Explanation from server
  const handleGetAIExplanation = async (question: Question, chosenIndex: number) => {
    if (practiceExplanations[question.id]) return; // already loaded

    setPracticeExplaining(prev => ({ ...prev, [question.id]: true }));
    
    try {
      const response = await fetch('/api/adaptive-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.questionText,
          chosenAnswer: question.options[chosenIndex],
          correctAnswer: question.options[question.correctIndex],
          category: question.category,
          topic: question.topic,
          explanationEn: question.explanation,
          language: language
        })
      });

      const data = await response.json();
      setPracticeExplanations(prev => ({
        ...prev,
        [question.id]: {
          text: data.explanation,
          isLive: data.isLiveAI ?? false
        }
      }));
    } catch (err) {
      console.error(err);
      setPracticeExplanations(prev => ({
        ...prev,
        [question.id]: {
          text: language === 'tamil' ? question.explanationTamil || question.explanation : question.explanation,
          isLive: false
        }
      }));
    } finally {
      setPracticeExplaining(prev => ({ ...prev, [question.id]: false }));
    }
  };

  // Clear voice when leaving tab or component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Text-to-Speech function for professional avatar narration
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!isSpeakEnabled) return;

    const cleaned = text.replace(/[\*_`#\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleaned);
    
    // Select quality online/system English voice (prefer female to represent Priya Sharma)
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Priya') || v.name.includes('Female'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Elegant professional pitch
    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-Text function
  const handleToggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(language === 'tamil' ? 'உங்கள் பிரவுசரில் குரல் பதிவு ஆதரவு இல்லை.' : 'Speech recognition is not fully supported in this browser. Please use Chrome.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e: any) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript + ' ';
        }
        setHrInputValue(transcript.trim());
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Start Open-Ended AI HR Interview Simulator
  const handleStartHrInterview = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setHrLoading(true);
    setHrMessages([]);
    setHrFeedback(null);
    setIsHrInterviewActive(true);

    try {
      const response = await fetch("/api/hr-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: hrCompany,
          branch: activeStudent.branch,
          resumeText: sampleResumes[activeStudent.branch] || ""
        })
      });
      const data = await response.json();
      let questionText = "";
      if (data.sessionMessages && data.sessionMessages.length > 0) {
        setHrMessages(data.sessionMessages);
        questionText = data.sessionMessages[data.sessionMessages.length - 1].text;
      } else if (data.question) {
        setHrMessages([{ role: "model", text: data.question }]);
        questionText = data.question;
      }
      if (questionText) {
        setTimeout(() => speakText(questionText), 400);
      }
    } catch (err) {
      console.error("Start HR Interview Error:", err);
      // fallback
      const fallbackQ = `Good morning! Welcome to your friendly placement practice session with ${hrCompany}. Please feel completely relaxed! To start, could you please tell me your brief self-introduction?`;
      setHrMessages([{ role: "model", text: fallbackQ }]);
      setTimeout(() => speakText(fallbackQ), 400);
    } finally {
      setHrLoading(false);
    }
  };

  // Submit Candidate Response and fetch next HR Recruiter prompt
  const handleNextHrTurn = async (passedAnswer?: string) => {
    const finalVal = passedAnswer !== undefined ? passedAnswer : hrInputValue;
    if (!finalVal.trim() || hrLoading) return;
    const userAns = finalVal.trim();
    setHrInputValue('');

    // Ensure we stop recording when sending answer
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentMsgs = [...hrMessages, { role: 'user' as const, text: userAns }];
    setHrMessages(currentMsgs);
    setHrLoading(true);

    try {
      const response = await fetch("/api/hr-interview/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: hrCompany,
          branch: activeStudent.branch,
          resumeText: sampleResumes[activeStudent.branch],
          messages: currentMsgs.slice(0, -1),
          latestAnswer: userAns
        })
      });

      const data = await response.json();
      let nextQuestion = "";
      if (data.sessionMessages) {
        setHrMessages(data.sessionMessages);
        nextQuestion = data.sessionMessages[data.sessionMessages.length - 1].text;
      } else if (data.question) {
        setHrMessages([...currentMsgs, { role: 'model' as const, text: data.question }]);
        nextQuestion = data.question;
      }
      if (nextQuestion) {
        setTimeout(() => speakText(nextQuestion), 400);
      }
    } catch (err) {
      console.error("Next HR Question Error:", err);
      // local mockup fallback next question
      const nextFallback = "Understood. How do you plan to handle fast-paced pressure of corporate project deadlines?";
      setHrMessages([...currentMsgs, { role: 'model' as const, text: nextFallback }]);
      setTimeout(() => speakText(nextFallback), 400);
    } finally {
      setHrLoading(false);
    }
  };

  // Complete HR Interview and fetch automated actionable analysis
  const handleCompleteHrInterview = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (hrLoading || hrFeedbackLoading) return;
    setHrFeedbackLoading(true);

    try {
      const response = await fetch("/api/hr-interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: hrCompany,
          branch: activeStudent.branch,
          messages: hrMessages
        })
      });
      const data = await response.json();
      setHrFeedback(data);
      setIsHrInterviewActive(false);
    } catch (err) {
      console.error("Evaluate HR Interview Error:", err);
      // Setup dynamic offline mockup
      const mockFeedback = {
        score: 75,
        strengths: [
          "Demonstrated genuine confidence when explaining academic concepts.",
          "Expressed great interest to align with corporate performance demands.",
          "Exhibited sincere eagerness to acquire and master internal workflow tools."
        ],
        weaknesses: [
          "Need to practice structured STAR (Situation, Task, Action, Result) storytelling templates for behavioral situations.",
          "Answers could benefit from including concrete metrics like loading speeds or output accuracy ratios."
        ],
        improvements: hrMessages.filter(m => m.role === 'user').map((m, idx) => ({
          question: hrMessages.filter(m => m.role === 'model')[idx]?.text || "Tell me about yourself.",
          answer: m.text,
          constructiveRewrite: "Present your narrative using the STAR methodology: 'For my final-year project, our Objective was to reduce runtime errors. I was Tasked with the core script caching. I took Action by using a custom key-value store, which Resulted in a 40% loading speed improvement.'"
        })),
        tamilLanguageTips: "ஆங்கிலத்தில் பேசும்போது பதற்றத்தைக் குறைக்க, நிதானமாகப் பேசுங்கள். 'Specifically', 'For instance...' போன்ற எளிய இணைப்புச் சொற்களைப் பயன்படுத்தி உங்கள் கருத்துக்களைத் தெளிவுபடுத்துங்கள்.",
        verdict: "Strong cultural fit with good active listining. Focus on structuring responses incrementally."
      };
      setHrFeedback(mockFeedback);
      setIsHrInterviewActive(false);
    } finally {
      setHrFeedbackLoading(false);
    }
  };

  // Generate 5 Custom Adaptive Questions with Gemini
  const handleGenerateAdaptiveQuestions = async () => {
    const topicToQuery = customTopic.trim() || activeStudent.weakTopics[0] || "Placement Aptitude";
    setIsGeneratingCustom(true);
    setGenerationAlert(null);

    try {
      const response = await fetch('/api/adaptive-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: activeStudent.branch,
          weakTopic: topicToQuery
        })
      });

      if (!response.ok) throw new Error("Server error generating questions");

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(prev => [...data.questions, ...prev]);
        setPracticeQuestions(data.questions);
        setCurrentPracticeIndex(0);
        setSelectedPracticeAnswers({});
        setPracticeExplanations({});
        
        setGenerationAlert({
          type: 'success',
          message: `${language === 'tamil' ? 'அடாப்டிவ் கேள்விகள் வெற்றிகரமாக உருவாக்கப்பட்டது!' : 'Adaptive Questions Generated!'} (${data.isLiveAI ? 'Live Gemini AI' : 'Offline Engine'})`
        });
        showToast(language === 'tamil' ? 'புதிய கேள்விகள் தயாராக உள்ளன!' : 'AI generated daily custom practice set loaded!');
      } else {
        throw new Error("No questions retrieved from Gemini");
      }
    } catch (err) {
      console.error(err);
      setGenerationAlert({
        type: 'error',
        message: 'Could not connect to online AI generator. Displaying offline tailored question pool.'
      });
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  // Handle completing a practice round and progressing with scores
  const handleCompleteRound = (completedRound: 1 | 2 | 3) => {
    // 1. Calculate accuracy/score for this completedRound
    const roundCorrectCount = practiceQuestions.filter(
      q => selectedPracticeAnswers[q.id] === q.correctIndex
    ).length;
    const roundScorePct = Math.round((roundCorrectCount / practiceQuestions.length) * 100);

    // Save score in completedPracticeScores
    setCompletedPracticeScores(prev => ({
      ...prev,
      [completedRound]: roundScorePct
    }));

    // 2. Mark this round questions' IDs as attended so they are never repeated
    const updatedAttended = [...(activeStudent.attendedQuestionIds || [])];
    practiceQuestions.forEach(q => {
      if (!updatedAttended.includes(q.id)) {
        updatedAttended.push(q.id);
      }
    });

    const updatedProfile = {
      ...activeStudent,
      attendedQuestionIds: updatedAttended
    };

    setStudents(prev => prev.map(s => s.id === activeStudent.id ? updatedProfile : s));
    setActiveStudent(updatedProfile);
    saveStudentProfile(updatedProfile);

    // 3. Move to next round or finish cycle
    if (completedRound < 3) {
      const nextRound = (completedRound + 1) as 1 | 2 | 3;
      setPracticeRound(nextRound);
      setSelectedPracticeAnswers({});
      showToast(language === 'tamil' ? `சுற்று ${nextRound} தொடங்குகிறது!` : `Initiating Round ${nextRound}!`);
    } else {
      // Finished all 3 rounds!
      setHasCompletedAllRounds(true);
      showToast(language === 'tamil' ? `அடாப்டிவ் பயிற்சியின் அனைத்து சுற்றுகளும் வெற்றிகரமாக முடிவடைந்தன!` : `Excellent! All 3 adaptive rounds successfully completed!`);
    }
  };

  // 2. Resume Labs Actions
  const handleLoadSampleResume = (type: 'highQuality' | 'lowQuality') => {
    setResumeText(sampleResumes[type]);
    showToast(language === 'tamil' ? 'மாதிரி விவரக்குறிப்பு ஏற்றப்பட்டது!' : `Sample resume successfully populated!`);
  };

  const handleValidateResume = async () => {
    if (!resumeText.trim()) {
      showToast(language === 'tamil' ? 'விவரக்குறிப்பு உரையை உள்ளிடவும்!' : 'Please write or paste your resume content first!');
      return;
    }

    setIsValidatingResume(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/resume-validator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          company: targetCompany
        })
      });

      const data = await response.json();
      setValidationResult(data);

      // Dynamically update user profile metrics
      if (data.score) {
        setStudents(prevStudents => 
          prevStudents.map(student => {
            if (student.id === activeStudent.id) {
              const updatedResumeScore = data.score;
              const readiness = Math.round((student.aptitudeAccuracy + student.technicalAccuracy + student.mockTestAverage + updatedResumeScore) / 4);
              const updatedProfile = {
                ...student,
                resumeScore: updatedResumeScore,
                readinessScore: readiness
              };
              setTimeout(() => {
                setActiveStudent(updatedProfile);
                saveStudentProfile(updatedProfile);
              }, 0);
              return updatedProfile;
            }
            return student;
          })
        );
        showToast(language === 'tamil' ? 'மறுவிவரக்குறிப்பு மதிப்பீடு முடிந்தது!' : `Evaluation complete! Score: ${data.score}/100 updated in dashboard.`);
      }
    } catch (err) {
      console.error(err);
      showToast('Validation failed to connect to recruitment server.');
    } finally {
      setIsValidatingResume(false);
    }
  };

  // 3. Mock Test Actions
  const handleStartMockTest = (test: MockTest) => {
    // Collect questions matching this company constraints
    const companyProfile = test.company;
    let attendedIds = activeStudent.attendedQuestionIds || [];
    
    // Filter questions specific to this company (TCS, Zoho, etc.) that haven't been completed yet
    let pool = questions.filter(q => {
      const isCompanyMatch = q.company === test.company;
      return isCompanyMatch && !attendedIds.includes(q.id);
    });
    
    // If we have fewer than 15 company-specific questions non-attended, mix with general aptitude or branch-specific non-attended
    if (pool.length < 15) {
      const fallback = questions.filter(q => {
        const isEligible = q.category === 'aptitude' || (q.category === 'technical' && q.branchKey === activeStudent.branch);
        return isEligible && !attendedIds.includes(q.id) && !pool.some(pq => pq.id === q.id);
      });
      pool = [...pool, ...fallback];
    }
    
    // If still less than 15, let us clear attended check for company specific questions so user can solve them again
    if (pool.length < 15) {
      const companyAll = questions.filter(q => q.company === test.company);
      companyAll.forEach(q => {
        if (!pool.some(pq => pq.id === q.id)) {
          pool.push(q);
        }
      });
    }

    // If still less than 15, allow any matching category questions
    if (pool.length < 15) {
      const generalAll = questions.filter(q => q.category === 'aptitude' || (q.category === 'technical' && q.branchKey === activeStudent.branch));
      generalAll.forEach(q => {
        if (!pool.some(pq => pq.id === q.id)) {
          pool.push(q);
        }
      });
    }
    
    // Shuffle and pick exactly 15 unique, completely distinct questions
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    let finalTestSet = shuffled.slice(0, 15);
    
    setTestQuestions(finalTestSet);
    setTestAnswers({});
    setTestTimeLeft(test.durationMins * 60);

    // Save selected question IDs to prevent duplicate loading in any future practices or different mock tests
    const newlyAttended = [...attendedIds];
    finalTestSet.forEach(q => {
      if (!newlyAttended.includes(q.id)) {
        newlyAttended.push(q.id);
      }
    });

    const updatedProfile = {
      ...activeStudent,
      attendedQuestionIds: newlyAttended
    };

    setStudents(prev => prev.map(s => s.id === activeStudent.id ? updatedProfile : s));
    setActiveStudent(updatedProfile);
    saveStudentProfile(updatedProfile);
    
    // Dynamically adjust totalQuestions to represent the actual unique questions pool size
    const dynamicTest: MockTest = {
      ...test,
      totalQuestions: finalTestSet.length
    };
    
    setActiveTest(dynamicTest);
    setIsTestRunning(true);
    setTestResult(null);
    setReviewingTestId(null);
    setCurrentTestIndex(0); // Reset progress index of Mock Test to Question 1
    showToast(`${test.title} started with ${finalTestSet.length} unique questions!`);
  };

  const selectTestAnswer = (qIndex: number, optIndex: number) => {
    setTestAnswers(prev => ({
      ...prev,
      [qIndex]: optIndex
    }));
  };

  const submitMockTestDirectly = () => {
    if (!activeTest) return;

    let correctCount = 0;
    testQuestions.forEach((q, idx) => {
      if (testAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const evaluatedScore = Math.round((correctCount / testQuestions.length) * 100);

    // Save final stats in active student history
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === activeStudent.id) {
          // Average older test average with new state
          const oldAvg = student.mockTestAverage;
          const newAvg = oldAvg === 0 ? evaluatedScore : Math.round((oldAvg + evaluatedScore) / 2);
          const readiness = Math.round((student.aptitudeAccuracy + student.technicalAccuracy + newAvg + student.resumeScore) / 4);
          
          // Track attended question IDs (prevent duplicates)
          const oldAttended = student.attendedQuestionIds || [];
          const newAttended = [...oldAttended];
          testQuestions.forEach(q => {
            const origId = q.id;
            if (!newAttended.includes(origId)) {
              newAttended.push(origId);
            }
          });

          const updatedProfile = {
            ...student,
            mockTestAverage: newAvg,
            readinessScore: readiness,
            attendedQuestionIds: newAttended
          };
          setTimeout(() => {
            setActiveStudent(updatedProfile);
            saveStudentProfile(updatedProfile);
          }, 0);
          return updatedProfile;
        }
        return student;
      })
    );

    // Write score inside activeTest scores parameter to see updates in leaderboard/Reports
    setTests(prevTests => 
      prevTests.map(t => {
        if (t.id === activeTest.id) {
          return {
            ...t,
            scores: {
              ...t.scores,
              [activeStudent.id]: evaluatedScore
            }
          };
        }
        return t;
      })
    );

    setTestResult({
      score: evaluatedScore,
      total: testQuestions.length * 10,
      correctAnswersCount: correctCount,
      answersMap: testAnswers
    });

    setIsTestRunning(false);
    showToast(`Test submission recorded! Evaluated score: ${evaluatedScore}%`);
  };

  // 4. TPO Admin updates
  const handleAssignTestToAll = (testId: string) => {
    // Add logic to include this test in students profile assignedTestsIds
    setStudents(prev => 
      prev.map(st => {
        if (st.collegeId === tpoSelectedCollege) {
          if (!st.assignedTestsIds.includes(testId)) {
            return {
              ...st,
              assignedTestsIds: [...st.assignedTestsIds, testId]
            };
          }
        }
        return st;
      })
    );
    showToast(`Company mock test assigned to all ${tpoSelectedCollege.toUpperCase()} batch students!`);
  };

  const handleExportBatchReports = () => {
    // Download fake CSV trigger with actual student data!
    const activeCollege = colleges.find(c => c.id === tpoSelectedCollege);
    const collegeStudents = students.filter(s => s.collegeId === tpoSelectedCollege);
    
    let csvContent = "data:text/csv;charset=utf-8,Student Name,Branch,CGPA,Aptitude,Technical,Resume,Placement Readiness\n";
    collegeStudents.forEach(st => {
      csvContent += `"${st.name}","${st.branch}",${st.cgpa},${st.aptitudeAccuracy}%,${st.technicalAccuracy}%,${st.resumeScore}%,${st.readinessScore}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeCollege?.name.replace(/\s+/g, "_")}_Placement_Readiness_Batch_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`CSV Data report downloaded for ${collegeStudents.length} candidates!`);
  };

  // 5. Super Admin Actions
  const handleAddCollegeCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName || !newCollegeTpo) {
      showToast("Please enter name and TPO officer details.");
      return;
    }

    const nextId = `clg_${Date.now()}`;
    const newClg: College = {
      id: nextId,
      name: newCollegeName,
      location: newCollegeLocation || 'Tamil Nadu',
      studentCount: Number(newCollegeStudentCount) || 120,
      tpoName: newCollegeTpo,
      averageReadiness: 60
    };

    setColleges(prev => [...prev, newClg]);
    setNewCollegeName('');
    setNewCollegeTpo('');
    setNewCollegeLocation('');
    showToast(`New affiliated campus ${newClg.name} added into Super Admin control board.`);
  };

  // Calculate Tamil strings helper mapping
  const t = (enKey: string, tamilKey: string) => {
    return language === 'tamil' ? tamilKey : enKey;
  };

  // Auth Screen Gates
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center" id="auth-loading">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 tracking-wide">
          {language === 'tamil' ? 'அங்கீகார நிலையைச் சரிபார்க்கிறது...' : 'Verifying placement session credentials...'}
        </p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <AuthScreen 
        language={language}
        setLanguage={setLanguage}
        showToast={showToast}
        displayNotification={displayNotification}
      />
    );
  }

  // Render content according to tabs
  return (
    <div id="crackit-container" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 transition-colors duration-300">
      
      {/* HEADER BAR */}
      <Header 
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          localStorage.setItem('crackit_user_role', role);
          showToast(`Switched view context to: ${role === 'superadmin' ? 'Madhan (Super)' : role === 'tpo' ? 'TPO Admin Portal' : 'Student Dashboard'}`);
        }}
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          showToast(lang === 'tamil' ? 'மொழியாக்கம் தமிழிற்கு மாற்றப்பட்டது' : 'Language switched to English');
        }}
        studentName={activeStudent.name}
        onLogout={handleLogout}
        allowRoleSwitch={localStorage.getItem('crackit_user_auth_role') !== 'student' || firebaseUser?.email === 'madhana23112005@gmail.com'}
      />

      {/* TOAST PANEL */}
      {displayNotification && (
        <div id="toast-notif" className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-in max-w-sm">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold leading-snug">{displayNotification}</span>
        </div>
      )}

      {/* TWO COLUMN WORKSPACE GRID WITH SIDE NAV */}
      <div className="flex-1 flex flex-col md:flex-row max-w-8xl w-full mx-auto p-4 md:p-6 lg:p-8 gap-6">
        
        {/* LEFT NAV PANEL - Styled with theme guidelines (Professional Polish) */}
        {currentRole === 'student' && (
          <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">
                {t('MAIN PORTAL', 'முதன்மைப் பகுதி')}
              </span>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-5 h-5 opacity-80" />
                <span>{t('Dashboard', 'முகப்பு தகவல்கள்')}</span>
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  activeTab === 'practice'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-5 h-5 opacity-80" />
                <span>{t('Adaptive Practice', 'தினசரி தியரி')}</span>
              </button>

              <button
                onClick={() => setActiveTab('mocktests')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  activeTab === 'mocktests'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ClipboardCheck className="w-5 h-5 opacity-80" />
                <span>{t('Mock Tests', 'மாதிரித் தேர்வுகள்')}</span>
              </button>

              <button
                onClick={() => setActiveTab('resumelab')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  activeTab === 'resumelab'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 opacity-80" />
                <span>{t('Resume Validator', 'விவரக்குறிப்பு ஆய்வு')}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('hr-interview');
                  // Trigger reset of session when tab is selected, if they want
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  activeTab === 'hr-interview'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Brain className="w-5 h-5 opacity-80 animate-pulse text-indigo-600" />
                <span>{t('AI HR Simulator', 'ஏஐ மனிதவள நேர்காணல்')}</span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className="w-5 h-5 opacity-80" />
                <span>{t('Leaderboard', 'தரவரிசைப் பட்டியல்')}</span>
              </button>
            </div>

            {/* Quick Profile Overview inside Navigation Sidebar */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl p-5 border border-slate-800 flex flex-col gap-4 mt-2">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 leading-none">
                  {t('PLACEMENT READINESS', 'தயார்நிலை தகுதி')}
                </p>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-3xl font-extrabold text-white">{activeStudent.readinessScore}</span>
                  <span className="text-sm font-medium text-indigo-300">/ 100</span>
                </div>
              </div>

              {/* Responsive Mini SVG Progress Track */}
              <div className="w-full h-2 bg-indigo-950/80 rounded-full overflow-hidden border border-indigo-900">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all duration-1000"
                  style={{ width: `${activeStudent.readinessScore}%` }}
                />
              </div>

              <div className="text-[11px] leading-relaxed text-indigo-200">
                {activeStudent.readinessScore >= 75 
                  ? t("⭐ Excellent progress! You meet CGPA and skill cutoffs for most companies.", "⭐ அற்புதம்! நிறுவனங்களின் அடிப்படை தேவைகளை நீங்கள் பூர்த்தி செய்கிறீர்கள்.")
                  : t("⚠️ Focus on increasing composite resume score and mock test performance.", "⚠️ உங்கள் விவரக்குறிப்பு மதிப்பெண்ணை அதிகரிக்க இன்னும் கவனம் செலுத்தவேண்டும்.")
                }
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{t('Daily Streak', 'தினசரி சாதனைகள்')}:</span>
                  <span className="font-bold text-emerald-400">{activeStudent.dailyStreak} 🔥 days</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* MAIN BODY LAYOUT ENGINE */}
        <main className="flex-1 min-w-0">
          
          {/* STUDENT ROLE WORKSPACE */}
          {currentRole === 'student' && (
            <div className="space-y-6">

              {/* TAB 1: DASHBOARD OUTLINE */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Greeting & Quick metrics */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {t('Welcome back,', 'மீண்டும் வருக,')} {activeStudent.name}!
                      </h2>
                      <div className="text-sm text-slate-500 font-medium mt-1 space-y-1">
                        <p>
                          {t('Institution', 'முடிவுற்ற கல்வி நிறுவனம்')}: {activeStudent.collegeName} • {activeStudent.branch} {t('Branch', 'துறை')}
                        </p>
                        {isEditingCgpa ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const parsed = parseFloat(cgpaInput);
                              if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                const updatedProfile = { ...activeStudent, cgpa: parsed };
                                setStudents(prev => prev.map(s => s.id === activeStudent.id ? updatedProfile : s));
                                setActiveStudent(updatedProfile);
                                saveStudentProfile(updatedProfile);
                                setIsEditingCgpa(false);
                                showToast(t('CGPA updated successfully!', 'CGPA வெற்றிகரமாக புதுப்பிக்கப்பட்டது!'));
                              } else {
                                showToast(t('Please enter a valid CGPA decimal between 0 and 10.', '0 முதல் 10 வரை சரியான CGPA ஐ உள்ளிடவும்.'));
                              }
                            }}
                            className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 mt-1 animate-fade-in"
                          >
                            <span className="text-[11px] text-slate-500 font-bold">{t('Enter CGPA (0.0 - 10.0):', 'CGPA உள்ளிடவும் (0.0 - 10.0):')}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={cgpaInput}
                              onChange={(e) => setCgpaInput(e.target.value)}
                              placeholder="e.g. 8.5"
                              className="w-16 px-2 py-0.5 bg-white border border-slate-350 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                            >
                              {t('Save', 'சேமி')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingCgpa(false)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors"
                            >
                              {t('Cancel', 'ரத்து')}
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{t('Academic CGPA Score', 'கல்வி CGPA மதிப்பெண்')}: <strong>{activeStudent.cgpa > 0 ? activeStudent.cgpa.toFixed(2) : t('Not set (0.00)', 'பதிவு செய்யப்படவில்லை')}</strong></span>
                            <button
                              onClick={() => {
                                setCgpaInput(activeStudent.cgpa > 0 ? String(activeStudent.cgpa) : '');
                                setIsEditingCgpa(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all rounded-lg px-2 py-0.5 cursor-pointer ml-1"
                            >
                              <Edit className="w-3 h-3" />
                              <span>{t('Change CGPA', 'மாற்று')}</span>
                            </button>

                            {resetConfirm ? (
                              <div className="inline-flex items-center gap-1.5 ml-0 sm:ml-2 mt-1 sm:mt-0 animate-pulse">
                                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-0.5">
                                  {t('Are you sure?', 'நிச்சயமாக?')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const resetProfile = {
                                      ...activeStudent,
                                      readinessScore: 0,
                                      resumeScore: 0,
                                      aptitudeAccuracy: 0,
                                      technicalAccuracy: 0,
                                      mockTestAverage: 0,
                                      weakTopics: [],
                                      strongTopics: [],
                                      dailyStreak: 0,
                                      questionsAnsweredToday: 0,
                                      attendedQuestionIds: []
                                    };
                                    setStudents(prev => prev.map(s => s.id === activeStudent.id ? resetProfile : s));
                                    setActiveStudent(resetProfile);
                                    saveStudentProfile(resetProfile);
                                    setResetConfirm(false);
                                    showToast(t('Performance metrics reset to 0%! You can now evaluate yourself.', 'செயல்திறன் அளவீடுகள் 0% ஆக மீட்டமைக்கப்பட்டன! இப்போது நீங்கள் உங்களை மதிப்பீடு செய்யலாம்.'));
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                                >
                                  {t('Yes', 'ஆம்')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setResetConfirm(false)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                >
                                  {t('No', 'இல்லை')}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setResetConfirm(true)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all rounded-lg px-2 py-0.5 cursor-pointer ml-0 sm:ml-2 mt-1 sm:mt-0"
                                title={t('Clear and start with fresh evaluations', 'மதிப்பீட்டைத் துடைத்து 0% இலிருந்து தொடங்கவும்')}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{t('Reset Analytics (0%)', 'மதிப்பீட்டை மீட்டமை')}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>{t('Active campus batch recruitment is Live', 'வளாக ஆட்சேர்ப்பு செயல்படுகிறது')}</span>
                    </div>
                  </div>

                  {/* BENTO GRID: Placement Readiness Composite breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Component Card 1: Resume Rating */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest/50">{t('RESUME EVALUATION', 'விவரக்குறிப்பு மதிப்பீடு')}</p>
                          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{activeStudent.resumeScore}%</h3>
                        </div>
                        <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl border border-indigo-100">
                          <FileText className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${activeStudent.resumeScore}%` }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2.5">{t('ATS target: 75% cutoff clearance', 'இலக்கு: 75% அல்லது அதற்கும் மேலே')}</p>
                    </div>

                    {/* Component Card 2: Aptitude Core */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest/50">{t('APTITUDE ACCURACY', 'கணிதத் திறன் துல்லியம்')}</p>
                          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{activeStudent.aptitudeAccuracy}%</h3>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${activeStudent.aptitudeAccuracy}%` }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2.5">{t('Includes Pipes, Logic & Relations', 'லாஜிக்கல் மற்றும் ஆப்டிடியூட்')}</p>
                    </div>

                    {/* Component Card 3: Technical Skills Core */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest/50">{t('TECHNICAL THEORY', 'தொழில்நுட்பத் திறன்')}</p>
                          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{activeStudent.technicalAccuracy}%</h3>
                        </div>
                        <div className="bg-cyan-50 text-cyan-700 p-2.5 rounded-xl border border-cyan-100">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${activeStudent.technicalAccuracy}%` }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2.5">{t(`Tailored for ${activeStudent.branch} curriculum`, `${activeStudent.branch} பாடத்திட்டம்`)}</p>
                    </div>

                    {/* Component Card 4: Mock Test Performance */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest/50">{t('MOCK TIMED AVERAGES', 'மாதிரித் தேர்வு சராசரி')}</p>
                          <h3 className="text-2xl font-extrabold text-slate-800 mt-2">{activeStudent.mockTestAverage}%</h3>
                        </div>
                        <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-100">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${activeStudent.mockTestAverage}%` }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2.5">{t('Average of taken target mocks', 'வகைப்படுத்தப்பட்ட மாதிரி சராசரி')}</p>
                    </div>

                  </div>

                  {/* TWO MODULE GRID: PRACTICE SET OVERVIEW & TARGET COMPANY ALIGNMENTS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left: Daily Practice Core Info */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">{t("Today's Adaptive Quiz Plan", "இன்றைய தினசரித் தேர்வுப் பட்டியல்")}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {t("Tailored feedback generated every 24 hours based on past weak performance.", "முந்தைய தவறுகளின் அடிப்படையில் ஒவ்வொரு 24 மணி நேரத்திற்கும் உருவாக்கப்படுகிறது.")}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                            <BookMarked className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-700">
                              {t(`Weak Areas Targeting: ${activeStudent.weakTopics.slice(0, 2).join(', ')}`, `பலவீனமான தலைப்புகள்: ${activeStudent.weakTopics.slice(0, 2).join(', ')}`)}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {t(`${practiceQuestions.length} practice questions remaining for today`, `${practiceQuestions.length} உங்களின் புதிய பயிற்சி கேள்விகள் மீதமுள்ளவை`)}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveTab('practice')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1 shrink-0"
                        >
                          <span>{t('Practice Now', 'பயிற்சியைத் தொடங்கு')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Diagnostic details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-indigo-50/20">
                          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest block">{t('STRONG AREAS', 'வலிமையான பகுதிகள்')}</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {activeStudent.strongTopics && activeStudent.strongTopics.length > 0 ? (
                              activeStudent.strongTopics.map((top, idx) => (
                                <span key={idx} className="bg-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded border border-slate-100 shadow-sm">{top}</span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[10px] font-bold italic">{t('None yet. Practice to evaluate!', 'இன்னும் ஏதுமில்லை. மதிப்பிட பயிற்சி செய்க!')}</span>
                            )}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-rose-50/20">
                          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest block">{t('WEAK AREAS NEEDING WORK', 'கவனம் செலுத்த வேண்டியவை')}</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {activeStudent.weakTopics && activeStudent.weakTopics.length > 0 ? (
                              activeStudent.weakTopics.map((top, idx) => (
                                <span key={idx} className="bg-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded border border-slate-100 shadow-sm">{top}</span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[10px] font-bold italic">{t('None identified yet. Answer quizzes!', 'இன்னும் ஏதுமில்லை. வினாடி வினாக்களுக்கு பதிலளிக்கவும்!')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: College Top Companies Minimum Cutoffs overview */}
                    <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                      <div className="relative z-10">
                        <h3 className="font-bold text-sm tracking-wide text-slate-400 uppercase">{t('Eligibility Status Checked', 'நிறுவனங்களின் தகுதி வரம்புகள்')}</h3>
                        
                        <div className="space-y-4 mt-5">
                          {[
                            { name: 'Zoho', cgpa: 7.0, skills: 'C++, Data Structures, OOPs' },
                            { name: 'TCS', cgpa: 6.0, skills: 'Java, Aptitude Agile, SQL' },
                            { name: 'L&T', cgpa: 7.5, skills: 'Core Electrical, MATLAB' },
                            { name: 'Infosys', cgpa: 6.0, skills: 'JS, Web Dev' },
                          ].map((comp, idx) => {
                            const isEligible = activeStudent.cgpa >= comp.cgpa;
                            return (
                              <div key={idx} className="flex items-center justify-between border-b border-slate-800 pb-2.5 last:border-0 last:pb-0">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white">{comp.name}</span>
                                    <span className="text-[10px] text-slate-400 border border-slate-700 px-1.5 py-0.2 md:py-0.5 rounded leading-none">
                                      CGPA: {comp.cgpa}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 block mt-0.5 max-w-[200px] truncate">{comp.skills}</span>
                                </div>
                                <div>
                                  {isEligible ? (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                      {t('Eligible', 'தகுதியுடையது')}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
                                      {t('Low CGPA', 'சிறிய குறைவு')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: ADAPTIVE PRACTICE HUB */}
              {activeTab === 'practice' && (
                <div className="space-y-6 animate-fade-in" id="adaptive-practice-tab">
                  
                  {/* GENERATION BAR: Allow Custom Topics with Gemini */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800">{t('Tailored AI Content Generator', 'செயற்கை நுண்ணறிவு வினாக்கள் உருவாக்குனர்')}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('Connects server-side to Gemini API to synthesize high-yield mock problems centered precisely on your specified technical/math weaknesses.', 'உங்களின் விருப்ப தலைப்புகளை அடிப்படையாக கொண்டு ஜெமினி ஏஐ மூலம் தனிப்பயனாக்கப்பட்ட கேள்விகளை உருவாக்கலாம்.')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl py-3 pl-10 pr-4 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={t(`Specify weak topic (e.g. "Dynamic Programming", "Power Electronics", "Pipes")`, 'தலைப்பை குறிப்பிடவும் (எ.கா., "Dynamic Programming")')}
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                      <button
                        onClick={handleGenerateAdaptiveQuestions}
                        disabled={isGeneratingCustom}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all shrink-0 flex items-center justify-center gap-2"
                      >
                        {isGeneratingCustom ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{t('Generating with Gemini...', 'ஜெமினி செயலாக்குகிறது...')}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-indigo-200" />
                            <span>{t('Synthesize 5 Customized Questions', 'புதிய 5 வினாக்களை உருவாக்கு')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {generationAlert && (
                      <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        generationAlert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'bg-red-50 text-red-800 border border-red-150'
                      }`}>
                        {generationAlert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                        <span>{generationAlert.message}</span>
                      </div>
                    )}
                  </div>

                  {hasCompletedAllRounds ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-2xl mx-auto text-center animate-fade-in" id="practice-scorecard">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
                        <Award className="w-10 h-10 text-emerald-600 animate-pulse" />
                      </div>
                      
                      <h3 className="text-2xl font-extrabold text-slate-800">
                        {t('Practice Cycle Mastered!', 'அடாப்டிவ் பயிற்சி வெற்றிகரமாக நிறைவடைந்தது!')}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                        {t('You have successfully tested your skills across all 3 key placement validation rounds with completely fresh questions.', 'முற்றிலும் புதிய வினாக்களைக் கொண்டு 3 முக்கிய வேலைவாய்ப்பு சுற்றுகளிலும் உங்கள் திறனை வெற்றிகரமாக நிரூபித்துள்ளீர்கள்.')}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 shadow-sm">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-1">
                            {t('ROUND 1', 'சுற்று 1')}
                          </span>
                          <span className="text-xs font-bold text-slate-700 block truncate font-sans">
                            {t('Aptitude & Technical', 'ஆப்டிடியூட் & தொழில்நுட்பம்')}
                          </span>
                          <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
                            {completedPracticeScores[1]}%
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 shadow-sm">
                          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block mb-1">
                            {t('ROUND 2', 'சுற்று 2')}
                          </span>
                          <span className="text-xs font-bold text-slate-700 block truncate font-sans">
                            {t('Communication', 'தொடர்புத் திறன்')}
                          </span>
                          <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
                            {completedPracticeScores[2]}%
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 shadow-sm">
                          <span className="text-[10px] font-extrabold text-violet-600 uppercase tracking-wider block mb-1">
                            {t('ROUND 3', 'சுற்று 3')}
                          </span>
                          <span className="text-xs font-bold text-slate-700 block truncate font-sans">
                            {t('HR Interview', 'மனிதவள நேர்காணல்')}
                          </span>
                          <div className="text-2xl font-black text-slate-800 mt-2 font-mono">
                            {completedPracticeScores[3]}%
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-150 p-5 mt-6 text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-600">
                            {t('Overall Mastery Average', 'ஒட்டுமொத்த சராசரி தகுதி')}
                          </span>
                          <span className="text-sm font-black text-indigo-700 font-mono">
                            {Math.round((completedPracticeScores[1] + completedPracticeScores[2] + completedPracticeScores[3]) / 3)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.round((completedPracticeScores[1] + completedPracticeScores[2] + completedPracticeScores[3]) / 3)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setHasCompletedAllRounds(false);
                            setPracticeRound(1);
                            setCompletedPracticeScores({ 1: 0, 2: 0, 3: 0 });
                            setSelectedPracticeAnswers({});
                            showToast(language === 'tamil' ? 'புதிய வினாக்களுடன் சுற்று 1 தொடங்குகிறது!' : 'Initiating fresh Round 1 with brand new questions!');
                          }}
                          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-indigo-200 shrink-0" />
                          <span>{t('Train Again: Load Fresh Questions', 'புதிய வினாக்களுடன் மீண்டும் பயிற்சி செய்')}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* MULTI-ROUND ADAPTIVE STEPPER */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    {[
                      { 
                        id: 1 as 1 | 2 | 3, 
                        title: t('Round 1: Aptitude & Technical', 'சுற்று 1: திறனறிவு & தொழில்நுட்பம்'),
                        desc: t('Targeting core math and branch topics', 'கணிதம் மற்றும் துறை சார்ந்த பகுதிகள்'),
                        icon: Brain,
                        color: 'indigo'
                      },
                      { 
                        id: 2 as 1 | 2 | 3, 
                        title: t('Round 2: Communication Skills', 'சுற்று 2: தகவல் தொடர்புத் திறன்'),
                        desc: t('Vocabulary, grammar, and verbal logic', 'சொல்லகராதி, இலக்கணம் மற்றும் வாய்மொழி தர்க்கம்'),
                        icon: MessageSquare,
                        color: 'emerald'
                      },
                      { 
                        id: 3 as 1 | 2 | 3, 
                        title: t('Round 3: HR & Behavioral', 'சுற்று 3: எச்.ஆர் & நடத்தை தேர்வு'),
                        desc: t('Situational reasoning and cultural fit', 'சூழ்நிலை பகுப்பாய்வு மற்றும் நேர்காணல் தகுதி'),
                        icon: UserCheck,
                        color: 'violet'
                      }
                    ].map((step) => {
                      const isActive = practiceRound === step.id;
                      const IconComponent = step.icon;
                      
                      let categoryKeys: string[] = [];
                      if (step.id === 1) {
                        categoryKeys = ['aptitude', 'technical'];
                      } else if (step.id === 2) {
                        categoryKeys = ['communication'];
                      } else if (step.id === 3) {
                        categoryKeys = ['hr'];
                      }

                      // Count answered questions in active set if matched, or estimated
                      const roundAnsweredCount = Object.keys(selectedPracticeAnswers).filter(ansQId => {
                        if (practiceRound === step.id) {
                          return practiceQuestions.some(pq => pq.id === ansQId) && selectedPracticeAnswers[ansQId] !== undefined;
                        }
                        const origId = ansQId;
                        const matchQ = questions.find(q => q.id === origId);
                        return matchQ && categoryKeys.includes(matchQ.category);
                      }).length;

                      const totalQuestionsForStep = step.id === 1 
                        ? questions.filter(q => q.category === 'aptitude' || (q.category === 'technical' && q.branchKey === activeStudent.branch)).length
                        : step.id === 2 
                        ? questions.filter(q => q.category === 'communication').length
                        : questions.filter(q => q.category === 'hr').length;

                      const pct = totalQuestionsForStep > 0 ? Math.min(100, Math.round((roundAnsweredCount / totalQuestionsForStep) * 100)) : 0;

                      return (
                        <button
                          key={step.id}
                          onClick={() => {
                            setPracticeRound(step.id);
                            showToast(`Navigated to ${step.title}`);
                          }}
                          className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-lg ring-2 ring-indigo-200' 
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isActive 
                              ? 'bg-white/10 text-white' 
                              : {
                                  1: 'bg-indigo-50 text-indigo-600',
                                  2: 'bg-emerald-50 text-emerald-600',
                                  3: 'bg-violet-50 text-violet-600'
                                }[step.id]
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[9px] font-extrabold tracking-widest uppercase block ${
                              isActive ? 'text-indigo-300' : 'text-slate-400'
                            }`}>
                              {t(`ROUND ${step.id}`, `சுற்று ${step.id}`)}
                            </span>
                            <h4 className="font-bold text-xs truncate mt-0.5">{step.title}</h4>
                            <p className={`text-[10px] leading-snug mt-1 line-clamp-1 ${
                              isActive ? 'text-slate-300' : 'text-slate-400'
                            }`}>
                              {step.desc}
                            </p>
                            
                            <div className="mt-3 flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isActive ? 'bg-indigo-400' : 'bg-slate-300'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <span className="text-[9px] font-bold shrink-0">{pct}%</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ACTIVE QUIZ WIDGET */}
                  {practiceQuestions.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-250 shadow-md p-6 relative overflow-hidden">
                      
                      {/* Congratulations state when all questions are answered in active round */}
                      {practiceQuestions.filter(q => selectedPracticeAnswers[q.id] !== undefined).length === practiceQuestions.length && (
                        <div className="mb-6 p-5 bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-2xl border border-emerald-150 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-3 rounded-xl shadow-sm text-emerald-600 border border-emerald-100 shrink-0">
                              <Award className="w-6 h-6 animate-bounce" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">
                                {t(`Round ${practiceRound} Mastered!`, `சுற்று ${practiceRound} வெற்றிகரமாக நிறைவடைந்தது!`)}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {t(`You have successfully answered all ${practiceQuestions.length} adaptive challenge questions for this round.`, `இச்சுற்றின் அனைத்து ${practiceQuestions.length} அடாப்டிவ் வினாக்களுக்கும் வெற்றிகரமாக பதிலளித்துள்ளீர்கள்.`)}
                              </p>
                            </div>
                          </div>
                          {practiceRound < 3 ? (
                            <button
                              onClick={() => {
                                handleCompleteRound(practiceRound);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <span>{practiceRound === 1 ? t('Proceed to Round 2: Communication', 'சுற்று 2-க்குச் செல்லவும்') : t('Proceed to Round 3: HR Interview', 'சுற்று 3-க்குச் செல்லவும்')}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handleCompleteRound(3);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <span>{t('Finish & View Overall Scores', 'சுற்று முடிவடைந்து இறுதி மதிப்பெண் காண்க')}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Tracker */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                        <div>
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest">
                            {practiceQuestions[currentPracticeIndex]?.category.toUpperCase()} • {t('Daily adaptive challenge', 'அடாப்டிவ் தினசரிப் பயிற்சி')}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm mt-0.5">
                            {t('Topic', 'தலைப்பு')}: {practiceQuestions[currentPracticeIndex]?.topic}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-500 block">
                            {t('Question', 'வினா')} {currentPracticeIndex + 1} {t('of', 'மொத்தம்')} {practiceQuestions.length}
                          </span>
                          <span className="text-[11px] text-emerald-500 font-semibold">{t('Bilingual Enabled', 'இருமொழி விருப்பம்')}</span>
                        </div>
                      </div>

                      {/* Question Text in Selected Language */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                        <p className="text-base font-bold text-slate-800 leading-relaxed">
                          {language === 'tamil' && practiceQuestions[currentPracticeIndex]?.questionTextTamil 
                            ? practiceQuestions[currentPracticeIndex]?.questionTextTamil 
                            : practiceQuestions[currentPracticeIndex]?.questionText
                          }
                        </p>
                      </div>

                      {/* Multiple Choice Blocks */}
                      <div className="space-y-3">
                        {(language === 'tamil' && practiceQuestions[currentPracticeIndex]?.optionsTamil 
                          ? practiceQuestions[currentPracticeIndex]?.optionsTamil 
                          : practiceQuestions[currentPracticeIndex]?.options
                        )?.map((opt, oIdx) => {
                          const questionId = practiceQuestions[currentPracticeIndex].id;
                          const userSelectedIdx = selectedPracticeAnswers[questionId];
                          const correctIdx = practiceQuestions[currentPracticeIndex].correctIndex;
                          const hasAnswered = userSelectedIdx !== undefined;

                          let choiceStyle = "bg-white hover:bg-slate-50 text-slate-700 border-slate-200";
                          let statusIndicator = null;

                          if (hasAnswered) {
                            if (oIdx === correctIdx) {
                              // Always highlight the correct answer in green once answered
                              choiceStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-100";
                              statusIndicator = <CheckCircle2 className="w-4 h-4 text-emerald-600 self-center shrink-0" />;
                            } else if (oIdx === userSelectedIdx) {
                              // Highlight user's incorrect choice in red
                              choiceStyle = "bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-100";
                              statusIndicator = <XCircle className="w-4 h-4 text-rose-600 self-center shrink-0" />;
                            } else {
                              choiceStyle = "bg-slate-50 text-slate-400 border-slate-150 cursor-not-allowed opacity-60";
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={hasAnswered}
                              onClick={() => handleAnswerSelection(oIdx)}
                              className={`w-full flex justify-between p-4 rounded-xl border text-left text-sm font-semibold transition-all shadow-sm ${choiceStyle}`}
                            >
                              <div className="flex gap-3">
                                <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </div>
                              {statusIndicator}
                            </button>
                          );
                        })}
                      </div>

                      {/* ACTIVE ACTION PANEL FOR EXPLANATIONS */}
                      {selectedPracticeAnswers[practiceQuestions[currentPracticeIndex].id] !== undefined && (
                        <div className="mt-6 border-t border-slate-100 pt-5 space-y-4 animate-fade-in-up">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>
                                {selectedPracticeAnswers[practiceQuestions[currentPracticeIndex].id] === practiceQuestions[currentPracticeIndex].correctIndex 
                                  ? t('Correct Answer selected!', 'சரியான விடை!') 
                                  : t('Incorrect selection. Review guidelines below.', 'தவறான விடை. விளக்கத்தைக் காண்க.')
                                }
                              </span>
                            </div>
                            
                            <button
                              onClick={() => handleGetAIExplanation(practiceQuestions[currentPracticeIndex], selectedPracticeAnswers[practiceQuestions[currentPracticeIndex].id])}
                              disabled={practiceExplaining[practiceQuestions[currentPracticeIndex].id]}
                              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{practiceExplaining[practiceQuestions[currentPracticeIndex].id] ? t('Analyzing with Live AI...', 'ஏஐ கணக்கிடுகிறது...') : t('Get Step-by-Step AI Explanation', 'ஏஐ விளக்கம் பெறுக')}</span>
                            </button>
                          </div>

                          {/* Render explanation */}
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold leading-relaxed text-slate-700">
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block mb-1">
                              {t('EXPLANATION REFERENCE', 'விளக்கம்')}
                            </span>
                            
                            {practiceExplanations[practiceQuestions[currentPracticeIndex].id] ? (
                              <div className="space-y-2">
                                <p className="font-medium text-slate-800">{practiceExplanations[practiceQuestions[currentPracticeIndex].id].text}</p>
                                <span className="inline-flex items-center gap-1 text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-widest font-extrabold">
                                  {practiceExplanations[practiceQuestions[currentPracticeIndex].id].isLive ? 'Live Gemini AI Generated' : 'Offline Engine Fallback'}
                                </span>
                              </div>
                            ) : (
                              <p className="font-semibold text-slate-500 text-xs">
                                {language === 'tamil' && practiceQuestions[currentPracticeIndex].explanationTamil 
                                  ? practiceQuestions[currentPracticeIndex].explanationTamil 
                                  : practiceQuestions[currentPracticeIndex].explanation
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex justify-between items-center mt-8 border-t border-slate-100 pt-5">
                        <button
                          disabled={currentPracticeIndex === 0}
                          onClick={() => {
                            setCurrentPracticeIndex(prev => prev - 1);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {t('Back', 'முன்னாடி')}
                        </button>

                        {currentPracticeIndex === practiceQuestions.length - 1 ? (
                          practiceRound < 3 ? (
                            <button
                              onClick={() => {
                                handleCompleteRound(practiceRound);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-100 flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{practiceRound === 1 ? t('Proceed to Round 2: Communication', 'சுற்று 2-க்குச் செல்லவும்') : t('Proceed to Round 3: HR Interview', 'சுற்று 3-க்குச் செல்லவும்')}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handleCompleteRound(3);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-100 flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{t('Finish & View Overall Scores', 'சுற்று முடிவடைந்து இறுதி மதிப்பெண் காண்க')}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentPracticeIndex(prev => prev + 1);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{t('Next Question', 'அடுத்த வினா')}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                      <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-bold text-slate-700 text-sm">{t('No practice questions available for this topic.', 'தற்போது கேள்விகள் எதுவும் தயாராக இல்லை.')}</p>
                    </div>
                  )}
                    </>
                  )}

                </div>
              )}

              {/* TAB 3: MOCK TEST PAPERS GRID */}
              {activeTab === 'mocktests' && (
                <div className="space-y-6 animate-fade-in" id="mock-tests-tab">
                  
                  {/* Active Test Screen If Running */}
                  {isTestRunning && activeTest ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
                      
                      {/* Active header HUD */}
                      <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block">{activeTest.company} RECRUITMENT MOCK ENGINE</span>
                          <h3 className="font-extrabold text-lg text-white mt-0.5">{activeTest.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-right">
                            <span className="text-[10px] text-slate-400 block font-bold tracking-widest uppercase">{t('TIME REMAINING', 'மீதமுள்ள நேரம்')}</span>
                            <span className="text-sm font-mono font-bold text-amber-400">
                              {Math.floor(testTimeLeft / 60)}m {testTimeLeft % 60}s
                            </span>
                          </div>
                          <button
                            onClick={submitMockTestDirectly}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-950/20"
                          >
                            {t('Submit Assessment', 'தேர்வை சமர்ப்பி')}
                          </button>
                        </div>
                      </div>

                      {/* Body section: Question navigation blocks and actual test statement */}
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Question tracker list */}
                        <div className="lg:col-span-3 bg-slate-50 rounded-xl p-4 border border-slate-150 max-h-[460px] overflow-y-auto">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-3">
                            {t('TEST PROGRESS', 'கேள்வி பட்டியல்')}
                          </span>
                          <div className="grid grid-cols-4 gap-2">
                            {testQuestions.map((_, idx) => {
                              const isAnswered = testAnswers[idx] !== undefined;
                              return (
                                <button
                                  key={idx}
                                  className={`w-10 h-10 rounded-lg text-xs font-bold transition-all border flex items-center justify-center ${
                                    isAnswered 
                                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                  }`}
                                  // Jump to this test question
                                  onClick={() => {
                                    // Simulated focus to index
                                    const nextQidx = idx;
                                    setCurrentTestIndex(nextQidx);
                                    showToast(`Viewing Question ${nextQidx + 1}`);
                                  }}
                                >
                                  {idx + 1}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-5 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span>
                              <span>{t('Answered', 'விடையளிக்கப்பட்டவை')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded bg-white border border-slate-200 inline-block"></span>
                              <span>{t('Unanswered', 'விடையளிக்கப்படாதவை')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Current Mock Question Statement block */}
                        <div className="lg:col-span-9 space-y-5">
                          <div className="p-5 bg-slate-50 border border-slate-150 rounded-xl">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                              {testQuestions[currentTestIndex]?.topic || 'Quantitative Aptitude'}
                            </span>
                            <p className="text-base font-bold text-slate-800 leading-relaxed">
                              {language === 'tamil' && testQuestions[currentTestIndex]?.questionTextTamil 
                                ? testQuestions[currentTestIndex]?.questionTextTamil 
                                : testQuestions[currentTestIndex]?.questionText
                              }
                            </p>
                          </div>

                          <div className="space-y-3">
                            {(language === 'tamil' && testQuestions[currentTestIndex]?.optionsTamil 
                              ? testQuestions[currentTestIndex]?.optionsTamil 
                              : testQuestions[currentTestIndex]?.options
                            )?.map((opt, oIdx) => {
                              const isSelected = testAnswers[currentTestIndex] === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => selectTestAnswer(currentTestIndex, oIdx)}
                                  className={`w-full flex p-4 rounded-xl border text-left text-sm font-semibold transition-all shadow-sm ${
                                    isSelected 
                                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-150' 
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className="bg-slate-100 text-slate-500 border border-slate-200 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mr-3">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span className="leading-relaxed">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex justify-between items-center border-t border-slate-100 pt-5">
                            <button
                              disabled={currentTestIndex === 0}
                              onClick={() => setCurrentTestIndex(prev => prev - 1)}
                              className="px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 disabled:opacity-50"
                            >
                              {t('Previous', 'முடிந்தது')}
                            </button>
                            <button
                              disabled={currentTestIndex === testQuestions.length - 1}
                              onClick={() => setCurrentTestIndex(prev => prev + 1)}
                              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                            >
                              <span>{t('Save & Next', 'சேமித்துத் தொடர்')}</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ) : testResult ? (
                    /* Mock test results overlay dashboard */
                    <div className="bg-white rounded-2xl border border-slate-250 shadow-xl p-8 max-w-2xl mx-auto text-center space-y-6 animate-fade-in-up">
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-sm">
                        <Award className="w-8 h-8" />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{activeTest?.title} Completed!</h3>
                        <p className="text-xs text-slate-500 mt-1">Submitted in accordance with placement cells criteria.</p>
                      </div>

                      {/* Display circular score badge */}
                      <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl max-w-sm mx-auto flex items-center justify-between">
                        <div className="text-left">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">EVALUATED SCORE</span>
                          <span className="text-4xl font-black text-slate-800">{testResult.score}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">ANSWERS CORRECT</span>
                          <span className="text-base font-bold text-emerald-500">{testResult.correctAnswersCount} / {testQuestions.length}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-50/20 text-indigo-700 text-xs font-semibold border border-indigo-100 rounded-xl leading-relaxed">
                        💪 Composite score uploaded in active student profile dashboard. Practice personalized daily adaptive sets to keep scores high.
                      </div>

                      <button
                        onClick={() => {
                          setTestResult(null);
                          setActiveTest(null);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all"
                      >
                        {t('Exit Performance Portal', 'முடிவு போர்ட்டல் இருந்து வெளியேறுக')}
                      </button>
                    </div>
                  ) : (
                    /* Regular Mock Tests Lists Tab */
                    <div className="space-y-6">
                      
                      {/* Explanatory introduction card */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800">{t('Company-Specific Mock Exams', 'மாதிரி தேர்வுகள் தளம்')}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {t('We construct timed, full pattern mocks using past actual placement questionnaire guidelines of tier-1 recruiters. Performance boosts readiness accuracy indices.', 'முக்கிய நிறுவனங்களின் மாதிரித் தேர்வுகளை அதே கால அட்டவணை மற்றும் நிபந்தனைகளுடன் எழுதிப் பழகுங்கள்.')}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tests.map((test) => {
                          const userHistoricalScore = test.scores[activeStudent.id];
                          const isAssigned = activeStudent.assignedTestsIds.includes(test.id);

                          return (
                            <div 
                              key={test.id} 
                              className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-5 relative`}
                            >
                              {isAssigned && (
                                <span className="absolute top-3.5 right-3.5 bg-indigo-100 text-indigo-700 border border-indigo-250 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {t('PREVIOUS YEAR QUESTION', 'முந்தைய ஆண்டு வினா')}
                                </span>
                              )}

                              <div>
                                <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                                  test.company === 'Zoho' 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                    : test.company === 'TCS' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {test.company}
                                </span>
                                
                                <h4 className="font-extrabold text-slate-800 text-sm mt-3 leading-snug">{test.title}</h4>
                                <div className="flex gap-4 items-center text-xs text-slate-400 font-semibold mt-2">
                                  <span>⏱️ {test.durationMins} mins</span>
                                  <span>📝 {test.totalQuestions} questions</span>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                                <div>
                                  {userHistoricalScore !== undefined ? (
                                    <div>
                                      <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">{t('PREVIOUS SCORE', 'கடந்த மதிப்பெண்')}</span>
                                      <span className="text-sm font-black text-slate-800">{userHistoricalScore}%</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-semibold text-slate-400">{t('No Attempts Yet', 'முயற்சிகள் இல்லை')}</span>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleStartMockTest(test)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-extrabold px-4 py-2 flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current text-white/90" />
                                  <span>{userHistoricalScore !== undefined ? t('Re-Attempt', 'மீண்டும் எடு') : t('Take Test', 'தேர்வு எழுது')}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: COMPREHENSIVE RESUME LAB VALIDATOR */}
              {activeTab === 'resumelab' && (
                <div className="space-y-6 animate-fade-in" id="resume-validator-tab">
                  
                  {/* Explanatory banner */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800">{t('Company-Specific ATS Resume Validator', 'ஏஐ நிறுவன-வகை விவரக்குறிப்பு மதிப்பீடு')}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('Selecting a company customizes evaluated recruitment algorithms. Upload, write or load samples to audit cutoffs, format patterns, matched skills, and actionable gaps.', 'உங்களது விவரக்குறிப்பு கோப்பினை ஏற்றி, அது குறிப்பிட்ட நிறுவனங்களின் தகுதிக்கு ஏற்ப சரியாக உள்ளதா என சரிபார்த்துக்கொள்ளுங்கள்.')}
                    </p>
                  </div>

                  {/* Operational controls Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Input selector and copy-paste area */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                      
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{t('CHOOSE TARGET BRAND & TEMPLATE', 'நிறுவனம் மற்றும் வார்ப்பு')}</span>
                        {/* Preset templates for high-speed delightfully positive feedback loop */}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handleLoadSampleResume('highQuality')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-250 text-[10px] font-bold px-2 py-1 rounded transition-all shadow-sm"
                          >
                            ➕ Madhan's CSE (High Quality)
                          </button>
                          <button
                            onClick={() => handleLoadSampleResume('lowQuality')}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-250 text-[10px] font-bold px-2 py-1 rounded transition-all shadow-sm"
                          >
                            ⚠️ Abishek's ECE (Needs Fix)
                          </button>
                        </div>
                      </div>

                      {/* Dropdown company selective */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('Select target companies recruiting standard', 'இலக்கு நிறுவனத்தைத் தேர்ந்தெடுக்கவும்')}</label>
                        <select
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                          value={targetCompany}
                          onChange={(e) => setTargetCompany(e.target.value)}
                        >
                          <option value="Zoho">Zoho Corporation (Software and Product)</option>
                          <option value="TCS">TCS NQT (Mass and Digital Recruitment)</option>
                          <option value="Infosys">Infosys drives (Consultant/Developer)</option>
                          <option value="Wipro">Wipro ELITE assessment (Software/Tech)</option>
                          <option value="L&T">L&T Infotech / Core division (Structures and Circuits)</option>
                        </select>
                      </div>

                      {/* Text representation */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('Paste full Resume plain text contents', 'விவரக்குறிப்பு உரையை நகல் செய்யவம்')}</label>
                        <textarea
                          rows={11}
                          className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
                          placeholder={t("Paste text here... (or load templates from the quick button above to test instantly!)", "விவரக்குறிப்பு உரையை இங்கே ஒட்டவும்...")}
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                        />
                      </div>

                      {/* Run validate trigger */}
                      <button
                        onClick={handleValidateResume}
                        disabled={isValidatingResume}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        {isValidatingResume ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{t('AI Screening Resume against thresholds...', 'ஏஐ ஸ்கிரீனிங் நடைபெறுகிறது...')}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-indigo-200" />
                            <span>{t('Validate with AI Recruitment Model', 'ஏஐ மாதிரி பகுப்பாய்வு கணக்கிடுக')}</span>
                          </>
                        )}
                      </button>

                    </div>

                    {/* Results side panel showing ATS matching and suggestions */}
                    <div className="lg:col-span-6">
                      {validationResult ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5 animate-fade-in">
                          
                          {/* Circular Score Gauge HUD */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="text-left">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">{t('ATS BENCHMARK SCORE', 'ஒட்டுமொத்த ஏஐ மதிப்பீடு')}</span>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className={`text-4xl font-extrabold ${validationResult.score >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{validationResult.score}</span>
                                <span className="text-sm font-semibold text-slate-400">/ 100</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">{t('TARGET BRAND MATCH', 'விவரக்குறிப்பு பொருத்தம்')}</span>
                              <span className="text-sm font-bold block text-slate-700 mt-2">{validationResult.company}</span>
                            </div>
                          </div>

                          {/* CGPA Eligibility Indicator panel */}
                          <div className={`p-4 rounded-xl border flex gap-3 ${
                            validationResult.cgpaValidation.passed 
                              ? 'bg-emerald-50/40 text-emerald-800 border-emerald-150' 
                              : 'bg-rose-50/40 text-rose-800 border-rose-150'
                          }`}>
                            {validationResult.cgpaValidation.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 self-center" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 self-center" />
                            )}
                            <div className="text-xs font-semibold">
                              <span className="block font-bold uppercase tracking-wider text-[10px] text-slate-400">{t('CGPA CHECKPOINT', 'CGPA தகுதி நிலை')}</span>
                              <p className="mt-1 leading-relaxed">{validationResult.cgpaValidation.message}</p>
                            </div>
                          </div>

                          {/* Qualitative feedback items bulleted */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">{t('STRUCTURAL FEEDBACK SUMMARY', 'அமைப்பு ரீதியிலான கருத்துக்கள்')}</span>
                            <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-600 leading-relaxed font-semibold">
                              {validationResult.keyFeedback.map((fb, idx) => (
                                <li key={idx}>{fb}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Skills Grid matching / missing */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                            <div className="p-3 bg-emerald-50/20 border border-emerald-100 rounded-xl">
                              <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider block uppercase">{t('MATCHING KEYWORDS', 'பொருந்தும் திறன்கள்')}</span>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {validationResult.matchingSkills.map((sk, index) => (
                                  <span key={index} className="bg-white text-emerald-700 border border-emerald-100 text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">{sk}</span>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-xl">
                              <span className="text-[10px] font-extrabold text-indigo-600 tracking-wider block uppercase">{t('MISSING KEYWORDS WANTED', 'விடுபட்ட திறன்கள்')}</span>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {validationResult.missingSkills.map((sk, index) => (
                                  <span key={index} className="bg-white text-slate-600 border border-slate-100 text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">{sk}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Project alignment review */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">{t('PROJECT PORTFOLIO AUDIT', 'திட்டங்கள் மதிப்பாய்வு')}</span>
                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">{validationResult.projectFeedback}</p>
                          </div>

                          {/* Corrective Action plans */}
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2">{t('CORRECTIVE STEP-BY-STEP ACTION LIST', 'மேம்படுத்த அதிரடி தீர்வுகள்')}</span>
                            <div className="space-y-1.5">
                              {validationResult.actionItems.map((act, idx) => (
                                <div key={idx} className="flex gap-2.5 text-xs text-slate-700 font-semibold leading-relaxed">
                                  <span className="font-extrabold text-indigo-600">{idx + 1}.</span>
                                  <span>{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dynamic Company Specific Interview Tips */}
                          {validationResult.interviewTips && validationResult.interviewTips.length > 0 && (
                            <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-150 space-y-2">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 block">
                                  {t('COMPANY TARGET INTERVIEW TIPS', 'நிறுவன நேர்காணல் குறிப்புகள்')}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {validationResult.interviewTips.map((tip, idx) => (
                                  <div key={idx} className="flex gap-2 text-xs text-slate-700 font-semibold leading-relaxed">
                                    <span className="text-amber-500 font-bold">✦</span>
                                    <span>{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Method footer */}
                          <div className="border-t border-slate-100 pt-4.5 flex justify-between items-center text-[10px] tracking-wide text-slate-400 uppercase font-bold">
                            <span>{t('Evaluation Engine', 'மதிப்பீட்டு முறை')}</span>
                            <span className="text-indigo-600">
                              {validationResult.isLiveAI ? 'Live Gemini AI Screening' : 'Offline Heuristic Parser'}
                            </span>
                          </div>

                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
                          <Sliders className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                          <h4 className="font-bold text-slate-700 text-sm mb-1">{t('Awaiting Assessment Submission', 'மதிப்பீட்டு சமர்ப்பிப்புக்காக காத்திருக்கிறது')}</h4>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            {t('Paste plain formatting on left text area, configure targets brand, and execute the parser model to load the results.', 'விவரக்குறிப்பு உரையை ஒட்டி, பகுப்பாய்வு முடிவுகளைப் பார்க்க ஏஐ மாதிரி பகுப்பாய்வு பொத்தானை கிளிக் செய்யவும்.')}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 4.5: AI HR INTERVIEW SIMULATOR WITH LIVE SPEECH */}
              {activeTab === 'hr-interview' && (
                <div className="space-y-6 animate-fade-in" id="hr-interview-tab">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {t('Voice Enabled', 'குரல்வழி நேர்காணல்')}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            {t('Live AI Recruiter', 'ஏஐ மனிதவளம்')}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 flex items-center gap-2">
                          <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />
                          {t('Open-Ended Voice HR Interview Simulator', 'அடாப்டிவ் குரல்வழி மனிதவள நேர்காணல்')}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {t('Simulate highly interactive placement interviews with real-time Speech-to-Text translation and Text-to-Speech narration.', 'வார்த்தைகளின் நேரடி மொழிமாற்றம் மற்றும் ஏஐ குரல்வழியாக உண்மையான நேர்காணல் அனுபவத்தைப் பெறுங்கள்.')}
                        </p>
                      </div>

                      {/* Global Voice Options */}
                      <div className="flex flex-wrap items-center gap-3 bg-slate-900 text-slate-200 p-2.5 rounded-xl border border-slate-800 shadow-inner">
                        <button
                          onClick={() => {
                            setIsSpeakEnabled(!isSpeakEnabled);
                            if (isSpeakEnabled && 'speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSpeakEnabled 
                              ? 'bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 shadow-sm' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750'
                          }`}
                          title="Toggle Priya's Voice Narration"
                          id="toggle-priya-voice-btn"
                        >
                          {isSpeakEnabled ? <Volume2 className="w-4 h-4 text-white animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                          <span>{isSpeakEnabled ? t('Priya\'s Recruiter Voice: ON', 'பிரியா குரல்: ஆன்') : t('Priya\'s Recruiter Voice: MUTED', 'பிரியா குரல்: ஆஃப்')}</span>
                        </button>

                        <div className="text-[10px] text-slate-400 border-l border-slate-700 pl-3">
                          {t('Click the button above to unmute or mute Ms. Priya Sharma’s placement voice narration.', 'அதிகாரியின் குரல் ஒலிப்பைக் கேட்க மேலே உள்ள பட்டனை இயக்கவும்.')}
                        </div>
                      </div>
                    </div>

                    {/* Scenario 1: Setup State */}
                    {!isHrInterviewActive && !hrFeedback && (
                      <div className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-5">
                          <div className="space-y-2">
                            <h4 className="text-slate-800 font-extrabold text-base">
                              {t('Select Target Placement Recruiter Pattern', 'வேலைவாய்ப்பு நிறுவனத்தின் நேர்காணல் அமைப்பைத் தேர்வுசெய்க')}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {t('Our live AI generator adapts its questions, behavioral tone, and difficulty level based on actual campus questions asked by these corporate teams.', 'நிறுவனங்களின் நேர்காணல் பாணிக்கு ஏற்ப ஏஐ கேள்விகளைத் தயாரித்து வழங்கும்.')}
                            </p>
                          </div>

                          {/* Company Cards selection */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { key: 'TCS', title: 'TCS NQT', color: 'border-blue-200 hover:border-blue-500 bg-blue-50/20 text-blue-700' },
                              { key: 'Zoho', title: 'Zoho Corporation', color: 'border-red-200 hover:border-red-500 bg-red-50/20 text-red-700' },
                              { key: 'Infosys', title: 'Infosys Drive', color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/20 text-emerald-700' },
                              { key: 'Wipro', title: 'Wipro ELITE', color: 'border-amber-200 hover:border-amber-500 bg-amber-50/20 text-amber-700' },
                              { key: 'L&T', title: 'L&T Technical', color: 'border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 text-indigo-700' }
                            ].map(comp => (
                              <button
                                key={comp.key}
                                onClick={() => setHrCompany(comp.key)}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                  hrCompany === comp.key 
                                    ? 'border-indigo-650 bg-indigo-50 ring-2 ring-indigo-600/10' 
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <span className="block text-[11px] font-bold text-slate-400 capitalize">{t('Corporate Target', 'நிறுவனம்')}</span>
                                <span className="block font-bold text-slate-800 text-sm mt-0.5">{comp.title}</span>
                              </button>
                            ))}
                          </div>

                          {/* Instructions bullet points */}
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              {t('Voice Interview Instructions', 'குரல்வழி நேர்காணல் வழிமுறைகள்')}
                            </h5>
                            <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside">
                              <li>{t('Permit microphone access when prompted by the browser.', 'மைகுரோஃபோன் அனுமதியை மியூசிக் பார் மூலம் உறுதிசெய்க.')}</li>
                              <li>{t('Tap the microphone button to START speaking, speak clearly, then tap again to pause transcription.', 'பேசத் துவங்க மைக் பொத்தானை அழுத்தவும், பிறகு மீண்டும் அதை அழுத்தி உரையைச் சேமிக்கலாம்.')}</li>
                              <li>{t('Review and edit the automatic live voice transcription manually if any corrections are needed.', 'குரல்வழியாக மாற்றப்பட்ட உரையைத் தட்டச்சு செய்தும் திருத்திக் கொள்ளலாம்.')}</li>
                              <li>{t('Commit to 4 conversational rounds to unlock the deep STAR-method review portfolio.', '4 வெற்றிகரமான உரையாடல் சுற்றுகளுக்குப் பிறகு ஏஐ விரிவான மதிப்பீட்டைத் தரும்.')}</li>
                            </ul>
                          </div>

                          <button
                            onClick={handleStartHrInterview}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-150 flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <Play className="w-4 h-4 text-indigo-200" />
                            <span>{t(`Start HR Voice round for ${hrCompany}`, `நேர்காணலைத் துவங்கவும் - ${hrCompany}`)}</span>
                          </button>
                        </div>

                        {/* Banner Image representation */}
                        <div className="lg:col-span-5 flex justify-center">
                          <div className="relative p-6 bg-slate-900 rounded-2xl text-white space-y-4 max-w-sm border border-slate-800 shadow-xl">
                            <div className="absolute top-3 right-3 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Recruiter Bot 3.5
                            </div>
                            <div className="flex gap-3 items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white">
                                AI
                              </div>
                              <div>
                                <h4 className="font-bold text-sm">{t('Senior Recruiter Bot', 'மதிப்பீட்டு ஏஜெண்ட்')}</h4>
                                <p className="text-[10px] text-indigo-200">Continuous Assessment Mode</p>
                              </div>
                            </div>
                            <blockquote className="italic text-xs text-slate-300 border-l-2 border-indigo-500 pl-3">
                              "{t("Tell me about a time you handled a technical bottleneck. How did your team solve it and what was the tangible impact?", "அபாயகரமான தொழில்நுட்பத் தடையை உங்கள் குழு எவ்வாறு சமாளித்தது என்பது பற்றி விளக்குங்கள்?")}"
                            </blockquote>
                            <div className="flex gap-2 items-center text-[10px] text-slate-400">
                              <Mic className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                              <span>{t('Microphone auto-transcription enabled', 'குரல் பதிவு கண்டறிதல் தயார் நிலையில் உள்ளது')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scenario 2: Active Voice Interview Session */}
                    {isHrInterviewActive && !hrFeedback && (
                      <div className="py-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Conversation panel */}
                        <div className="lg:col-span-7 flex flex-col h-[520px] bg-slate-50 border border-slate-250 rounded-2xl overflow-hidden shadow-inner">
                          {/* Chat header */}
                          <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs text-white">
                                  {hrCompany[0]}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                              </div>
                              <div>
                                <h4 className="font-bold text-xs tracking-wide">{hrCompany} {t('Senior Recruiter bot', 'மனிதவள அதிகாரி ஏஐ')}</h4>
                                <p className="text-[9px] text-slate-400 font-mono tracking-tight">{t('Interactive placement screening session', 'நேரடி வேலைவாய்ப்பு கலந்துரையாடல்')}</p>
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-300">
                              {t('Round', 'சுற்று')} {Math.floor(hrMessages.filter(m => m.role === 'user').length) + 1}
                            </div>
                          </div>

                          {/* Messages list scroll helper */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {hrLoading && hrMessages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                                <RefreshCw className="w-8 h-8 text-indigo-650 animate-spin" />
                                <p className="text-xs text-slate-500 font-medium">
                                  {t(`Setting up placement scenario with ${hrCompany} AI engine...`, `${hrCompany} நிறுவனத்திற்கான நேர்காணல் களம் தயாராகிறது...`)}
                                </p>
                              </div>
                            ) : (
                              hrMessages.map((msg, idx) => {
                                const isUser = msg.role === 'user';
                                return (
                                  <div
                                    key={idx}
                                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                  >
                                    <div className="max-w-[85%] space-y-1">
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-400 capitalize px-1">
                                        <span>{isUser ? activeStudent.name : `${hrCompany} Recruiter`}</span>
                                        {!isUser && (
                                          <button
                                            onClick={() => speakText(msg.text)}
                                            className="text-indigo-600 hover:text-indigo-800 p-0.5"
                                            title="Speak question aloud"
                                          >
                                            <Volume2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                      <div
                                        className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm transition-all ${
                                          isUser
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-sans'
                                        }`}
                                      >
                                        {msg.text}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            {hrLoading && hrMessages.length > 0 && (
                              <div className="flex justify-start items-center gap-2 text-xs text-slate-400 pl-2">
                                <span className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></span>
                                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></span>
                                </span>
                                <span>{t('Analyzing response and generating next conversational prompt...', 'பதிலை பகுப்பாய்வு செய்து அடுத்த வினாவை தயாரிக்கிறது...')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Voice Controls Panel */}
                        <div className="lg:col-span-5 space-y-6">
                          {/* Ms. Priya Sharma - Professional Recruiter Female Representative */}
                          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white space-y-4 shadow-xl relative overflow-hidden animate-fade-in" id="recruiter-avatar-panel">
                            {/* Accent lighting elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                              {/* Avatar Visualizer representing the lady Recruiter */}
                              <div className="relative flex-shrink-0">
                                {/* Pulse glow rings mapped to status */}
                                <span className={`absolute -inset-2 rounded-full blur-sm opacity-50 transition-all duration-300 ${
                                  hrLoading 
                                    ? 'bg-amber-400 animate-pulse' 
                                    : isListening 
                                      ? 'bg-emerald-400 animate-ping' 
                                      : 'bg-indigo-400 animate-pulse'
                                }`}></span>
                                
                                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-800 ring-4 ring-slate-700 flex items-center justify-center">
                                  {/* High Fidelity Vector representing Ms. Priya Shama - Senior HR Recruiter */}
                                  <svg viewBox="0 0 100 100" className="w-14 h-14 text-indigo-100">
                                    <circle cx="50" cy="50" r="48" fill="#111827" />
                                    {/* Suit / Blazer jacket */}
                                    <path d="M22,85 C22,64 34,54 50,54 C66,54 78,64 78,85" fill="#312e81" stroke="#4f46e5" strokeWidth="1" />
                                    {/* Formal corporate blouse collar */}
                                    <path d="M42,54 L50,67 L58,54 Z" fill="#ffffff" />
                                    <path d="M46,54 L50,61 L54,54 Z" fill="#e2e8f0" />
                                    {/* Female Neck */}
                                    <rect x="46" y="44" width="8" height="11" rx="3" fill="#fbcfe8" />
                                    {/* Female Face Details */}
                                    <circle cx="50" cy="34" r="13" fill="#fbcfe8" />
                                    {/* Elegant Female Bob Haircut */}
                                    <path d="M33,33 C31,21 39,15 50,15 C61,15 69,21 67,33 C67,34 68,35 67,37 C65,28 62,21 50,21 C38,21 35,28 33,37 C32,35 33,34 33,33 Z" fill="#111827" />
                                    <path d="M33,33 C32,33 32,44 35,49 C37,51 38,39 38,33" fill="#111827" />
                                    <path d="M67,33 C68,33 68,44 65,49 C63,51 62,39 62,33" fill="#111827" />
                                    {/* Glasses indicating senior technical screening lead */}
                                    <rect x="41" y="30" width="7" height="4" rx="1.5" fill="none" stroke="#111827" strokeWidth="1.5" />
                                    <rect x="52" y="30" width="7" height="4" rx="1.5" fill="none" stroke="#111827" strokeWidth="1.5" />
                                    <line x1="48" y1="32" x2="52" y2="32" stroke="#111827" strokeWidth="1.5" />
                                    {/* Confident business lips */}
                                    <path d="M47,39 Q50,42 53,39" fill="none" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" />
                                  </svg>
                                </div>
                                
                                {/* Status indicators */}
                                <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-slate-900 rounded-full ${
                                  hrLoading 
                                    ? 'bg-amber-400 animate-pulse' 
                                    : isListening 
                                      ? 'bg-emerald-500 animate-pulse' 
                                      : 'bg-indigo-500'
                                }`}></span>
                              </div>
                              
                              <div className="text-center sm:text-left space-y-1">
                                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                                  <h4 className="font-extrabold text-sm tracking-tight text-white leading-none">Ms. Priya Sharma</h4>
                                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                                    MS, SPHR
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{t('Senior Technical HR Recruiter', 'மனிதவள முதன்மை அதிகாரி')}</p>
                                
                                <div className="pt-0.5 text-xs font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                                  {hrLoading ? (
                                    <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>Ms. Priya is scoring your responses...</span>
                                    </span>
                                  ) : isListening ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping mr-0.5"></span>
                                      <span>Ms. Priya is active & listening...</span>
                                    </span>
                                  ) : (
                                    <span className="text-indigo-300 flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                                      <span>Awaiting your answer...</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
                            <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                              <Mic className="w-5 h-5 text-indigo-600" />
                              {t('Live Voice Input Controls', 'குரல்வழி பதிவு கட்டுப்பாடுகள்')}
                            </h4>

                            {/* Waveforms & Speech status */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
                              {isListening ? (
                                <div className="space-y-3 py-2">
                                  <div className="flex justify-center items-center gap-1 h-8">
                                    {[1, 2, 3, 4, 3, 2, 1, 2, 4, 2, 1, 2, 3].map((val, i) => (
                                      <span
                                        key={i}
                                        className="w-1 bg-gradient-to-t from-indigo-500 to-indigo-700 rounded-full animate-pulse"
                                        style={{
                                          height: `${val * 6}px`,
                                          animationDelay: `${i * 0.08}s`,
                                          animationDuration: '0.6s'
                                        }}
                                      ></span>
                                    ))}
                                  </div>
                                  <p className="text-xs font-bold text-indigo-700 animate-pulse tracking-wide uppercase">
                                    {t('Listening closely... Speak your response now', 'குரலைப் பதிவு செய்கிறது... உங்கள் பதிலை பேசவும்')}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 py-4">
                                  <p className="text-xs text-slate-400 font-medium">
                                    {t('Click the microphone block, speak naturally in English, and review the converted transcript text.', 'கீழுள்ள மைக் பொத்தானை அழுத்தி, ஆங்கிலத்தில் பேசி உங்கள் பதிலை பதிவு செய்யுங்கள்.')}
                                  </p>
                                </div>
                              )}

                              {/* Massive record / mute button */}
                              <button
                                onClick={handleToggleListening}
                                disabled={hrLoading}
                                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                                  isListening 
                                    ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-100 animate-pulse' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-4 ring-indigo-50'
                                }`}
                                title={isListening ? "Stop voice listening" : "Start typing response with voice transcript"}
                              >
                                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                              </button>
                              <span className="block text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                                {isListening ? t('Stop Speech Recording', 'பதிவை நிறுத்தவும்') : t('Tap to speak answer', 'பேசுவதற்கு தட்டவும்')}
                              </span>
                            </div>

                            {/* Responsive Fallback Text Area / edit workspace */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                                {t('Voice Transcript Preview (Edit if needed)', 'மொழிமாற்றம் செய்யப்பட்ட உரை (திருத்தம் செய்யின் தட்டச்சு செய்)')}
                              </label>
                              <textarea
                                value={hrInputValue}
                                onChange={(e) => setHrInputValue(e.target.value)}
                                disabled={hrLoading}
                                placeholder={t("Spoken words appear here. You can manually edit, refine, or write additional details before submitting.", "மொழிமாற்றம் செய்யப்பட்ட உரை இங்கு தோன்றும். தேவைப்படின் திருத்திச் சமர்ப்பிக்கவும்...")}
                                className="w-full h-32 rounded-xl border border-slate-250 p-3 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none resize-none transition-all"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleNextHrTurn()}
                                disabled={hrLoading || !hrInputValue.trim() || isListening}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-150 transition-all cursor-pointer"
                                title={isListening ? "Stop voice recording first before submitting" : "Submit response"}
                              >
                                {isListening ? (
                                  <Mic className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {isListening 
                                    ? t('Listening... Stop to Submit', 'பதிவை நிறுத்தி சமர்ப்பிக்கவும்') 
                                    : t('Submit Spoken Answer', 'பதிலைச் சமர்ப்பிக்கவும்')
                                  }
                                </span>
                              </button>

                              <button
                                onClick={handleCompleteHrInterview}
                                disabled={hrLoading || hrMessages.filter(m => m.role === 'user').length < 1 || isListening}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                                title={isListening ? "Stop voice recording first before evaluating" : "Complete evaluation"}
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t('Evaluate Interview', 'நேர்காணலை முடி / மதிப்பீடு செய்க')}</span>
                              </button>
                            </div>

                            {/* Round Progress Bar */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                <span className="uppercase">{t('Interview Progress', 'நேர்காணல் முன்னேற்றம்')}</span>
                                <span>{Math.min(hrMessages.filter(m => m.role === 'user').length, 4)} / 4 Rounds</span>
                              </div>
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 transition-all duration-300" 
                                  style={{ width: `${Math.min((hrMessages.filter(m => m.role === 'user').length / 4) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scenario 3: Real Feedback & Diagnostic Evaluation Portfolio */}
                    {hrFeedback && (
                      <div className="py-2 space-y-8 animate-fade-in">
                        {/* Summary Header dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
                          <div className="md:col-span-3 text-center md:border-r md:border-slate-800 py-3">
                            <div className="relative inline-flex items-center justify-center">
                              {/* Large radial progress mock */}
                              <svg className="w-24 h-24">
                                <circle className="text-slate-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="42" cx="48" cy="48" />
                                <circle 
                                  className="text-emerald-500 transition-all duration-1000" 
                                  strokeWidth="6" 
                                  strokeDasharray={2 * Math.PI * 42}
                                  strokeDashoffset={2 * Math.PI * 42 * (1 - hrFeedback.score / 100)}
                                  strokeLinecap="round" 
                                  stroke="currentColor" 
                                  fill="transparent" 
                                  r="42" 
                                  cx="48" 
                                  cy="48" 
                                />
                              </svg>
                              <span className="absolute text-2xl font-black text-emerald-400 leading-none">{hrFeedback.score}%</span>
                            </div>
                            <span className="block text-[11px] font-extrabold tracking-widest text-slate-400 uppercase mt-2.5">
                              {t('Placement Score', 'மதிப்பீட்டு மதிப்பெண்')}
                            </span>
                          </div>

                          <div className="md:col-span-9 space-y-3.5">
                            <div>
                              <div className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {t('Verdict', 'இறுதித் தீர்ப்பு')}
                              </div>
                              <h4 className="text-lg font-bold mt-1 tracking-tight">{hrFeedback.verdict}</h4>
                            </div>

                            <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium">
                              {t(
                                `Congratulations! This recruitment assessment evaluated your voice clarity, behavioral confidence, and target corporate response frameworks. Use the diagnostics below to refine your soft skills before actual company interviews.`,
                                `வாழ்த்துகள்! உங்களின் குரல் தெளிவு, உரையாடல் தன்னம்பிக்கை மற்றும் ஏஐ தொழில்முறை பகுப்பாய்வு முடிவுகள் கீழே ஒப்பீட்டு வரைபடத்தில் கொடுக்கப்பட்டுள்ளன.`
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Strengths and developmental Areas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-emerald-50/30 border border-emerald-200 rounded-2xl p-5 space-y-4">
                            <h4 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              {t('Key Identified Strengths', 'நிறைவேற்றிய முக்கிய பலங்கள்')}
                            </h4>
                            <ul className="space-y-3">
                              {hrFeedback.strengths?.map((str: string, index: number) => (
                                <li key={index} className="text-xs text-slate-700 leading-relaxed font-semibold flex items-start gap-2">
                                  <span className="text-emerald-500 mt-0.5 font-bold">✔</span>
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-rose-50/30 border border-rose-200 rounded-2xl p-5 space-y-4">
                            <h4 className="text-sm font-extrabold text-rose-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-rose-100 pb-2">
                              <ShieldAlert className="w-5 h-5 text-rose-500" />
                              {t('Development Areas', 'மேம்படுத்த வேண்டிய பகுதிகள்')}
                            </h4>
                            <ul className="space-y-3">
                              {hrFeedback.weaknesses?.map((weak: string, index: number) => (
                                <li key={index} className="text-xs text-slate-700 leading-relaxed font-semibold flex items-start gap-2">
                                  <span className="text-rose-500 mt-0.5 font-bold">❗</span>
                                  <span>{weak}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* STAR Method Response Comparison cards */}
                        {hrFeedback.improvements && hrFeedback.improvements.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Award className="w-5 h-5 text-indigo-650" />
                              {t('Structured STAR-Format Constructive Rewrites', 'ஏஐ மூலம் செப்பனிடப்பட்ட STAR பதில்கள்')}
                            </h4>

                            <div className="space-y-5">
                              {hrFeedback.improvements.map((imp: any, idx: number) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                  {/* Question header bar */}
                                  <div className="bg-slate-50 border-b border-slate-200 px-4.5 py-3 flex items-start gap-2">
                                    <span className="bg-indigo-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">Q{idx + 1}</span>
                                    <p className="text-xs font-extrabold text-slate-700 leading-relaxed py-0.5">{imp.question}</p>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                                    {/* Left: spoken response */}
                                    <div className="p-4.5 space-y-1.5 bg-slate-50/40">
                                      <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase block">{t('Your Spoken Response', 'நீங்கள் பேசிய பதில்')}</span>
                                      <p className="text-xs text-slate-600 leading-relaxed italic">"{imp.answer || t('(Silence or extremely short answer recorded)', '(நீண்ட மௌனம் அல்லது பதில் எதுவும் பேசப்படவில்லை)')}"</p>
                                    </div>

                                    {/* Right: structured rewrite star */}
                                    <div className="p-4.5 space-y-1.5 bg-indigo-50/10">
                                      <span className="text-[10px] font-extrabold tracking-wider text-indigo-600 uppercase block flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                        {t('Professional STAR Framework Rewrite', 'தொழில்முறை ஏஐ பதில் கட்டமைப்பு')}
                                      </span>
                                      <p className="text-xs text-slate-800 font-medium leading-relaxed font-sans">{imp.constructiveRewrite}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Modern Communication & Confidence Advisor */}
                        {hrFeedback.tamilLanguageTips && (
                          <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-5 space-y-3.5" id="communication-confidence-advisor">
                            <h4 className="font-extrabold text-indigo-900 text-sm tracking-tight flex items-center gap-2">
                              <Languages className="w-5 h-5 text-indigo-700" />
                              {t('Placement Communication Confidence Guide (Confidence Advisor)', 'பேச்சுத்திறன் மற்றும் தன்னம்பிக்கை வழிகாட்டி')}
                            </h4>
                            <p className="text-xs text-indigo-850 leading-relaxed font-semibold">
                              {hrFeedback.tamilLanguageTips}
                            </p>
                          </div>
                        )}

                        {/* Reset button */}
                        <div className="flex justify-center pt-2">
                          <button
                            onClick={() => {
                              setHrFeedback(null);
                              setHrMessages([]);
                              setHrInputValue('');
                              setIsHrInterviewActive(false);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4 text-indigo-200" />
                            <span>{t('Retake Voice HR Interview Session', 'புதிய குரல்வழி நேர்காணலை நடத்து')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: LEADERBOARD / PLACEMENT METRICS */}
              {activeTab === 'leaderboard' && (() => {
                const leaderboardSameCollegeStudents = students.filter(st => {
                  const isReal = !st.id.startsWith('s');
                  const isSameCollege = st.collegeName?.trim().toLowerCase() === activeStudent.collegeName?.trim().toLowerCase();
                  return isReal && isSameCollege;
                });

                return (
                  <div className="space-y-6 animate-fade-in" id="leaderboard-tab">
                    
                    {/* Explanatory introduction banner */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-800">
                        {t('Aggregate Batch Readiness Leaderboard', 'சுருக்கமான தகுதி தரவரிசைப் பட்டியல்')} - <span className="text-indigo-650">{activeStudent.collegeName}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {t('Anonymous lists comparing branch rankings across affiliated college campuses. Kept completely transparent to foster placement drive preparation.', 'பல்வேறு அங்கீகரிக்கப்பட்ட கல்லூரி வளாக மாணவர்களின் கூட்டு தகுதியை ஒப்பிட்டு பார்க்கவும்.')}
                      </p>
                    </div>

                    {/* Leaderboard Table widget */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-indigo-120 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">
                          {t('Top Performing Pre-Final & Final Candidates', 'சிறந்த தகுதி பெற்ற மாணவர்கள்')}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {t('Your College Only', 'உங்கள் கல்லூரி மட்டும்')} • Total: {leaderboardSameCollegeStudents.length} Registered
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                              <th className="py-3 px-5">{t('Rank', 'தரம்')}</th>
                              <th className="py-3 px-5">{t('Candidate', 'பெயர்')}</th>
                              <th className="py-3 px-5">{t('College Campus', 'கல்லூரி')}</th>
                              <th className="py-3 px-5">{t('Branch', 'துறை')}</th>
                              <th className="py-3 px-5 text-center">CGPA</th>
                              <th className="py-3 px-5 text-center">{t('Status Indicator', 'தயார்நிலை')}</th>
                              <th className="py-3 px-5 text-right">{t('Readiness Index', 'தகுதி மதிப்பெண்')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaderboardSameCollegeStudents.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-8 px-5 text-center text-slate-400 font-semibold italic">
                                  {t('No other candidates from your college registered yet. You are currently Rank #1!', 'உங்கள் கல்லூரியைச் சேர்ந்த பிற மாணவர்கள் இன்னும் பதிவு செய்யவில்லை. நீங்கள் தற்போது தரம் # 1ல் உள்ளீர்கள்!')}
                                </td>
                              </tr>
                            ) : (
                              leaderboardSameCollegeStudents
                                .sort((a, b) => b.readinessScore - a.readinessScore)
                                .map((st, idx) => {
                                  const matchesActive = st.id === activeStudent.id;
                                  return (
                                    <tr 
                                      key={st.id} 
                                      className={`border-b border-slate-100 text-xs font-semibold hover:bg-slate-50/50 transition-colors ${
                                        matchesActive ? 'bg-indigo-50/50' : ''
                                      }`}
                                    >
                                      <td className="py-4 px-5">
                                        <div className="flex items-center gap-2">
                                          {idx === 0 ? (
                                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[10px] border border-amber-200 shadow-xs">1🥇</span>
                                          ) : idx === 1 ? (
                                            <span className="bg-slate-200 text-slate-700 w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[10px] border b-slate-250 shadow-xs flex-shrink-0">2🥈</span>
                                          ) : idx === 2 ? (
                                            <span className="bg-amber-50 text-amber-800 w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[10px] border border-amber-150 shadow-xs flex-shrink-0">3🥉</span>
                                          ) : (
                                            <span className="text-slate-400 pl-2">{idx + 1}</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-4 px-5">
                                        <div className="flex items-center gap-2.5">
                                          {/* Anonymized student representation except the currently logged visual element */}
                                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
                                            {st.name.split(' ').map(nm => nm[0]).join('')}
                                          </div>
                                          <div>
                                            <span className="font-bold text-slate-800 break-words max-w-[130px] md:max-w-none block">
                                              {matchesActive ? `${st.name} (YOU)` : st.name.replace(/(\w{3})\w+(.*)/, "$1*** $2")}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">{st.email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-5 text-slate-600 max-w-[180px] truncate">{st.collegeName}</td>
                                      <td className="py-4 px-5">
                                        <span className="bg-slate-100 tracking-wider border border-slate-200 px-2 py-0.5 rounded font-extrabold text-[10px] text-slate-600">
                                          {st.branch}
                                        </span>
                                      </td>
                                      <td className="py-4 px-5 text-center font-bold text-slate-700">{st.cgpa.toFixed(1)}</td>
                                      <td className="py-4 px-5 text-center">
                                        {st.readinessScore >= 75 ? (
                                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {t('Placement Ready', 'தயார் நிலையில்')}
                                          </span>
                                        ) : (
                                          <span className="bg-amber-50 text-amber-700 border border-amber-250 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {t('Needs Work', 'பயிற்சி தேவை')}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-4 px-5 text-right font-extrabold text-indigo-700 text-sm">
                                        {st.readinessScore}
                                      </td>
                                    </tr>
                                  );
                                })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

          {/* TPO COLLEGE ADMIN WORKSPACE VIEW */}
          {currentRole === 'tpo' && (
            <div className="space-y-6 animate-fade-in" id="tpo-workspace-view">
              
              {/* College overview banner card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 block">ADMINISTRATIVE CAMPUS PORTAL</span>
                  <h2 className="text-xl font-bold text-slate-800 mt-1">
                    {tpoSelectedCollege === 'ceg' ? 'College of Engineering, Guindy (CEG)' : tpoSelectedCollege === 'mit' ? 'Madras Institute of Technology (MIT)' : 'Affiliated Campus Board'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage candidate databases, assign assessments, compile audits, and analyze overall batch placement preparedness index.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleExportBatchReports}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                    <span>Download Excel Batch Report</span>
                  </button>
                </div>
              </div>

              {/* Statistical insights row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">CAMPUS PLACEMENT INDEX</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {tpoSelectedCollege === 'ceg' ? '74' : tpoSelectedCollege === 'mit' ? '71' : '65'}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[11px] text-emerald-500 block mt-2.5 font-semibold">📈 High alignment with TCS/Zoho drive</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">BATCH RECRUITMENT READY</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {students.filter(s => s.collegeId === tpoSelectedCollege && s.readinessScore >= 75).length}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      / {students.filter(s => s.collegeId === tpoSelectedCollege).length} Candidates
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-500 block mt-2.5 font-semibold">⚡ Meets basic core skill sets cutoffs</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">AVERAGE RESUME SCRINGS</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {Math.round(students.filter(s => s.collegeId === tpoSelectedCollege).reduce((acc, current) => acc + current.resumeScore, 0) / students.filter(s => s.collegeId === tpoSelectedCollege).length || 65)}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-2.5">Requires ATS formatted improvement</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">TOTAL PROBLEMS ANSWERED</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {students.filter(s => s.collegeId === tpoSelectedCollege).reduce((acc, curr) => acc + curr.questionsAnsweredToday, 0) + 40}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-2.5">Combined adaptive student practice</span>
                </div>

              </div>

              {/* Control panels: Filters and Table list / Assign assessment actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side actions: Assign standard tests */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">TPO BOARD ACTIONS</span>
                  
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs">
                    <h4 className="font-bold text-slate-800 mb-1">📢 Dispatch Batch Assignments</h4>
                    <p className="text-slate-500 leading-relaxed mb-3">Select a corporate styled mock assessment and immediately assign it onto every students practice profile dashboard.</p>
                    
                    <div className="space-y-2">
                      {tests.map(tst => (
                        <div key={tst.id} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg">
                          <div>
                            <span className="font-extrabold text-slate-800 block text-[11px]">{tst.title}</span>
                            <span className="text-[10px] text-slate-400 block">{tst.totalQuestions} Questions • {tst.company} Pattern</span>
                          </div>
                          <button
                            onClick={() => handleAssignTestToAll(tst.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all shadow-sm shrink-0"
                          >
                            Assign All
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side Table list: Filterable and searchable student database with stats */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="p-4 bg-slate-50 border-b border-indigo-120 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    
                    <div className="relative w-full sm:w-60">
                      <input
                        type="text"
                        placeholder="Search student by name..."
                        className="w-full text-xs font-medium border border-slate-200 rounded-xl py-2 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={tpoSearchQuery}
                        onChange={(e) => setTpoSearchQuery(e.target.value)}
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto shrink-0 select-none">
                      <select
                        className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs bg-white text-slate-600 font-semibold focus:outline-none"
                        value={tpoBranchFilter}
                        onChange={(e: any) => setTpoBranchFilter(e.target.value)}
                      >
                        <option value="ALL">All Branches</option>
                        <option value="CSE">CSE Only</option>
                        <option value="ECE">ECE Only</option>
                        <option value="EEE">EEE Only</option>
                      </select>

                      <select
                        className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs bg-white text-slate-600 font-semibold focus:outline-none"
                        value={tpoStatusFilter}
                        onChange={(e: any) => setTpoStatusFilter(e.target.value)}
                      >
                        <option value="ALL">All States</option>
                        <option value="READY">Ready Only (&gt;=75)</option>
                        <option value="TRAINING">Needs Training (&lt;75)</option>
                      </select>
                    </div>

                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="py-2.5 px-4">Candidate</th>
                          <th className="py-2.5 px-4 text-center">CGPA</th>
                          <th className="py-2.5 px-4 text-center">Aptitude Acc.</th>
                          <th className="py-2.5 px-4 text-center">Technical Acc.</th>
                          <th className="py-2.5 px-4 text-center">Resume Score</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                          <th className="py-2.5 px-4 text-right">Readiness Index</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students
                          .filter(s => s.collegeId === tpoSelectedCollege)
                          .filter(s => tpoSearchQuery.trim() === '' || s.name.toLowerCase().includes(tpoSearchQuery.toLowerCase()))
                          .filter(s => tpoBranchFilter === 'ALL' || s.branch === tpoBranchFilter)
                          .filter(s => {
                            if (tpoStatusFilter === 'ALL') return true;
                            if (tpoStatusFilter === 'READY') return s.readinessScore >= 75;
                            return s.readinessScore < 75;
                          })
                          .map(student => {
                            const isReady = student.readinessScore >= 75;
                            return (
                              <tr key={student.id} className="border-b border-slate-100 text-xs font-semibold hover:bg-slate-50/30">
                                <td className="py-3.5 px-4 font-bold text-slate-700">
                                  <div className="flex flex-col">
                                    <span>{student.name}</span>
                                    <span className="text-[10px] text-slate-400 font-normal">{student.branch} • {student.email}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-slate-600">{student.cgpa}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="font-mono">{student.aptitudeAccuracy}%</span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="font-mono">{student.technicalAccuracy}%</span>
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-indigo-600">{student.resumeScore}%</td>
                                <td className="py-3.5 px-4 text-center">
                                  {isReady ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Ready</span>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-700 border border-amber-250 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Needs Training</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right font-extrabold text-slate-800 text-sm">{student.readinessScore}%</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SUPER ADMIN CONTROL BOARD (MADHAN) */}
          {currentRole === 'superadmin' && (
            <div className="space-y-6 animate-fade-in" id="superadmin-workspace">
              
              {/* Aggregate board info */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 block">SUPER ADMIN GLOBAL DASHBOARD</span>
                  <h2 className="text-2xl font-black text-white mt-1">Unified Placement Hub Control Panel</h2>
                  <p className="text-xs text-indigo-200 mt-1">Monitor multi-college campus statistics, configure core indices, add colleges, and oversee whole system placement logs.</p>
                </div>
                <div className="bg-indigo-800/60 border border-indigo-700/80 px-4 py-2.5 rounded-xl shrink-0 z-10">
                  <span className="text-[10px] text-indigo-300 block font-bold tracking-widest uppercase">AGGREGATE PLACEMENT READY</span>
                  <span className="text-3xl font-black text-white">{students.filter(s => s.readinessScore >= 75).length} / {students.length} candidates</span>
                </div>
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
              </div>

              {/* Two operational rows: Add affiliated campus & comparison lists */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left block: Add College campus form */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">PROVISION NEW CAMPUS</span>
                  
                  <form onSubmit={handleAddCollegeCampus} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Affiliated College Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PSG College of Technology"
                        className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                        value={newCollegeName}
                        onChange={(e) => setNewCollegeName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Designated TPO Officer Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. G. Srimathi"
                        className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                        value={newCollegeTpo}
                        onChange={(e) => setNewCollegeTpo(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Location City</label>
                        <input
                          type="text"
                          placeholder="e.g. Coimbatore"
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                          value={newCollegeLocation}
                          onChange={(e) => setNewCollegeLocation(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Student Capacity</label>
                        <input
                          type="number"
                          placeholder="150"
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                          value={newCollegeStudentCount}
                          onChange={(e) => setNewCollegeStudentCount(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-1 transition-all"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>Provision Campus System</span>
                    </button>
                  </form>
                </div>

                {/* Right block: Comparison list of provisioned colleges and stats */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="p-4 bg-slate-50 border-b border-indigo-120 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Active Campuses Comparison Matrix</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Registered Campuses: {colleges.length}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="py-3 px-5">Campus Name</th>
                          <th className="py-3 px-5">TPO Contact Person</th>
                          <th className="py-3 px-5">Location</th>
                          <th className="py-3 px-5 text-center">Batch Capacity</th>
                          <th className="py-3 px-5 text-right">Average Placement Readiness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colleges.map(clg => (
                          <tr key={clg.id} className="border-b border-slate-100 text-xs font-semibold hover:bg-indigo-50/10">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 text-indigo-750 p-2.5 rounded-xl border border-indigo-200">
                                  <Building className="w-5 h-5" />
                                </div>
                                <span className="font-extrabold text-slate-800 break-all max-w-[200px] block">{clg.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-slate-600">{clg.tpoName}</td>
                            <td className="py-4 px-5">{clg.location}</td>
                            <td className="py-4 px-5 text-center text-slate-700 font-bold">{clg.studentCount} Students</td>
                            <td className="py-4 px-5 text-right font-black text-indigo-700 text-sm">
                              {clg.averageReadiness}% Avg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      <footer className="bg-white border-t border-slate-150 py-5 mt-auto flex items-center justify-center text-[11px] font-bold text-slate-400 tracking-wide uppercase">
        <span>© 2026 CrackIt Inc. • Affiliated Colleges placement drive coordination platform</span>
      </footer>
    </div>
  );
}
