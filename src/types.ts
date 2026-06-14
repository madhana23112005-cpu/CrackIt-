export type UserRole = 'student' | 'tpo' | 'superadmin';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  collegeId: string;
  collegeName: string;
  branch: 'CSE' | 'ECE' | 'EEE';
  cgpa: number;
  aptitudeAccuracy: number; // percentage
  technicalAccuracy: number; // percentage
  mockTestAverage: number; // percentage
  resumeScore: number; // percentage
  readinessScore: number; // overall calculated score
  weakTopics: string[];
  strongTopics: string[];
  questionsAnsweredToday: number;
  dailyStreak: number;
  assignedTestsIds: string[];
  attendedQuestionIds?: string[];
}

export interface College {
  id: string;
  name: string;
  location: string;
  studentCount: number;
  tpoName: string;
  averageReadiness: number;
}

export interface Question {
  id: string;
  category: 'aptitude' | 'technical' | 'communication' | 'hr';
  branchKey?: 'CSE' | 'ECE' | 'EEE';
  topic: string;
  questionText: string;
  questionTextTamil?: string;
  options: string[];
  optionsTamil?: string[];
  correctIndex: number;
  explanation: string;
  explanationTamil?: string;
  company?: 'TCS' | 'Infosys' | 'Wipro' | 'Zoho' | 'L&T';
}

export interface ResumeValidationResult {
  score: number;
  company: string;
  cgpaValidation: {
    passed: boolean;
    cutoff: number;
    message: string;
  };
  keyFeedback: string[];
  matchingSkills: string[];
  missingSkills: string[];
  projectFeedback: string;
  actionItems: string[];
}

export interface MockTest {
  id: string;
  title: string;
  company: 'TCS' | 'Infosys' | 'Wipro' | 'Zoho' | 'L&T';
  durationMins: number;
  totalQuestions: number;
  scores: { [studentId: string]: number };
}
