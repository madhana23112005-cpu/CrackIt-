# CrackIt 🚀

> Placement training platform built for engineering students.

CrackIt helps students prepare smarter — with adaptive mock tests, AI-powered resume feedback, company-specific question banks, and a Placement Readiness Score that tracks progress end to end.

---

## Features

- **Adaptive Question Engine** — Questions get harder or easier based on your performance
- **Company-Specific Prep** — Curated question banks and patterns for top recruiters
- **AI Resume Validator** — Upload your resume and get role-specific feedback powered by Gemini
- **Mock Tests** — Timed, full-length tests with instant analytics
- **Placement Readiness Score** — A single score that reflects your overall preparation level
---
## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML / CSS / JavaScript |
| Backend & Auth | Firebase (Firestore, Authentication) |
| File Storage | Firebase Storage |
| Hosting | Netlify |
| AI | Gemini API via Google AI Studio |

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase CLI — `npm install -g firebase-tools`
- A Firebase project with Firestore, Auth, and Storage enabled
- A Gemini API key from [Google AI Studio](https://aistudio.google.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/CrackIt.git
cd CrackIt

# Install dependencies (if applicable)
npm install

# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init
```

### Environment Variables

Create a `.env` file (or update your Firebase config file) with:

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

### Run Locally

```bash
firebase emulators:start
```

### Deploy

```bash
Netlify deploy
```

---

## Project Structure

```
CrackIt/
├── public/
│   ├── index.html
│   ├── dashboard/
│   ├── tests/
│   ├── resume/
│   └── admin/
├── functions/          # Firebase Cloud Functions (if used)
├── firestore.rules
├── storage.rules
├── firebase.json
└── .firebaserc
```

---

## Roadmap

- [x] Adaptive question engine
- [x] AI resume validator (Gemini)
- [x] Mock tests with analytics
- [x] Placement Readiness Score
- [ ] Leaderboard & peer comparison
- [ ] College-level analytics dashboard

---

## Target Users

Students from Anna University-affiliated engineering colleges preparing for campus placements — particularly those who need structured, company-aware preparation without paid coaching.

---

## Author

**Madhan** — B.E. EEE, Government College of Engineering, Erode  
[LinkedIn](https://linkedin.com/in/your-profile) · [GitHub](https://github.com/your-username)
