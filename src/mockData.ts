import { StudentProfile, College, Question, MockTest } from './types';

export const mockColleges: College[] = [
  {
    id: 'ceg',
    name: 'College of Engineering, Guindy (CEG)',
    location: 'Chennai',
    studentCount: 320,
    tpoName: 'Dr. R. Shanmugam',
    averageReadiness: 74,
  },
  {
    id: 'mit',
    name: 'Madras Institute of Technology (MIT)',
    location: 'Chromepet, Chennai',
    studentCount: 280,
    tpoName: 'Mrs. S. Vijayalakshmi',
    averageReadiness: 71,
  },
  {
    id: 'act',
    name: 'Alagappa College of Technology (ACT)',
    location: 'Chennai',
    studentCount: 190,
    tpoName: 'Dr. G. Anbarasan',
    averageReadiness: 65,
  },
  {
    id: 'ssn',
    name: 'SSN College of Engineering',
    location: 'Kalavakkam',
    studentCount: 250,
    tpoName: 'Mr. N. Sridhar',
    averageReadiness: 77,
  }
];

export const mockStudents: StudentProfile[] = [
  {
    id: 's1',
    name: 'Madhan Kumar',
    email: 'madhan.mock@ceg.edu',
    collegeId: 'ceg',
    collegeName: 'College of Engineering, Guindy (CEG)',
    branch: 'CSE',
    cgpa: 8.6,
    aptitudeAccuracy: 84,
    technicalAccuracy: 81,
    mockTestAverage: 78,
    resumeScore: 85,
    readinessScore: 82, // (84+81+78+85)/4
    weakTopics: ['Dynamic Programming', 'Logical Syllogisms'],
    strongTopics: ['Database Systems', 'Probability', 'SQL Queries'],
    questionsAnsweredToday: 4,
    dailyStreak: 12,
    assignedTestsIds: ['t1', 't2', 't3'],
    attendedQuestionIds: []
  },
  {
    id: 's2',
    name: 'Abishek Balaji',
    email: 'abishek@ceg.edu',
    collegeId: 'ceg',
    collegeName: 'College of Engineering, Guindy (CEG)',
    branch: 'ECE',
    cgpa: 7.9,
    aptitudeAccuracy: 70,
    technicalAccuracy: 75,
    mockTestAverage: 65,
    resumeScore: 60,
    readinessScore: 67,
    weakTopics: ['Electromagnetics', 'Quantitative Puzzles'],
    strongTopics: ['Analog Electronics', 'Digital Signal Processing'],
    questionsAnsweredToday: 15,
    dailyStreak: 3,
    assignedTestsIds: ['t1', 't3'],
    attendedQuestionIds: []
  },
  {
    id: 's3',
    name: 'Divya Bharathi',
    email: 'divya.b@mit.edu',
    collegeId: 'mit',
    collegeName: 'Madras Institute of Technology (MIT)',
    branch: 'EEE',
    cgpa: 9.1,
    aptitudeAccuracy: 92,
    technicalAccuracy: 88,
    mockTestAverage: 85,
    resumeScore: 90,
    readinessScore: 89,
    weakTopics: ['Power Systems Protection'],
    strongTopics: ['Control Systems', 'Induction Machines', 'Probability'],
    questionsAnsweredToday: 25,
    dailyStreak: 24,
    assignedTestsIds: ['t1', 't2'],
    attendedQuestionIds: []
  },
  {
    id: 's4',
    name: 'Karthick Raja',
    email: 'karthick.r@mit.edu',
    collegeId: 'mit',
    collegeName: 'Madras Institute of Technology (MIT)',
    branch: 'CSE',
    cgpa: 7.2,
    aptitudeAccuracy: 62,
    technicalAccuracy: 65,
    mockTestAverage: 58,
    resumeScore: 50,
    readinessScore: 59,
    weakTopics: ['Data Structures', 'Greedy Algorithms'],
    strongTopics: ['Object Oriented Programming', 'Operating Systems'],
    questionsAnsweredToday: 8,
    dailyStreak: 2,
    assignedTestsIds: ['t1', 't3'],
    attendedQuestionIds: []
  },
  {
    id: 's5',
    name: 'Priyanka Sen',
    email: 'priyanka@act.edu',
    collegeId: 'act',
    collegeName: 'Alagappa College of Technology (ACT)',
    branch: 'EEE',
    cgpa: 8.3,
    aptitudeAccuracy: 78,
    technicalAccuracy: 70,
    mockTestAverage: 72,
    resumeScore: 80,
    readinessScore: 75,
    weakTopics: ['Verbal Reasoning', 'Power Semiconductor Drives'],
    strongTopics: ['Network Analysis', 'Digital Electronics'],
    questionsAnsweredToday: 0,
    dailyStreak: 5,
    assignedTestsIds: ['t1', 't2'],
    attendedQuestionIds: []
  }
];

export const mockQuestions: Question[] = [
  // Aptitude
  {
    id: 'q_apt1',
    category: 'aptitude',
    topic: 'Quantitative Aptitude - Pipes & Cisterns',
    questionText: 'Pipe A can fill a tank in 12 hours, and Pipe B can fill it in 15 hours. If both pipes are opened together, how much time will they take to fill the tank?',
    questionTextTamil: 'குழாய் A ஒரு தொட்டியை 12 மணிநேரத்திலும், குழாய் B அதனை 15 மணிநேரத்திலும் நிரப்ப முடியும். இரண்டு குழாய்களும் ஒன்றாக திறக்கப்பட்டால், தொட்டியை நிரப்ப எவ்வளவு நேரம் ஆகும்?',
    options: [
      '6 hours 40 minutes',
      '5 hours 15 minutes',
      '6 hours 25 minutes',
      '5 hours 45 minutes'
    ],
    optionsTamil: [
      '6 மணிநேரம் 40 நிமிடங்கள்',
      '5 மணிநேரம் 15 நிமிடங்கள்',
      '6 மணிநேரம் 25 நிமிடங்கள்',
      '5 மணிநேரம் 45 நிமிடங்கள்'
    ],
    correctIndex: 0,
    explanation: 'Work done by A in 1 hour = 1/12. Work done by B in 1 hour = 1/15. Combined work in 1 hour = 1/12 + 1/15 = 9/60 = 3/20. So, the time taken to fill is 20/3 hours = 6 hours 40 minutes.',
    explanationTamil: '1 மணிநேரத்தில் A செய்த வேலை = 1/12. B செய்த வேலை = 1/15. 1 மணிநேரத்தில் இருவரின் கூட்டு வேலை = 1/12 + 1/15 = 9/60 = 3/20. எனவே, நிரப்ப ஆகும் நேரம் = 20/3 மணிநேரம் = 6 மணிநேரம் 40 நிமிடங்கள்.'
  },
  {
    id: 'q_apt2',
    category: 'aptitude',
    topic: 'Quantitative Aptitude - Time & Work',
    questionText: 'A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:',
    questionTextTamil: 'A ஒரு வேலையை 15 நாட்களிலும், B 20 நாட்களிலும் செய்ய முடியும். அவர்கள் 4 நாட்கள் ஒன்றாக வேலை செய்தால், மீதமுள்ள வேலையின் பின்ன அளவு:',
    options: [
      '1/4',
      '1/10',
      '7/15',
      '8/15'
    ],
    optionsTamil: [
      '1/4',
      '1/10',
      '7/15',
      '8/15'
    ],
    correctIndex: 3,
    explanation: 'A\'s 1 day work = 1/15, B\'s 1 day work = 1/20. Joint work in 4 days = 4 * (1/15 + 1/20) = 4 * (7/60) = 7/15. Leftover work = 1 - 7/15 = 8/15.',
    explanationTamil: 'A-ன் 1 நாள் வேலை = 1/15, B-ன் 1 நாள் வேலை = 1/20. 4 நாட்களில் இருவரின் கூட்டு வேலை = 4 * (1/15 + 1/20) = 4 * (7/60) = 7/15. மீதமுள்ள வேலை = 1 - 7/15 = 8/15.'
  },
  {
    id: 'q_apt3',
    category: 'aptitude',
    topic: 'Logical Reasoning - Coding Decoding',
    questionText: 'In a certain code language, "TAMIL" is written as "VCOKN". How is "COLLEGE" written in that code?',
    questionTextTamil: 'ஒரு குறிப்பிட்ட குறியீட்டு மொழியில், "TAMIL" என்பது "VCOKN" என எழுதப்பட்டுள்ளது. அதே குறியீட்டில் "COLLEGE" என்பது எவ்வாறு எழுதப்படும்?',
    options: [
      'EQNNIGI',
      'EQNIGGE',
      'DPMMFHF',
      'EQMNHGI'
    ],
    optionsTamil: [
      'EQNNIGI',
      'EQNIGGE',
      'DPMMFHF',
      'EQMNHGI'
    ],
    correctIndex: 0,
    explanation: 'The pattern is that each letter is shifted forward by 2 positions. T(+2)->V, A(+2)->C, M(+2)->O, I(+2)->K, L(+2)->N. Applying the same to COLLEGE: C(+2)->E, O(+2)->Q, L(+2)->N, L(+2)->N, E(+2)->G, G(+2)->I, E(+2)->G -> EQNNIGI.',
    explanationTamil: 'ஒவ்வொரு எழுத்தும் 2 நிலைகள் முன்னோக்கி நகர்த்தப்படுகிறது. T(+2)->V, A(+2)->C, M(+2)->O, I(+2)->K, L(+2)->N. இதையே COLLEGE என்ற வார்த்தைக்கு பயன்படுத்தினால்: C(+2)->E, O(+2)->Q, L(+2)->N, L(+2)->N, E(+2)->G, G(+2)->I, E(+2)->G -> EQNNIGI.'
  },
  {
    id: 'q_apt4',
    category: 'aptitude',
    topic: 'Quantitative Aptitude - Probability',
    questionText: 'Two dice are thrown simultaneously. What is the probability of getting two numbers whose product is even?',
    questionTextTamil: 'இரண்டு பகடைகள் ஒரே நேரத்தில் உருட்டப்படுகின்றன. பெறப்பட்ட இரண்டு எண்களின் பெருக்கல்பலன் இரட்டை எண்ணாக இருப்பதற்கான நிகழ்தகவு என்ன?',
    options: [
      '1/2',
      '3/4',
      '5/6',
      '3/8'
    ],
    optionsTamil: [
      '1/2',
      '3/4',
      '5/6',
      '3/8'
    ],
    correctIndex: 1,
    explanation: 'Total outcomes = 36. Product is odd only when both numbers on the dice are odd: (3 choices) * (3 choices) = 9 outcomes. Product is even in remaining outcomes: 36 - 9 = 27 outcomes. Probability = 27/36 = 3/4.',
    explanationTamil: 'மொத்த விளைவுகள் = 36. பகடைகளில் இரண்டு எண்களும் ஒற்றை எண்களாக இருக்கும்போது மட்டுமே பெருக்கல் பலன் ஒற்றையாய் அமையும்: (3 வாய்ப்புகள்) * (3 வாய்ப்புகள்) = 9 விளைவுகள். மற்ற அனைத்துக்கும் இரட்டையாய் அமையும்: 36 - 9 = 27 விளைவுகள். நிகழ்தகவு = 27/36 = 3/4.'
  },
  {
    id: 'q_apt5',
    category: 'aptitude',
    topic: 'Quantitative Aptitude - Ratios & Proportion',
    questionText: 'If A : B = 2 : 3, B : C = 4 : 5 and C : D = 6 : 7, what is A : B : C : D?',
    questionTextTamil: 'A : B = 2 : 3, B : C = 4 : 5 மற்றும் C : D = 6 : 7 எனில், A : B : C : D என்பது என்ன?',
    options: [
      '16 : 24 : 30 : 35',
      '8 : 12 : 15 : 18',
      '16 : 20 : 30 : 35',
      '12 : 18 : 24 : 35'
    ],
    optionsTamil: [
      '16 : 24 : 30 : 35',
      '8 : 12 : 15 : 18',
      '16 : 20 : 30 : 35',
      '12 : 18 : 24 : 35'
    ],
    correctIndex: 0,
    explanation: 'A/B = 2/3, B/C = 4/5. To merge, multiply A : B by 4 and B : C by 3 => A : B : C = 8 : 12 : 15. Since C : D = 6 : 7, LCM of C (15 and 6) is 30. Multiplying first by 2 and second by 5 => A : B : C : D = 16 : 24 : 30 : 35.',
    explanationTamil: 'A/B = 2/3, B/C = 4/5. இரண்டையும் சேர்க்க, A : B-ஐ 4-ஆலும், B : C-ஐ 3-ஆலும் பெருக்க வேண்டும் => A : B : C = 8 : 12 : 15. C : D = 6 : 7 என்பதால், C-ன் மீ.சி.ம (15 மற்றும் 6) 30 ஆகும். அதன்படி பெருக்கினால் => A : B : C : D = 16 : 24 : 30 : 35.'
  },
  {
    id: 'q_apt6',
    category: 'aptitude',
    topic: 'Quantitative Aptitude - Profit & Loss',
    questionText: 'A retailer buys a radio for Rs. 225. His overhead expenses are Rs. 15. He sells the radio for Rs. 300. What is his profit percentage?',
    questionTextTamil: 'ஒரு வணிகர் ஒரு வானொலியை ரூ. 225-க்கு வாங்குகிறார். அவரது கூடுதல் செலவுகள் ரூ. 15 ஆகும். அவர் அதனை ரூ. 300-க்கு விற்கிறார் எனில், அவரது இலாப சதவீதம் என்ன?',
    options: [
      '20%',
      '25%',
      '30%',
      '35%'
    ],
    optionsTamil: [
      '20%',
      '25%',
      '30%',
      '35%'
    ],
    correctIndex: 1,
    explanation: 'Total Cost Price (CP) = Purchased Price + Overhead = 225 + 15 = Rs. 240. Selling Price (SP) = Rs. 300. Profit = SP - CP = 300 - 240 = Rs. 60. Profit % = (60 / 240) * 100 = 25%.',
    explanationTamil: 'மொத்த அடக்க விலை (CP) = வாங்கிய விலை + கூடுதல் செலவுகள் = 225 + 15 = ரூ. 240. விற்பனை விலை (SP) = ரூ. 300. இலாபம் = SP - CP = 300 - 240 = ரூ. 60. இலாப % = (60 / 240) * 100 = 25%.'
  },
  {
    id: 'q_apt7',
    category: 'aptitude',
    topic: 'Quantitative Aptitude - Speed & Distance',
    questionText: 'A train 150m long passes a telegraph post in 9 seconds. What is the speed of the train in km/hr?',
    questionTextTamil: '150 மீட்டர் நீளமுள்ள ஒரு ரயில் ஒரு தந்தி கம்பத்தை 9 வினாடிகளில் கடக்கிறது. ரயிலின் வேகத்தை மணிக்கு கி.மீ-ல் காண்க?',
    options: [
      '50 km/hr',
      '60 km/hr',
      '72 km/hr',
      '80 km/hr'
    ],
    optionsTamil: [
      '50 கி.மீ/மணி',
      '60 கி.மீ/மணி',
      '72 கி.மீ/மணி',
      '80 கி.மீ/மணி'
    ],
    correctIndex: 1,
    explanation: 'Speed = Distance / Time = 150 / 9 = 50/3 m/s. To convert to km/hr, multiply by 18/5 => (50/3) * (18/5) = 10 * 6 = 60 km/hr.',
    explanationTamil: 'வேகம் = தூரம் / காலம் = 150 / 9 = 50/3 மீ/வி. மணிக்கு கி.மீ ஆக மாற்ற, 18/5 ஆல் பெருக்க வேண்டும் => (50/3) * (18/5) = 10 * 6 = 60 கி.மீ/மணி.'
  },
  {
    id: 'q_apt8',
    category: 'aptitude',
    topic: 'Logical Reasoning - Blood Relations',
    questionText: 'Pointing to a photograph of a boy, Suresh said, "He is the son of the only son of my mother." How is Suresh related to that boy?',
    questionTextTamil: 'ஒரு சிறுவனின் புகைப்படத்தைச் சுட்டிக்காட்டி சுரேஷ் கூறினார்: "அவன் என் தாயின் ஒரே மகனுடைய மகன்." சுரேஷ் அச்சிறுவனுக்கு என்ன உறவு?',
    options: [
      'Brother',
      'Uncle',
      'Cousin',
      'Father'
    ],
    optionsTamil: [
      'சகோதரன்',
      'மாமா/சித்தப்பா',
      'உறவினர்',
      'தந்தை'
    ],
    correctIndex: 3,
    explanation: 'Suresh\'s mother\'s only son is Suresh himself. Therefore, the boy is Suresh\'s son, which makes Suresh the boy\'s Father.',
    explanationTamil: 'சுரேஷின் தாயின் ஒரே மகன் சுரேஷ் தான். எனவே, படம் சுரேஷின் மகனைக் குறிக்கிறது. அதன்படி சுரேஷ் அவனுக்கு தந்தை உறவு முறை ஆவார்.'
  },
  {
    id: 'q_apt9',
    category: 'aptitude',
    topic: 'Logical Reasoning - Syllogisms',
    questionText: 'Statements: Some books are novels. All novels are papers. Conclusions: I. Some papers are books. II. No paper is book.',
    questionTextTamil: 'கூற்றுகள்: சில புத்தகங்கள் நாவல்கள். அனைத்து நாவல்களும் தாள்கள். முடிவுகள்: I. சில தாள்கள் புத்தகங்கள் ஆகும். II. எந்த தாளும் புத்தகம் இல்லை.',
    options: [
      'Only Conclusion I follows',
      'Only Conclusion II follows',
      'Either I or II follows',
      'Neither I nor II follows'
    ],
    optionsTamil: [
      'முடிவு I மட்டும் சரியானது',
      'முடிவு II மட்டும் சரியானது',
      'ஒன்று I அல்லது II சரியானது',
      'I மற்றும் II இரண்டும் தவறானது'
    ],
    correctIndex: 0,
    explanation: 'Since "Some books are novels" and "All novels are papers", books and papers intersect. Thus, some papers are indeed books. Conclusion I follows.',
    explanationTamil: '"சில புத்தகங்கள் நாவல்கள்" மற்றும் "அனைத்து நாவல்களும் தாள்கள்" என்பதால், புத்தகங்களும் தாள்களும் ஒரு புள்ளியில் இணைகின்றன. இதனால் சில தாள்கள் புத்தகங்கள் ஆகும் என்பது உறுதியாகிறது. எனவே முடிவு I சரியானது.'
  },
  {
    id: 'q_apt10',
    category: 'aptitude',
    topic: 'Quantitative Aptitude - Simple Interest',
    questionText: 'A sum of money double itself in 8 years at simple interest. What is the rate of interest per annum?',
    questionTextTamil: 'ஒரு குறிப்பிட்ட தொகை தனி வட்டி விகிதத்தில் 8 ஆண்டுகளில் இரட்டிப்பாகிறது எனில், வட்டி வீதம் என்ன?',
    options: [
      '10%',
      '12.5%',
      '15%',
      '16.6%'
    ],
    optionsTamil: [
      '10%',
      '12.5%',
      '15%',
      '16.6%'
    ],
    correctIndex: 1,
    explanation: 'Let Principal be P. Interest = P (as double of investment is 2P). Formula: Interest = P * R * T / 100. P = P * R * 8 / 100 => R = 100 / 8 = 12.5% per annum.',
    explanationTamil: 'அசல் P என்க. வட்டி = P (தொகை இரட்டிப்பானால் அது 2P ஆகும், வட்டி 2P - P = P). தனிவட்டி சூத்திரம்: I = P * R * T / 100. P = P * R * 8 / 100 => R = 100 / 8 = 12.5%.'
  },

  // Technical CSE
  {
    id: 'q_cse1',
    category: 'technical',
    branchKey: 'CSE',
    topic: 'Data Structures & Algorithms',
    questionText: 'Which of the following data structures operates on the LIFO (Last In First Out) principle?',
    questionTextTamil: 'கீழே உள்ளவற்றில் எது LIFO (கடைசியாக வருவது முதலில் செல்லும்) கொள்கையின் அடிப்படையில் செயல்படுகிறது?',
    options: [
      'Queue',
      'Stack',
      'Binary Tree',
      'Singly Linked List'
    ],
    optionsTamil: [
      'வரிசை (Queue)',
      'அடுக்கு (Stack)',
      'இருநிலை மரம் (Binary Tree)',
      'ஒற்றை இணைப்பு பட்டியல் (Singly Linked List)'
    ],
    correctIndex: 1,
    explanation: 'A Stack utilizes the LIFO principle where elements added last are removed first via the pop operation.',
    explanationTamil: 'அடுக்கு (Stack) LIFO கொள்கையை பயன்படுத்துகிறது. இதில் கடைசியாக சேர்க்கப்படும் உறுப்புகள் pop செயல்பாடு மூலம் முதலில் அகற்றப்படும்.'
  },
  {
    id: 'q_cse2',
    category: 'technical',
    branchKey: 'CSE',
    topic: 'Database Management Systems',
    questionText: 'What are the main characteristics of an ACID database transaction?',
    questionTextTamil: 'ACID தரவுத்தள பரிவர்த்தனையின் (transaction) முக்கிய பண்புகள் யாவை?',
    options: [
      'Atomicity, Consistency, Isolation, Durability',
      'Algorithm, Connection, Indexing, Database',
      'Accuracy, Concurrency, Integrity, Distribution',
      'Availability, Consistency, Identity, Dynamic'
    ],
    optionsTamil: [
      'அணுத்தன்மை (Atomicity), சீரான தன்மை (Consistency), தனிமைப்படுத்தல் (Isolation), நீடித்து உழைக்கும் தன்மை (Durability)',
      'வழிமுறை (Algorithm), இணைப்பு (Connection), குறியீட்டாக்கம் (Indexing), தரவுத்தளம் (Database)',
      'துல்லியம் (Accuracy), ஒரே நேரத்தில் நடத்தல் (Concurrency), ஒருமைப்பாடு (Integrity), விநியோகம் (Distribution)',
      'கிடைக்கும்தன்மை (Availability), சீரான தன்மை (Consistency), அடையாளம் (Identity), மாறும் தன்மை (Dynamic)'
    ],
    correctIndex: 0,
    explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability, ensuring transactions are processed reliably.',
    explanationTamil: 'ACID என்பது அணுத்தன்மை (Atomicity), சீரான தன்மை (Consistency), தனிமைப்படுத்தல் (Isolation) மற்றும் நீடித்து உழைக்கும் தன்மை (Durability) ஆகும், இது பரிவர்த்தனைகள் நம்பகத்தன்மையுடன் செயலாக்கப்படுவதை உறுதி செய்கிறது.'
  },
  {
    id: 'q_cse3',
    category: 'technical',
    branchKey: 'CSE',
    topic: 'Computer Networks',
    questionText: 'Which layer of the OSI model determines the interface of the system with the user?',
    questionTextTamil: 'OSI மாதிரியின் எந்த அடுக்கு பயனருடன் கணினியின் இடைமுகத்தை (interface) தீர்மானிக்கிறது?',
    options: [
      'Network Layer',
      'Presentation Layer',
      'Session Layer',
      'Application Layer'
    ],
    optionsTamil: [
      'பிணைய அடுக்கு (Network Layer)',
      'முன்னிறுத்தல் அடுக்கு (Presentation Layer)',
      'அமர்வு அடுக்கு (Session Layer)',
      'பயன்பாட்டு அடுக்கு (Application Layer)'
    ],
    correctIndex: 3,
    explanation: 'The Application Layer interacts directly with application programs and handles interface requirements with end-users.',
    explanationTamil: 'பயன்பாட்டு அடுக்கு (Application Layer) பயன்பாட்டு மென்பொருட்களுடன் நேரடியாக தொடர்பு கொண்டு, பயனருக்கான இறுதி இடைமுகத்தை வழங்குகிறது.'
  },
  {
    id: 'q_cse4',
    category: 'technical',
    branchKey: 'CSE',
    topic: 'Operating Systems',
    questionText: 'In Operating Systems, what is the situation called when two or more processes are blocked indefinitely waiting for each other to release resources?',
    questionTextTamil: '"Operating System"-ல் இரண்டு அல்லது அதற்கு மேற்பட்ட செயல்முறைகள் (processes) வளங்களை வெளியிடுவதற்காக பராஸ்பரம் காத்திருந்து காலவரையின்றி முடக்கப்படும் நிலை எவ்வாறு அழைக்கப்படுகிறது?',
    options: [
      'Paging',
      'Deadlock',
      'Scheduling',
      'Thrashing'
    ],
    optionsTamil: [
      'பேஜிங் (Paging)',
      'டெட்லாக் (Deadlock)',
      'செடியூலிங் (Scheduling)',
      'த்ராஷிங் (Thrashing)'
    ],
    correctIndex: 1,
    explanation: 'A deadlock occurs when a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process.',
    explanationTamil: 'ஒவ்வொரு செயல்முறையும் ஒரு வளத்தை வைத்துக்கொண்டு, மற்றொரு செயல்முறை வைத்திருக்கும் வளத்திற்காக காத்திருக்கும்போது ஏற்படும் முடக்க நிலையே டெட்லாக் (Deadlock) ஆகும்.'
  },
  {
    id: 'q_cse5',
    category: 'technical',
    branchKey: 'CSE',
    topic: 'Data Structures & Algorithms',
    questionText: 'What is the worst-case time complexity of the Quick Sort algorithm?',
    questionTextTamil: 'Quick Sort வரிசைப்படுத்தல் நெறிமுறையின் மோசமான கால சிக்கலான தன்மை (worst-case time complexity) என்ன?',
    options: [
      'O(log n)',
      'O(n log n)',
      'O(n^2)',
      'O(n)'
    ],
    optionsTamil: [
      'O(log n)',
      'O(n log n)',
      'O(n^2)',
      'O(n)'
    ],
    correctIndex: 2,
    explanation: 'In the worst case (e.g. sorted arrays when pivot selection is poor), Quick Sort runs in O(n^2) time complexity.',
    explanationTamil: 'மிக மோசமான சூழ்நிலையில் (எ.கா. மோசமான பிவோட் தேர்வு மூலம் ஏற்கனவே வரிசைப்படுத்தப்பட்ட அணிகள்), Quick Sort O(n^2) கால சிக்கலைச் சந்திக்கிறது.'
  },
  {
    id: 'q_cse6',
    category: 'technical',
    branchKey: 'CSE',
    topic: 'Database Management Systems',
    questionText: 'Which SQL keyword is used to remove duplicate rows from the result of a SELECT query?',
    questionTextTamil: 'ஒரு SELECT வினவலின் முடிவில் இருந்து நகல் வரிசைகளை (duplicate rows) அகற்ற எந்த SQL முக்கிய சொல் பயன்படுத்தப்படுகிறது?',
    options: [
      'UNIQUE',
      'DISTINCT',
      'GROUP BY',
      'SORTED'
    ],
    optionsTamil: [
      'UNIQUE',
      'DISTINCT',
      'GROUP BY',
      'SORTED'
    ],
    correctIndex: 1,
    explanation: 'The DISTINCT keyword in SQL is used in conjunction with SELECT to eliminate duplicate records and return only unique values.',
    explanationTamil: 'SELECT உடன் DISTINCT முக்கிய சொல்லைப் பயன்படுத்தும்போது, அது பதிவகளின் நகல்களைத் தவிர்த்து தனித்துவமான மதிப்புகளை மட்டுமே வழங்குகிறது.'
  },

  // Technical ECE
  {
    id: 'q_ece1',
    category: 'technical',
    branchKey: 'ECE',
    topic: 'Digital Circuits & Microprocessors',
    questionText: 'Which pin of the 8085 microprocessor is used for non-maskable interrupt?',
    questionTextTamil: '8085 நுண்செயலியின் எந்த முள் (pin) தடுக்க முடியாத தடையீட்டிற்கு (non-maskable interrupt) பயன்படுத்தப்படுகிறது?',
    options: [
      'RST 7.5',
      'INTR',
      'TRAP',
      'RST 5.5'
    ],
    optionsTamil: [
      'RST 7.5',
      'INTR',
      'TRAP',
      'RST 5.5'
    ],
    correctIndex: 2,
    explanation: 'The TRAP interrupt is the only non-maskable interrupt in the 8085 microprocessor structure and has the highest priority.',
    explanationTamil: 'TRAP தடையீடு என்பது 8085 நுண்செயலிக் கட்டமைப்புக்குள் இருக்கும் ஒரே ஒரு தடுக்க முடியாத தடையீடு (non-maskable interrupt) ஆகும். இது மிக உயர்ந்த முன்னுரிமை கொண்டது.'
  },
  {
    id: 'q_ece2',
    category: 'technical',
    branchKey: 'ECE',
    topic: 'Analog Circuits',
    questionText: 'Under which biasing condition does a Silicon p-n junction diode act as a closed switch?',
    questionTextTamil: 'எந்த மின்முனை ஊட்ட நிபந்தனையின் கீழ் சிலிக்கான் p-n சந்தி டையோடு மூடிய சுவிட்ச் (closed switch) போல செயல்படுகிறது?',
    options: [
      'Reverse Bias',
      'Forward Bias',
      'Zero Bias',
      'Breakdown Region'
    ],
    optionsTamil: [
      'பின்னோக்கு சார்பு (Reverse Bias)',
      'முன்னோக்கு சார்பு (Forward Bias)',
      'சார்பற்ற நிலை (Zero Bias)',
      'மின்னிறக்க பகுதி (Breakdown Region)'
    ],
    correctIndex: 1,
    explanation: 'In forward bias, once the cut-in voltage (~0.7V for Silicon) is exceeded, the barrier and resistance decrease, allowing current to flow like a closed switch.',
    explanationTamil: 'முன்னோக்கு சார்புடைய (Forward bias) நிலையில், கட்-இன் மின்னழுத்தத்தை (~0.7V சிலிக்கானுக்கு) தாண்டியவுடன், தடை மற்றும் மின்தடை குறைகிறது, இதனால் மூடிய சுவிட்ச் போல மின்னோட்டம் செல்கிறது.'
  },
  {
    id: 'q_ece3',
    category: 'technical',
    branchKey: 'ECE',
    topic: 'Signals and Systems',
    questionText: 'What is the Fourier Transform of a unit impulse function delta(t)?',
    questionTextTamil: 'அலகு தூண்டுதல் சார்பின் (unit impulse function delta(t)) ஃபோரியர் மின்மாற்றம் (Fourier Transform) என்ன?',
    options: [
      '0',
      '1',
      'infinity',
      '2 * pi'
    ],
    optionsTamil: [
      '0',
      '1',
      'முடிவிலி',
      '2 * pi'
    ],
    correctIndex: 1,
    explanation: 'The Fourier Transform of Dirac delta function delta(t) is 1, indicating that it contains all frequency components with equal weight.',
    explanationTamil: 'டிராக் டெல்டா சார்பின் delta(t) ஃபோரியர் மின்மாற்றம் 1 ஆகும், இது அனைத்து அதிர்வெண் கூறுகளையும் சம எடையில் கொண்டுள்ளது என்பதைக் குறிக்கிறது.'
  },
  {
    id: 'q_ece4',
    category: 'technical',
    branchKey: 'ECE',
    topic: 'Electromagnetics',
    questionText: 'Which of Maxwell\'s equations is derived directly from Faraday\'s Law of Electromagnetic Induction?',
    questionTextTamil: 'மின்காந்த தூண்டலின் ஃபாரடே விதியிலிருந்து நேரடியாகப் பெறப்பட்ட மேக்ஸ்வெல்லின் சமன்பாடு எது?',
    options: [
      'Curl(E) = -dB/dt',
      'Div(D) = rho',
      'Curl(H) = J + dD/dt',
      'Div(B) = 0'
    ],
    optionsTamil: [
      'Curl(E) = -dB/dt',
      'Div(D) = rho',
      'Curl(H) = J + dD/dt',
      'Div(B) = 0'
    ],
    correctIndex: 0,
    explanation: 'Faraday\'s law states that a changing magnetic field induces an electric field: Curl(E) = -dB/dt.',
    explanationTamil: 'மாறிவரும் காந்தப்புலம் மின்புலத்தைத் தூண்டுகிறது என்று ஃபாரடே விதி கூறுகிறது: Curl(E) = -dB/dt.'
  },
  {
    id: 'q_ece5',
    category: 'technical',
    branchKey: 'ECE',
    topic: 'Digital Signal Processing',
    questionText: 'For a stable and causal LTI system, where must all the poles of its transfer function H(z) be located in the z-plane?',
    questionTextTamil: 'ஒரு நிலையான மற்றும் காரணமான (causal) LTI அமைப்பிற்கு, அதன் பரிமாற்றச் சார்பு H(z)-ன் அனைத்து துருவங்களும் (poles) z-தளத்தில் எங்கு அமைந்திருக்க வேண்டும்?',
    options: [
      'Outside the unit circle',
      'On the unit circle',
      'Inside the unit circle',
      'On the real axis only'
    ],
    optionsTamil: [
      'அலகு வட்டத்திற்கு வெளியே',
      'அலகு வட்டத்தின் மீது',
      'அலகு வட்டத்திற்கு உள்ளே',
      'மெய் அச்சில் மட்டும்'
    ],
    correctIndex: 2,
    explanation: 'For causality, the ROC must be outside the outermost pole. For stability, the ROC must contain the unit circle. Hence, all poles of H(z) must lie strictly inside the unit circle (|z| < 1).',
    explanationTamil: 'ஒரு காரண காரிய மற்றும் நிலையான அமைப்பிற்கு, H(z) அலைச்சார்பின் அனைத்து துருவங்களும் கண்டிப்பாக z-தளத்தின் அலகு வட்டத்திற்குள் (|z| < 1) அமைந்திருக்க வேண்டும்.'
  },

  // Technical EEE
  {
    id: 'q_eee1',
    category: 'technical',
    branchKey: 'EEE',
    topic: 'Electrical Machines',
    questionText: 'A 4-pole, 3-phase induction motor runs at a frequency of 50 Hz. What is the synchronous speed of this motor?',
    questionTextTamil: 'ஒரு 4-துруவ, 3-கட்ட தூண்டல் மோட்டார் 50 Hz அதிர்வெண்ணில் இயங்குகிறது. இந்த மோட்டாரின் ஒத்திசைவு வேகம் (synchronous speed) என்ன?',
    options: [
      '1000 RPM',
      '1200 RPM',
      '1500 RPM',
      '3000 RPM'
    ],
    optionsTamil: [
      '1000 RPM',
      '1200 RPM',
      '1500 RPM',
      '3000 RPM'
    ],
    correctIndex: 2,
    explanation: 'Synchronous speed Ns = (120 * f) / P. Here, f = 50 Hz, P = 4. Ns = (120 * 50) / 4 = 6000 / 4 = 1500 RPM.',
    explanationTamil: 'ஒத்திசைவு வேகம் Ns = (120 * f) / P. இங்கு f = 50 Hz, P = 4 ஆகும். Ns = (120 * 50) / 4 = 6000 / 4 = 1500 RPM.'
  },
  {
    id: 'q_eee2',
    category: 'technical',
    branchKey: 'EEE',
    topic: 'Power Systems',
    questionText: 'What is the primarily used gaseous insulation medium in high voltage SF6 circuit breakers?',
    questionTextTamil: 'உயர் மின்னழுத்த SF6 சர்க்யூட் பிரேக்கர்களில் முதன்மையாகப் பயன்படுத்தப்படும் வாயு காப்பு ஊடகம் எது?',
    options: [
      'Carbon Dioxide',
      'Nitrogen gas',
      'Sulfur Hexafluoride',
      'Argon gas'
    ],
    optionsTamil: [
      'கார்பன் டை ஆக்சைடு',
      'நைட்ரஜன் வாயு',
      'சல்பர் ஹெக்ஸாபுளோரைடு',
      'ஆர்கான் வாயு'
    ],
    correctIndex: 2,
    explanation: 'Sulfur Hexafluoride (SF6) gas possesses excellent dielectric strength and arc-quenching traits, hence widely used in high voltage switches.',
    explanationTamil: 'சல்பர் ஹெக்ஸாபுளோரைடு (SF6) வாயு சிறந்த மின்காப்பு மற்றும் வில்-தணிப்பு (arc-quenching) குணங்களைக் கொண்டுள்ளது, இதனால் உயர் மின்னழுத்த சுவிட்சுகளில் பரவலாகப் பயன்படுத்தப்படுகிறது.'
  },
  {
    id: 'q_eee3',
    category: 'technical',
    branchKey: 'EEE',
    topic: 'Control Systems',
    questionText: 'A transfer function has its poles in the right-half of the s-plane. What is the stability state of this control system?',
    questionTextTamil: 'ஒரு பரிமாற்றச் சார்பின் துருவங்கள் (poles) s-தளத்தின் வலது பாதியில் உள்ளன. இந்த கட்டுப்பாட்டு அமைப்பின் நிலைத்தன்மை (stability state) என்ன?',
    options: [
      'Stable',
      'Marginally Stable',
      'Unstable',
      'Absolutely Stable'
    ],
    optionsTamil: [
      'நிலையானது (Stable)',
      'ஓரளவு நிலையானது (Marginally Stable)',
      'நிலையற்றது (Unstable)',
      'முற்றிலும் நிலையானது'
    ],
    correctIndex: 2,
    explanation: 'If any pole of the transfer function resides in the right half of the s-plane, the system\'s impulse response grows exponentially over time, rendering it unstable.',
    explanationTamil: 'துருவங்கள் s-தளத்தின் வலது பக்க பாதியில் அமைந்தால், அமைப்பின் வெளியீட்டு பதில் காலப்போக்கில் அதிவேகமாக வளர்கிறது, இதனால் அது நிலையற்றதாக (Unstable) மாறுகிறது.'
  },
  {
    id: 'q_eee4',
    category: 'technical',
    branchKey: 'EEE',
    topic: 'Power Electronics',
    questionText: 'Which power semiconductor device operates strictly as a unidirectional controlled switch?',
    questionTextTamil: 'எந்த மின் குறைக்கடத்தி சாதனம் கண்டிப்பாக ஒரு திசை கட்டுப்பாட்டு சுவிட்சாக (unidirectional controlled switch) மட்டுமே செயல்படுகிறது?',
    options: [
      'TRIAC',
      'Thyristor (SCR)',
      'DIAC',
      'Bidirectional Transistor'
    ],
    optionsTamil: [
      'TIRAC',
      'தைரிஸ்டர் (SCR)',
      'DIAC',
      'இருதிசை டிரான்சிஸ்டர் (Transistor)'
    ],
    correctIndex: 1,
    explanation: 'V_max = 100 thereby V_rms = 100/sqrt(2). I_max = 10 thereby I_rms = 10/sqrt(2). Phase difference phi = pi/2 (90 degrees). Reactive Power Q = V_rms * I_rms * sin(phi) = (100/sqrt(2)) * (10/sqrt(2)) * sin(90) = (1000 / 2) * 1 = 500 VAR.',
    explanationTamil: 'V_max = 100 => V_rms = 100/v2. I_max = 10 => I_rms = 10/v2. கட்ட வேறுபாடு phi = pi/2 (90 டிகிரி). எதிர்வினைத் திறன் Q = V_rms * I_rms * sin(phi) = (100/v2) * (10/v2) * sin(90) = (1000 / 2) * 1 = 500 VAR.'
  },
  // Communication Skills (Round 2)
  {
    id: 'q_comm1',
    category: 'communication',
    topic: 'Professional Email Writing',
    questionText: 'Which of the following is the most appropriate professional salutation for an email to a company recruiter whose name you do not know?',
    questionTextTamil: 'பெயர் தெரியாத ஒரு நிறுவனத்தின் வேலைக்கு ஆள் சேர்ப்பவருக்கு (Recruiter) மின்னஞ்சல் அனுப்பும்போது பின்வருவனவற்றில் எந்த வாழ்த்துரை மிகவும் பொருத்தமானது?',
    options: [
      'Hey There,',
      'Dear Hiring Manager,',
      'To Whomsoever It May Concern,',
      'Respected Recruiter,'
    ],
    optionsTamil: [
      'ஹே தேர் (Hey There),',
      'டியர் ஹையரிங் மேனேஜர் (Dear Hiring Manager),',
      'டு ஹூம்ஸோஎவர் இட் மே கன்சர்ன் (To Whomsoever It May Concern),',
      'ரெஸ்பெக்டட் ரிக்ரூட்டர் (Respected Recruiter),'
    ],
    correctIndex: 1,
    explanation: '"Dear Hiring Manager" is professional, warm, and tailored to the job role without requiring a specific name. "To Whom It May Concern" is too impersonal, while "Hey" is too casual.',
    explanationTamil: '"Dear Hiring Manager" என்பது குறிப்பிட்ட பெயர் தெரியாதபோதும், பணிக்குத் தகுந்தபடி மரியாதையுடனும், நேர்த்தியாகவும் அமையும். "To Whom It May Concern" மிகவும் பொதுவானதாகும், "Hey" முறைசாராதாகும்.'
  },
  {
    id: 'q_comm2',
    category: 'communication',
    topic: 'Grammar - Prepositions',
    questionText: 'Fill in the blank with the correct preposition: "The candidate was adept _____ managing multiple deadlines simultaneously."',
    questionTextTamil: 'சரியான முன்மொழிவை (Preposition) கொண்டு கோடிட்ட இடத்தை நிரப்பவும்: "The candidate was adept _____ managing multiple deadlines simultaneously."',
    options: [
      'at',
      'in',
      'on',
      'with'
    ],
    optionsTamil: [
      'at',
      'in',
      'on',
      'with'
    ],
    correctIndex: 0,
    explanation: 'The adjective "adept" is followed by the preposition "at" (or sometimes "in", but "at" is most standard for skill descriptions: "adept at doing something").',
    explanationTamil: '"adept" என்ற சொல்லுக்குப் பின் "at" என்னும் முன்மொழிவே பொதுவாகப் பயன்படுத்தப்படும் ("adept at doing something" - ஏதேனும் செய்வதில் வல்லவர்).'
  },
  {
    id: 'q_comm3',
    category: 'communication',
    topic: 'Sentence Construction',
    questionText: 'Identify the sentence that uses active voice:',
    questionTextTamil: 'செய்வினை (Active voice) வாக்கியத்தைக் கண்டறியவும்:',
    options: [
      'The source code was reviewed by the technical lead.',
      'A decision will be made by the committee tomorrow.',
      'The engineering team deployed the new app update.',
      'The server issues are being investigated currently.'
    ],
    optionsTamil: [
      'The source code was reviewed by the technical lead.',
      'A decision will be made by the committee tomorrow.',
      'The engineering team deployed the new app update.',
      'The server issues are being investigated currently.'
    ],
    correctIndex: 2,
    explanation: '"The engineering team deployed the new app update" places the actor ("team") as the subject performing the action ("deployed"), which is the active voice.',
    explanationTamil: '"The engineering team deployed the new app update" என்பதில் செயலைச் செய்யும் கர்த்தா ("team") முன்னால் வந்து வினைச்சொல் தொடர்வதால் இது செய்வினை (Active voice) ஆகும்.'
  },
  {
    id: 'q_comm4',
    category: 'communication',
    topic: 'Professional Feedback',
    questionText: 'What is the primary characteristic of "constructive feedback" in a workplace project environment?',
    questionTextTamil: 'பணிச் சூழலில் "ஆக்கபூர்வமான கருத்து" (Constructive feedback) என்பதன் முதன்மைப் பண்பு என்ன?',
    options: [
      'It focuses solely on pointing out past personal mistakes.',
      'It highlights weaknesses with action-oriented suggestions for improvement.',
      'It avoids mentioning any negative aspects to keep the employee happy.',
      'It is delivered publicly so that the entire office can learn from it.'
    ],
    optionsTamil: [
      'அது கடந்த கால தனிப்பட்ட தவறுகளை மட்டுமே சுட்டிக்காட்டில் கவனம் செலுத்துகிறது.',
      'அது குறைகளைச் சுட்டி, அதை மேம்படுத்துவதற்கான செயல்முறைப் பரிந்துரைகளை வழங்குகிறது.',
      'பணியாளரை மகிழ்ச்சியாக வைத்திருக்க எந்தவொரு எதிர்மறையா அம்சங்களையும் குறிப்பிடுவதைத் தவிர்க்கிறது.',
      'அலுவலகத்தில் உள்ள அனைவரும் கற்றுக் கொள்ளும் வகையில் அது பகிரங்கமாக வழங்கப்படுகிறது.'
    ],
    correctIndex: 1,
    explanation: 'Constructive feedback focuses on behaviors and outcomes rather than personal traits, offering specific, actionable steps to improve rather than just criticizing.',
    explanationTamil: 'ஆக்கபூர்வமான கருத்து என்பது வெறுமனே விமர்சிக்காமல், மேம்படுவதற்கான குறிப்பிட்ட மற்றும் செயல்படுத்தக்கூடிய படிகளை (actionable steps) முன்வைப்பதாகும்.'
  },
  {
    id: 'q_comm5',
    category: 'communication',
    topic: 'Active Listening',
    questionText: 'Which of the following describes a key practice of active listening during a placement interview?',
    questionTextTamil: 'ஒரு நேர்காணலின் போது "சுறுசுறுப்பான கவனிப்பு" (Active listening)-ன் முக்கிய நடைமுறையை விவரிப்பது எது?',
    options: [
      'Nodding continuously while preparing your next answer in your head.',
      'Interrupting as soon as you think you know what the interviewer is asking.',
      'Paraphrasing or summarizing the interviewer\'s complex question before answering.',
      'Avoiding and shifting eye contact to show you are thinking deeply.'
    ],
    optionsTamil: [
      'தலைக்குள் அடுத்த விடையைத் தயாரித்துக் கொண்டே தொடர்ந்து தலை அசைப்பது.',
      'அவர்கள் என்ன கேட்கிறார்கள் என்று தெரிந்தவுடன் நேர்காணல் செய்பவரைத் தடுத்து நிறுத்துவது.',
      'பதிலளிப்பதற்கு முன் நேர்காணல் செய்பவரின் சிக்கலான கேள்வியைச் சுருக்கமாகத் திரும்பக் கூறுவது.',
      'ஆழமாகச் சிந்திக்கிறீர்கள் என்பதைக் காட்ட கண் தொடர்பைத் தவிர்ப்பது.'
    ],
    correctIndex: 2,
    explanation: 'Paraphrasing shows that you have processed and confirmed the message. Active listening involves fully receiving, understanding, and reflecting on the speaker\'s input.',
    explanationTamil: 'கேள்வியைச் சுருக்கிக் கூறுவது (Paraphrasing) நீங்கள் செய்தியை சரியாகப் புரிந்து கொண்டீர்கள் என்பதை உறுதிப்படுத்தும். முழுமையாகக் கவனித்து உள்வாங்குவதே இதன் நோக்கமாகும்.'
  },

  // HR Interview Skills (Round 3)
  {
    id: 'q_hr1',
    category: 'hr',
    topic: 'Self-Awareness & Weakness',
    questionText: 'When an HR interviewer asks, "What is your greatest weakness?", what is the most effective approach to answer?',
    questionTextTamil: 'நேர்காணல் செய்பவர் "உங்களின் மிகப்பெரிய பலவீனம் என்ன?" என்று கேட்கும்போது, பதிலளிப்பதற்கான மிகச் சிறந்த அணுகுமுறை எது?',
    options: [
      'Saying you have no weaknesses to project complete confidence.',
      'Providing a personal weakness that has no relevance to professional work.',
      'Sharing a genuine professional weakness alongside concrete actions you are taking to overcome it.',
      'Describing a positive quality disguised as a weakness, such as "I am too much of a perfectionist."'
    ],
    optionsTamil: [
      'முழுமையான தன்னம்பிக்கையைக் காட்ட தங்களுக்கு பலவீனம் எதுவும் இல்லை என்று கூறுவது.',
      'பணிச் சூழலுக்குத் தொடர்பில்லாத ஒரு தனிப்பட்ட பலவீனத்தைக் கூறுவது.',
      'ஒரு உண்மையான பலவீனத்தைப் பகிர்ந்து, அதைச் சரிசெய்ய நீங்கள் எடுக்கும் ஆக்கபூர்வமான முயற்சிகளை விவரிப்பது.',
      '"நான் எல்லாவற்றையும் மிகத் துல்லியமாகச் செய்வேன்" என்பது போல பலத்தை பலவீனமாகக் காட்டுவது.'
    ],
    correctIndex: 2,
    explanation: 'Sharing a real but non-fatal weakness along with active steps toward self-improvement demonstrates high self-awareness, honesty, and growth mindset.',
    explanationTamil: 'உண்மையான பலவீனத்தைக் கூறி, அதை மேம்படுத்த மேற்கொள்ளப்படும் முயற்சிகளை விளக்குவது சுயவிழிப்புணர்வு (self-awareness) மற்றும் வளர்ச்சி மனப்பான்மையைக் காட்டுகிறது.'
  },
  {
    id: 'q_hr2',
    category: 'hr',
    topic: 'Conflict Resolution',
    questionText: 'If a major conflict arises between you and a flatmate or group-mate in college/work, how should you initially handle it?',
    questionTextTamil: 'கல்லூரி அல்லது பணிச் சூழலில் உங்களுக்கும் உங்கள் குழுவைச் சேர்ந்தவருக்கும் இடையே ஒரு பெரிய கருத்து வேறுபாடு ஏற்பட்டால், அதை நீங்கள் ஆரம்பத்தில் எவ்வாறு கையாள்வீர்கள்?',
    options: [
      'Report the person immediately to a higher authority or professor.',
      'Discuss the issue directly with the person in private, focusing on objective facts rather than emotions.',
      'Ignore the conflict and hope it resolves itself over time.',
      'Acknowledge the dispute on social media or group chats to gather support.'
    ],
    optionsTamil: [
      'உடனடியாக அவரைப் பற்றி பேராசிரியரிடமோ அல்லது உயர் அதிகாரியிடமோ புகார் அளிப்பது.',
      'தனிப்பட்ட முறையில் அவரிடம் நேரடியாகவும், உணர்ச்சிகளைத் தவிர்த்து உண்மைகள் குறித்தும் பேசுவது.',
      'கருத்து வேறுபாட்டைக் கண்டு கொள்ளாமல் விட்டுவிடுவது மற்றும் அது காலப்போக்கில் சரியாகும் என நம்புவது.',
      'ஆதரவைத் திரட்டுவதற்காக சமூக ஊடகங்களில் அல்லது குழு அரட்டைகளில் அதை விவாதிப்பது.'
    ],
    correctIndex: 1,
    explanation: 'Direct, private, and calm communication addressing the facts of the dispute is the standard professional approach for successful conflict resolution.',
    explanationTamil: 'உணர்ச்சிகளைக் காட்டாமல் நேரடியாகவும், தனிப்பட்ட முறையிலும், அமைதியாகவும் உண்மைகளை விளக்கிப் பேசுவது வெற்றிகரமான தீர்வுக்கு வழிவகுக்கும்.'
  },
  {
    id: 'q_hr3',
    category: 'hr',
    topic: 'Career Trajectory',
    questionText: 'What are HR recruiters primarily looking for when they ask, "Where do you see yourself in five years?"',
    questionTextTamil: '"ஐந்து ஆண்டுகளில் உங்களை நீங்கள் எங்கே காண்கிறீர்கள்?" என்று கேட்கும்போது, ஆள் சேர்ப்பவர்கள் முதன்மையாக எதனைத் தேடுகிறார்கள்?',
    options: [
      'If you have plans to start your own business or compete with them soon.',
      'If you possess ambitious plans to jump to a higher paying company.',
      'Whether your career expectations align realistic progress within the company’s domain.',
      'Whether you can memorize a highly specific job title which you want to achieve.'
    ],
    optionsTamil: [
      'நீங்கள் விரைவில் சொந்தமாகத் தொழில் தொடங்கப் போகிறீர்களா என்பதை அறிய.',
      'அதிக ஊதியம் தரும் மற்றொரு நிறுவனத்திற்கு மாறத் திட்டமிடுகிறீர்களா என்பதைத் தெரிந்துகொள்ள.',
      'உங்களின் தொழில் இலக்குகள் நிறுவனத்தின் செயல்பாட்டுடன் ஒத்துப்போகிறதா மற்றும் நீண்டகாலம் நிலைத்திருப்பீர்களா என்பதை அறிய.',
      'நீங்கள் அடைய விரும்பும் ஒரு குறிப்பிட்ட உயர் பதவியின் பெயரை மனப்பாடம் செய்து வைத்திருக்கிறீர்களா என்று பார்க்க.'
    ],
    correctIndex: 2,
    explanation: 'Recruiters want to verify if your professional expectations are grounded in reality and if you intend to cultivate a long-term future in their industry or firm.',
    explanationTamil: 'உங்கள் இலக்குகள் நிறுவனத்தின் வளர்ச்சிக்கு உகந்ததாகவும், நீண்டகாலப் பார்வையில் நீங்கள் தொடர்ந்து பணியாற்ற விரும்புவதையும் உறுதி செய்யவே இக்கேள்வி கேட்கப்படுகிறது.'
  },
  {
    id: 'q_hr4',
    category: 'hr',
    topic: 'Time Management',
    questionText: 'You realize that due to an unexpected roadblock, you will miss a critical project deadline. What is the most responsible action?',
    questionTextTamil: 'எதிர்பாராத தடையால், திட்டப்பணிக்கான காலக்கெடுவை (Deadline) உங்களால் எட்ட முடியாது என்று உணர்கிறீர்கள். மிகவும் பொறுப்பான செயல் எது?',
    options: [
      'Work silently and submit the project late without telling anyone beforehand.',
      'Inform your team lead immediately, explain the issue, and present a revised plan with a new realistic timeline.',
      'Blame other members of your group for the delay to protect your individual track record.',
      'Hope that no one notices the delay and quickly hand in incomplete work.'
    ],
    optionsTamil: [
      'முன்கூட்டியே யாரிடமும் கூறாமல் அமைதியாக வேலை செய்து திட்டப்பணியை தாமதமாக சமர்ப்பிப்பது.',
      'உடனடியாக உங்கள் குழுத் தலைவருக்குத் தகவல் தெரிவித்து, பிரச்சனைக்கான காரணத்தையும் மாற்றுத் திட்டத்தையும் சமர்ப்பிவது.',
      'உங்கள் நற்பெயரைக் காப்பாற்றிக் கொள்ள உங்கள் குழுவின் பிற உறுப்பினர்கள் மீது குற்றச்சாட்டு வைப்பது.',
      'காலதாமதத்தை யாரும் கவனிக்க மாட்டார்கள் என்று நம்பி முழுமையடையாத வேலையைச் சமர்ப்பிப்பது.'
    ],
    correctIndex: 1,
    explanation: 'Proactive communication and presenting solutions rather than just problems is the hallmark of professional accountability when dealing with setbacks.',
    explanationTamil: 'பிரச்சனையை முன்கூட்டியே தெரிவித்து, அதற்கான தீர்வு அல்லது மாற்றுத் திட்டத்தைக் கொண்டு செல்வதே தொழில்சார்ந்த பொறுப்புணர்வின் அடையாளமாகும்.'
  },
  {
    id: 'q_hr5',
    category: 'hr',
    topic: 'STAR Methodology',
    questionText: 'What does the "STAR" framework stand for when preparing for behavioral role-play or situation interview questions?',
    questionTextTamil: 'சுயவிவர நேர்காணல் கேள்விகளுக்குப் பதிலளிக்கப் பயன்படும் "STAR" கட்டமைப்பு எதனைக் குறிக்கிறது?',
    options: [
      'Strategy, Timing, Assessment, Report',
      'System, Technology, Analysis, Results',
      'Situation, Task, Action, Result',
      'Solve, Target, Assert, Review'
    ],
    optionsTamil: [
      'ஸ்ட்ராட்டஜி, டைமிங், அசெஸ்மென்ட், ரிப்போர்ட் (Strategy, Timing, Assessment, Report)',
      'சிஸ்டம், டெக்நல்லாஜி, அனாலிசிஸ், ரிசல்ட்ஸ் (System, Technology, Analysis, Results)',
      'சிச்சுவேஷன், டாஸ்க், ஆக்ஷன், ரிசல்ட் (Situation, Task, Action, Result)',
      'சால்வ், டார்கெட், அஸெர்ட், ரிவியூ (Solve, Target, Assert, Review)'
    ],
    correctIndex: 2,
    explanation: 'STAR stands for Situation, Task, Action, and Result. It is a highly-recommended structured way to answer behavioral and situational job interview queries.',
    explanationTamil: 'STAR என்பது சிச்சுவேஷன் (சூழல்), டாஸ்க் (பணி), ஆக்ஷன் (செயல்), ரிசல்ட் (முடிவு) ஆகியவற்றைக் குறிக்கிறது. நேர்காணல்களில் விரிவாகப் பதிலளிக்க இது உதவுகிறது.'
  }
];

export const mockTests: MockTest[] = [
  {
    id: 't1',
    title: 'TCS NQT National Qualifier Test',
    company: 'TCS',
    durationMins: 45,
    totalQuestions: 15,
    scores: { 's1': 82, 's2': 65, 's3': 85 }
  },
  {
    id: 't2',
    title: 'Zoho Software Engineer Assessment',
    company: 'Zoho',
    durationMins: 60,
    totalQuestions: 15,
    scores: { 's1': 75, 's3': 90 }
  },
  {
    id: 't3',
    title: 'Infosys Placement Drive',
    company: 'Infosys',
    durationMins: 40,
    totalQuestions: 15,
    scores: { 's1': 78, 's2': 60, 's4': 58 }
  },
  {
    id: 't4',
    title: 'Wipro ELITE National Talent Hunt',
    company: 'Wipro',
    durationMins: 50,
    totalQuestions: 15,
    scores: {}
  },
  {
    id: 't5',
    title: 'L&T Core Graduate Engineer Trainee Test',
    company: 'L&T',
    durationMins: 60,
    totalQuestions: 15,
    scores: {}
  }
];


// Sample Resumes to load instantly
export const sampleResumes = {
  highQuality: `MADHAN KUMAR
Email: madhana23112005@gmail.com | Phone: +91 98765 43210
B.E. Computer Science and Engineering - College of Engineering, Guindy
CGPA: 8.6 / 10.0 (Expected graduation: May 2026)

SKILLS:
- Languages: JavaScript, Python, TypeScript, Java, SQL, C++
- Frameworks & DBs: React, Node.js, Express, PostgreSQL, MongoDB, Redis
- Core concepts: OOPs, DBMS, Operating Systems, Computer Networks, Data Structures & Algorithms
- Tools: Git, Docker, GCP

PROJECTS:
1. CrackIt Placement Prep Platform (Full Stack React & Express)
   - Created adaptive daily quiz engine using machine learning concepts and Gemini API.
   - Built automatic resume parser giving company-specific cutoff rating.
   - Reduced dashboard load latencies by 35% through customized SQL querying.
2. Smart Agriculture System (IoT & Web Dashboard)
   - Programmed ESP32 sensor boards to stream real-time nitrogen and moisture stats.
   - Integrated custom Node.js alert triggers for abnormal soil settings.

ACHIEVEMENTS:
- Winner, Anna University Annual Hackathon (2025)
- Solved 400+ problems on Leetcode (Top 12% Ranking)`,

  lowQuality: `ABISHEK B
Email: abishek@ceg.edu
Branch: Electronics and Communication Engineering (ECE)
CGPA: 6.8 / 10

EDUCATION:
- B.E. student at Anna University
- Passed HSC in 2022
- Passed SSLC in 2020

TECHNICAL INTERESTS:
- Studying Microprocessors
- Browsing web
- Gaming

PROJECTS DONE:
1. Simple Calculator
   - Created calculator project in Java.
2. Digital Clock
   - Simple HTML/CSS clock representation.

EXTRA CURRICULAR:
- Active NSS volunteer
- Participated in department symposium cultural events.`
};
