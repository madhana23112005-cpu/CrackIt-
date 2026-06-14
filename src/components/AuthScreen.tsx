import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Sparkles, Languages, Mail, Lock, AlertTriangle, CheckCircle2, User, BookOpen, GraduationCap, Building, Key } from 'lucide-react';

interface AuthScreenProps {
  language: 'english' | 'tamil';
  setLanguage: (lang: 'english' | 'tamil') => void;
  showToast: (msg: string) => void;
  displayNotification: string | null;
}

export default function AuthScreen({
  language,
  setLanguage,
  showToast,
  displayNotification
}: AuthScreenProps) {
  const isTamil = language === 'tamil';

  const [isSignUp, setIsSignUp] = useState(false);
  const [authType, setAuthType] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Custom signup metadata inputs
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);

  const t = (enKey: string, tamilKey: string) => {
    return isTamil ? tamilKey : enKey;
  };

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Minor validation
    if (authType !== 'admin') {
      if (!email || !password) {
        setErrorMsg(t('Please fill in all fields.', 'தயவுசெய்து அனைத்து விவரங்களையும் நிரப்பவும்.'));
        return;
      }
    }

    if (password.length > 0) {
      if (password.trim().length < 6) {
        setErrorMsg(t('Password must be at least 6 characters long.', 'கடவுச்சொல் குறைந்தது 6 எழுத்துக்களைக் கொண்டிருக்க வேண்டும்.'));
        return;
      }
    } else {
      if (!adminSecretKey) {
        setErrorMsg(t('Please enter your Admin Access Key.', 'தயவுசெய்து உங்கள் நிர்வாகி அணுகல் சாவியை உள்ளிடவும்.'));
        return;
      }
    }

    if (isSignUp) {
      const trimmedPass = (password || '').trim();
      const trimmedConfirm = (confirmPassword || '').trim();
      if (trimmedPass !== trimmedConfirm) {
        setErrorMsg(t('Passwords do not match. Please verify that both password fields are identical without extra spaces.', 'கடவுச்சொற்கள் பொருந்தவில்லை. இரு கடவுச்சொற்களும் சரியாகப் பொருந்துவதை உறுதிசெய்யவும்.'));
        return;
      }
      if (!fullName) {
        setErrorMsg(t('Please enter your full name.', 'தயவுசெய்து உங்கள் முழு பெயரை உள்ளிடவும்.'));
        return;
      }
      if (!collegeName) {
        setErrorMsg(t('Please enter your affiliated college name.', 'தயவுசெய்து உங்கள் கல்லூரி பெயரை உள்ளிடவும்.'));
        return;
      }
      if (authType === 'student') {
        if (!department || !registerNumber) {
          setErrorMsg(t('Please fill in Department and Register Number.', 'துறை மற்றும் பதிவு எண்ணை உள்ளிடவும்.'));
          return;
        }
      }
    }

    let targetEmail = email;
    let targetPassword = password;

    if (authType === 'admin') {
      const keyInput = adminSecretKey.trim();
      const isValidKey = keyInput === 'Madhan0013' || keyInput.toLowerCase() === 'madhan0013' || keyInput.toLowerCase() === 'madhan' || keyInput.toLowerCase() === 'madhan2026' || keyInput.toLowerCase() === 'madhan3000' || keyInput.toLowerCase() === 'madhan123';
      
      if (isValidKey) {
        targetEmail = 'madhana23112005@gmail.com';
        targetPassword = 'Madhan0013';
      } else {
        setErrorMsg(t('Invalid Admin Access Key.', 'தவறான நிர்வாகி அணுகல் சாவி.'));
        return;
      }
    }

    const emailKey = targetEmail.trim().toLowerCase();

    // 1. Pre-Authentication LocalStorage Check to prevent cross-portal mismatch instantly
    const cachedRole = localStorage.getItem('crackit_role_' + emailKey);
    if (cachedRole && authType !== 'admin') {
      const isAllowed = 
        (authType === 'student' && cachedRole === 'student') ||
        (authType === 'admin' && (cachedRole === 'admin' || cachedRole === 'superadmin' || cachedRole === 'tpo'));
      
      if (!isAllowed) {
        setErrorMsg(authType === 'student'
          ? t('This email is registered as an Admin. Please use the Admin Gate.', 'இந்த மின்னஞ்சல் நிர்வாகி கணக்காக பதிவு செய்யப்பட்டுள்ளது. தயவுசெய்து நிர்வாகி போர்ட்டலை பயன்படுத்தவும்.')
          : t('This email is registered as a Student. Please use the Student Access.', 'இந்த மின்னஞ்சல் மாணவர் கணக்காக பதிவு செய்யப்பட்டுள்ளது. தயவுசெய்து மாணவர் போர்ட்டலை பயன்படுத்தவும்.')
        );
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Create Auth account
        const userCredential = await createUserWithEmailAndPassword(auth, targetEmail.trim(), targetPassword);
        const signedUser = userCredential.user;

        const finalRole = (signedUser.email === 'madhana23112005@gmail.com' || authType === 'admin') ? 'superadmin' : authType;

        // Save profile data in Firestore under /users/{uid}
        const profileRef = doc(db, 'users', signedUser.uid);
        const profileData: any = {
          uid: signedUser.uid,
          email: signedUser.email,
          role: finalRole,
          name: fullName.trim(),
          college: collegeName.trim(),
          collegeName: collegeName.trim(),
          createdAt: new Date().toISOString()
        };

        if (authType === 'student') {
          profileData.department = department.trim();
          profileData.registerNumber = registerNumber.trim();
        }

        try {
          await setDoc(profileRef, profileData);
        } catch (dbErr: any) {
          console.warn("Firestore database write error (client offline). Profile cached locally.", dbErr);
          showToast(t("Registration saved locally (Offline mode).", "பதிவு உள்ளூராக சேமிக்கப்பட்டது (ஆஃப்லைன் பயன்முறை)."));
        }

        // Record in LocalStorage
        localStorage.setItem('crackit_role_' + emailKey, finalRole);
        localStorage.setItem('crackit_role_' + signedUser.uid, finalRole);

        // Send email verification
        try {
          await sendEmailVerification(signedUser);
        } catch (verificationErr: any) {
          console.warn("Could not send verification email on signup:", verificationErr);
        }

        // Sign out immediately because they must verify before they can log in
        await signOut(auth);

        setVerificationSentEmail(signedUser.email || targetEmail.trim());
        setSuccessMsg(null);
      } else {
        // Log in
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, targetEmail.trim(), targetPassword);
        } catch (signInErr: any) {
          const isUserNotFoundError = signInErr.code === 'auth/user-not-found' || 
                                      signInErr.code === 'auth/invalid-login-credentials' || 
                                      signInErr.code === 'auth/invalid-credential';
          
          if (authType === 'admin' && isUserNotFoundError) {
            try {
              userCredential = await createUserWithEmailAndPassword(auth, targetEmail.trim(), targetPassword);
              const signedUser = userCredential.user;
              const profileRef = doc(db, 'users', signedUser.uid);
              await setDoc(profileRef, {
                uid: signedUser.uid,
                email: signedUser.email,
                role: 'superadmin',
                name: 'Madhan (Admin)',
                createdAt: new Date().toISOString()
              });
            } catch (createErr) {
              console.error("Auto-registration of admin failed", createErr);
              throw signInErr;
            }
          } else {
            throw signInErr;
          }
        }

        const signedUser = userCredential.user;

        // Check if Admin Key was supplied on login
        let isSuperadmin = false;
        if (authType === 'admin') {
          isSuperadmin = true;
        }

        // Check email verification status for all non-bypassed accounts
        const isBypass = signedUser.email === 'madhana23112005@gmail.com' || isSuperadmin;
        if (!signedUser.emailVerified && !isBypass) {
          try {
            await sendEmailVerification(signedUser);
          } catch (verificationErr: any) {
            console.warn("Could not send verification email on login check:", verificationErr);
          }
          await signOut(auth);
          setVerificationSentEmail(signedUser.email || targetEmail.trim());
          setSuccessMsg(null);
          setLoading(false);
          return;
        }

        // Check profile status in Firestore
        const profileRef = doc(db, 'users', signedUser.uid);
        
        let profileSnap;
        let isOffline = false;
        try {
          profileSnap = await getDoc(profileRef);
        } catch (dbErr: any) {
          isOffline = true;
          console.warn("Firestore offline or unreachable. Logging in with offline fallback...", dbErr);
        }

        if (!isOffline && profileSnap && profileSnap.exists()) {
          const profileData = profileSnap.data();
          let dbRole = profileData.role;

          if (signedUser.email === 'madhana23112005@gmail.com' || isSuperadmin) {
            dbRole = 'superadmin';
            // Sync role promotion to firestore if it was selected or claimed by key
            try {
              await setDoc(profileRef, { ...profileData, role: 'superadmin' }, { merge: true });
            } catch (mergeErr) {
              console.warn("Couldn't sync superadmin role promotion to Firestore", mergeErr);
            }
          }

          // Admin / Superadmin is allowed through Admin login gateway, but student/admin must match perfectly
          const isAllowed = 
            (authType === 'student' && dbRole === 'student') ||
            (authType === 'admin' && (dbRole === 'admin' || dbRole === 'superadmin' || dbRole === 'tpo'));

          if (!isAllowed) {
            await auth.signOut();
            throw { code: 'auth/role-mismatch', role: dbRole };
          }

          // Record verified role variables
          localStorage.setItem('crackit_user_auth_role', dbRole);
          localStorage.setItem('crackit_user_role', dbRole);
          localStorage.setItem('crackit_role_' + emailKey, dbRole);
          localStorage.setItem('crackit_role_' + signedUser.uid, dbRole);
        } else {
          // Absolute offline mode or undocumented legacy fallback
          let fallbackRole = authType === 'admin' ? 'superadmin' : 'student';
          
          if (signedUser.email === 'madhana23112005@gmail.com') {
            fallbackRole = 'superadmin';
          }

          const cachedUserRole = localStorage.getItem('crackit_role_' + emailKey) || localStorage.getItem('crackit_role_' + signedUser.uid);
          
          if (cachedUserRole) {
            let finalResolvedRole = cachedUserRole;
            if (isSuperadmin) {
              finalResolvedRole = 'superadmin';
            }

            const isAllowed = 
              (authType === 'student' && finalResolvedRole === 'student') ||
              (authType === 'admin' && (finalResolvedRole === 'admin' || finalResolvedRole === 'superadmin' || finalResolvedRole === 'tpo'));
            
            if (!isAllowed) {
              await auth.signOut();
              throw { code: 'auth/role-mismatch', role: finalResolvedRole };
            }
            
            localStorage.setItem('crackit_user_auth_role', finalResolvedRole);
            localStorage.setItem('crackit_user_role', finalResolvedRole);
            localStorage.setItem('crackit_role_' + emailKey, finalResolvedRole);
            localStorage.setItem('crackit_role_' + signedUser.uid, finalResolvedRole);
          } else {
            // First time sign-in on this device, and database is unreachable!
            if (isOffline) {
              await auth.signOut();
              throw { code: 'auth/first-time-offline' };
            }

            // Database is online but profile document doesn't exist. Create it for legacy user.
            const legacyName = email.split('@')[0].split(/[._-]/).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            
            try {
              await setDoc(profileRef, {
                uid: signedUser.uid,
                email: signedUser.email,
                role: fallbackRole,
                name: legacyName,
                createdAt: new Date().toISOString()
              });
            } catch (errSec) {
              console.warn("Could not save profile creation, proceeding local anyway", errSec);
            }

            localStorage.setItem('crackit_user_auth_role', fallbackRole);
            localStorage.setItem('crackit_user_role', fallbackRole);
            localStorage.setItem('crackit_role_' + emailKey, fallbackRole);
            localStorage.setItem('crackit_role_' + signedUser.uid, fallbackRole);
          }
        }

        setSuccessMsg(t('Logged in successfully!', 'வெற்றிகரமாக உள்நுழையப்பட்டது!'));
        showToast(t('Welcome back!', 'மீண்டும் வருக!'));
      }
    } catch (error: any) {
      localStorage.removeItem('crackit_user_auth_role');
      localStorage.removeItem('crackit_user_role');
      console.error("Authentication Error Details:", error);
      const errCode = error.code || '';

      if (errCode === 'auth/role-mismatch') {
        if (authType === 'student') {
          setErrorMsg(t(
            'This email is registered as an Admin. Please use the Admin Gate.',
            'இந்த மின்னஞ்சல் நிர்வாகி கணக்காக பதிவு செய்யப்பட்டுள்ளது. தயவுசெய்து நிர்வாகி போர்ட்டலை பயன்படுத்தவும்.'
          ));
        } else {
          setErrorMsg(t(
            'This email is registered as a Student. Please use the Student Access.',
            'இந்த மின்னஞ்சல் மாணவர் கணக்காக பதிவு செய்யப்பட்டுள்ளது. தயவுசெய்து மாணவர் போர்ட்டலை பயன்படுத்தவும்.'
          ));
        }
      } else if (errCode === 'auth/first-time-offline') {
        setErrorMsg(t(
          'First-time sign-in on this browser requires an active connection for security. Please check your network and retry.',
          'இந்த உலாவியில் முதல்முறை உள்நுழையும்போது பாதுகாப்புக்காக இணைய இணைப்பு தேவை. தயவுசெய்து உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
        ));
      } else if (isSignUp) {
        if (errCode === 'auth/email-already-in-use') {
          setErrorMsg(t('User already exists. Please sign in.', 'பயனர் ஏற்கனவே உள்ளார். தயவுசெய்து உள்நுழையவும்.'));
        } else {
          setErrorMsg(error.message || t('Registration failed. Please try again.', 'பதிவு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'));
        }
      } else {
        setErrorMsg(t('Email or password is incorrect.', 'மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800 relative overflow-hidden" id="auth-screen-layout">
      {/* Decorative ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* TOP BAR / HEADER */}
      <header className="w-full bg-white/70 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
        <div 
          className="flex items-center gap-2.5 select-none cursor-pointer"
          onDoubleClick={() => {
            const nextType = authType === 'student' ? 'admin' : 'student';
            setAuthType(nextType);
            showToast(nextType === 'admin' ? 'Secret Admin Gate Unlocked 🔐' : 'Student Mode Active 🎓');
          }}
          title={t("Double-click to verify special system permissions", "சிறப்பு அனுமதிகளை சரிபார்க்க இருமுறை கிளிக் செய்யவும்")}
        >
          <div className="bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 p-2 rounded-xl shadow-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
              CrackIt
            </span>
            <div className="text-[9px] text-slate-400 font-medium tracking-widest uppercase block sm:hidden md:block">
              Unified Career & Placement Hub
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <button
          onClick={() => setLanguage(language === 'english' ? 'tamil' : 'english')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 text-blue-600" />
          <span>{isTamil ? 'English' : 'தமிழ்'}</span>
        </button>
      </header>

      {/* CENTRAL AUTH CARD */}
      <main className="flex-1 flex items-center justify-center p-6 z-10" id="auth-card-container">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-8 md:p-10 transition-all duration-300">
          {verificationSentEmail ? (
            <div className="text-center space-y-6 py-4 animate-fade-in fade-in" id="auth-verification-sent-screen">
              <div className="mx-auto bg-blue-50 text-blue-600 p-4 rounded-full w-16 h-16 flex items-center justify-center shadow-inner border border-blue-100 animate-bounce">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                {t('Verify Your Email', 'மின்னஞ்சலைச் சரிபார்க்கவும்')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl font-medium">
                {t(
                  `We have sent you a verification email to ${verificationSentEmail}. Please verify it and log in.`,
                  `நாங்கள் ${verificationSentEmail} முகவரிக்கு ஒரு சரிபார்ப்பு மின்னஞ்சலை அனுப்பியுள்ளோம். தயவுசெய்து அதைச் சரிபார்த்து உள்நுழையவும்.`
                )}
              </p>
              
              <button
                onClick={() => {
                  setVerificationSentEmail(null);
                  setIsSignUp(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-blue-100 hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                id="auth-verification-login-btn"
                type="button"
              >
                <span>{t('Login', 'உள்நுழைக')}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Header Description */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-800">
                  {isSignUp 
                    ? t('Student Registration', 'மாணவர் கணக்கு உருவாக்கவும்')
                    : (authType === 'student' ? t('Placement Student Sign In', 'மாணவர் உள்நுழைவு') : t('Admin Portal Sign In', 'நிர்வாகி உள்நுழைவு'))
                  }
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {isSignUp 
                    ? t('Prepare yourself with standard corporate assessments, resume grading metrics, and AI mock panels.', 'பெருநிறுவன வினாத்தாள்கள் மற்றும் AI விவரக்குறிப்பு மதிப்பீடுகளுடன் உங்களைத் தயார்படுத்திக் கொள்ளுங்கள்.')
                    : (authType === 'student'
                        ? t('Sign in with your placement credentials to access practice assessments, analytics and mock benchmarks.', 'பயிற்சி வினாக்கள் மற்றும் பகுப்பாய்வுகளை அணுக உங்கள் நற்சான்றுகளுடன் உள்நுழையவும்.')
                        : t('Sign in to access advanced management features, configure assessments, and view comprehensive analytics dashboards.', 'நிர்வாக அம்சங்களை அணுகவும், பகுப்பாய்வு டாஷ்போர்டுகளை பார்வையிடவும் உள்நுழையவும்.'))
                  }
                </p>
              </div>

              {/* Form Errors */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl border border-rose-150 bg-rose-50/70 text-rose-800 text-xs font-semibold mb-6 flex gap-2.5 items-start fade-in" id="auth-error-alert">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl border border-emerald-150 bg-emerald-50/70 text-emerald-800 text-xs font-semibold mb-6 flex gap-2.5 items-start fade-in" id="auth-success-alert">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="leading-relaxed">{successMsg}</p>
                  </div>
                </div>
              )}

              {/* Actual Login Form */}
              <form onSubmit={handleAuthentication} className="space-y-4">
                
                {/* Email Field */}
                {authType !== 'admin' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="auth-email">
                      {t('EMAIL ADDRESS', 'மின்னஞ்சல் முகவரி')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        id="auth-email"
                        required={authType !== 'admin'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.name@annauniv.edu"
                        className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Password Field */}
                {authType !== 'admin' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="auth-password">
                      {t('PASSWORD', 'ரகசிய கடவுச்சொல்')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        id="auth-password"
                        required={authType !== 'admin'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Admin Access Key (Only for Admin tab) */}
                {authType === 'admin' && (
                  <div className="space-y-1 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/50 animate-fade-in fade-in" id="admin-access-key-container">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-700 mb-1 flex items-center gap-1" htmlFor="auth-admin-key">
                      <Key className="w-3.5 h-3.5 text-indigo-500" />
                      {t('ADMIN ACCESS KEY', 'நிர்வாகி அணுகல் சாவி')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                        <Key className="w-4 h-4 text-indigo-400 shrink-0" />
                      </span>
                      <input
                        type="password"
                        id="auth-admin-key"
                        required
                        value={adminSecretKey}
                        onChange={(e) => setAdminSecretKey(e.target.value)}
                        placeholder={t("Enter secret key for Admin", "நிர்வாகிகளுக்கான சாவி")}
                        className="block w-full pl-9 pr-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-indigo-900"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-[9px] text-indigo-600 leading-normal font-medium pt-1">
                      {t("Enter the admin secret key (e.g. madhan) to access administrative controls.", "நிர்வாகக் கட்டுப்பாடுகளை அணுக நிர்வாகி ரகசிய சாவியை (எ.கா. madhan) உள்ளிடவும்.")}
                    </p>
                  </div>
                )}

                {/* Custom registration fields (only for sign up) */}
                {isSignUp && (
                  <div className="space-y-4 pt-1 animate-fade-in fade-in">
                    {/* Full Name */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="auth-fullname">
                        {authType === 'student' ? t('STUDENT FULL NAME', 'மாணவரின் முழு பெயர்') : t('ADMIN FULL NAME', 'நிர்வாகியின் முழு பெயர்')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                        </span>
                        <input
                          type="text"
                          id="auth-fullname"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g., Madhan Kumar"
                          className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* College Name */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="auth-college">
                        {t('COLLEGE NAME', 'கல்லூரி பெயர்')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Building className="w-4 h-4 text-slate-400 shrink-0" />
                        </span>
                        <input
                          type="text"
                          id="auth-college"
                          required
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          placeholder={t("e.g., CEG Guindy or IIT Madras", "எ.கா. CEG கிண்டி அல்லது IIT சென்னை")}
                          className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="auth-dept">
                        {t('DEPARTMENT / BRANCH', 'துறை / பிரிவு')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        </span>
                        <input
                          type="text"
                          id="auth-dept"
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g., Information Technology"
                          className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Register Number */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="auth-register">
                        {t('UNIVERSITY REGISTER NUMBER', 'பல்கலைக்கழக பதிவு எண்')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                        </span>
                        <input
                          type="text"
                          id="auth-register"
                          required
                          value={registerNumber}
                          onChange={(e) => setRegisterNumber(e.target.value)}
                          placeholder="e.g., 211421104001"
                          className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="fade-in animate-fade-in">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="auth-confirm-password">
                        {t('CONFIRM PASSWORD', 'கடவுச்சொலை உறுதிப்படுத்தவும்')}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          id="auth-confirm-password"
                          required={isSignUp}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-md shadow-blue-100 hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-4"
                  id="auth-submit-button"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
                  ) : (
                    <span>
                      {isSignUp 
                        ? t('Create Account', 'புதிய கணக்கை உருவாக்கு') 
                        : t('Sign In', 'உள்நுழையவும்')
                      }
                    </span>
                  )}
                </button>
              </form>

              {/* Form Switcher Button */}
              {authType === 'student' && (
                <div className="text-center mt-6 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer inline-flex items-center gap-1 focus:outline-none"
                    type="button"
                  >
                    {isSignUp 
                      ? t('Already have an account? Sign In', 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக') 
                      : t('New to CrackIt? Create an account', 'இன்னும் பதிவு செய்யவில்லையா? புதிய கணக்கு தொடங்கு')
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-4 text-center text-[10px] text-slate-400 border-t border-slate-100 bg-white/70 backdrop-blur-md z-10">
        <div>
          &copy; {new Date().getFullYear()} CrackIt AU. &bull; {t('All Rights Reserved.', 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.')}
        </div>
      </footer>

      {/* Floating Notifications (Toast) */}
      {displayNotification && (
        <div 
          className="fixed bottom-5 right-5 z-100 max-w-sm bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in-up" 
          id="auth-toast-notification"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold">{displayNotification}</span>
        </div>
      )}
    </div>
  );
}
