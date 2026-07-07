import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, Sparkles, Check, AlertCircle, Building, Scissors } from 'lucide-react';
import { UserProfile } from '../types';
import { safeLocalStorage } from '../utils/safeStorage';
import { getCloudUserProfile, saveCloudUserProfile, auth } from '../firebase';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, isNewSignup?: boolean) => void;
  initialRole?: 'customer' | 'business';
}

// Quick select demo users for easy evaluation
const DEMO_CUSTOMERS = [
  {
    name: 'Edrin',
    email: 'edrinshtjefni@gmail.com',
    phone: '+47 912 34 567',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    favorites: ['1', '3'],
    role: 'customer' as const
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    phone: '+1 (555) 019-2834',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    favorites: ['1', '3'],
    role: 'customer' as const
  },
  {
    name: 'Seraphina Rose',
    email: 'seraphina.rose@beauty.com',
    phone: '+1 (555) 432-8765',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    favorites: ['2', '6'],
    role: 'customer' as const
  }
];

const DEMO_BUSINESSES = [
  {
    name: 'Edrin Partner',
    email: 'edrinshtjefni@gmail.com',
    phone: '+47 912 34 567',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    favorites: [],
    role: 'business' as const,
    salonIds: ['1', '3'] // Manage both Aura Hair Studio and Soma Wellness Spa
  },
  {
    name: 'Lars Barber',
    email: 'lars@barber.no',
    phone: '+47 912 34 567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    favorites: [],
    role: 'business' as const,
    salonIds: ['1'] // Aura Hair Studio
  },
  {
    name: 'Sonia Spa',
    email: 'sonia@spa.no',
    phone: '+47 481 92 834',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    favorites: [],
    role: 'business' as const,
    salonIds: ['3'] // Soma Wellness & Massage
  }
];

const SIGNUP_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80'
];

export default function AuthModal({ onClose, onLoginSuccess, initialRole = 'customer' }: AuthModalProps) {
  const { t } = useLanguage();
  const [role, setRole] = useState<'customer' | 'business' | 'admin'>(initialRole as any);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(SIGNUP_AVATAR_PRESETS[0]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    const emailToMatch = loginEmail.trim().toLowerCase();

    try {
      // 1. Fetch from Firestore
      let foundUser = await getCloudUserProfile(emailToMatch);

      if (foundUser) {
        const userRole = foundUser.role || 'customer';
        if (userRole !== role) {
          setRole(userRole);
        }

        setSuccess(`Welcome back, ${foundUser.name}!`);
        setTimeout(() => {
          onLoginSuccess({
            name: foundUser.name,
            email: foundUser.email,
            phone: foundUser.phone,
            avatar: foundUser.avatar,
            favorites: foundUser.favorites || [],
            role: userRole,
            salonIds: foundUser.salonIds || []
          });
          onClose();
        }, 800);
      } else {
        // Check if matching any of the demo profiles first
        const allDemos = [...DEMO_CUSTOMERS, ...DEMO_BUSINESSES];
        const matchedDemo = allDemos.find(demo => demo.email.toLowerCase() === emailToMatch);

        let autoCreatedUser: UserProfile;
        if (matchedDemo) {
          autoCreatedUser = {
            name: matchedDemo.name,
            email: matchedDemo.email,
            phone: matchedDemo.phone,
            avatar: matchedDemo.avatar,
            favorites: matchedDemo.favorites || [],
            role: matchedDemo.role || role,
            salonIds: 'salonIds' in matchedDemo ? (matchedDemo as any).salonIds : (role === 'business' ? ['1', '3'] : [])
          };
        } else {
          // Automatic user creation for first-time login - fully robust & frictionless!
          const emailLocalPart = emailToMatch.split('@')[0];
          const displayName = emailLocalPart
            .split(/[\._-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          autoCreatedUser = {
            name: displayName,
            email: emailToMatch,
            phone: '+47 912 34 567',
            avatar: SIGNUP_AVATAR_PRESETS[Math.floor(Math.random() * SIGNUP_AVATAR_PRESETS.length)],
            favorites: [],
            role: emailToMatch === 'admin@strakstime.no' ? 'admin' : role,
            salonIds: role === 'business' ? ['1', '3'] : []
          };
        }

        // Save to Cloud database
        await saveCloudUserProfile(autoCreatedUser);

        setSuccess(`Account created automatically! Welcome, ${autoCreatedUser.name}!`);
        setTimeout(() => {
          onLoginSuccess({
            name: autoCreatedUser.name,
            email: autoCreatedUser.email,
            phone: autoCreatedUser.phone,
            avatar: autoCreatedUser.avatar,
            favorites: autoCreatedUser.favorites,
            role: autoCreatedUser.role,
            salonIds: autoCreatedUser.salonIds || []
          }, true);
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError('An error occurred during sign in. Please try again.');
      console.error(err);
    }
  };

  // Handle Signup submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPhone.trim() || !signupPassword.trim()) {
      setError('Please fill in all details.');
      return;
    }

    const emailToSignup = signupEmail.trim().toLowerCase();

    try {
      // Check duplicate email in Cloud
      const existingCloudUser = await getCloudUserProfile(emailToSignup);
      if (existingCloudUser) {
        setError('An account with this email already exists.');
        return;
      }

      const newUser: UserProfile = {
        name: signupName.trim(),
        email: emailToSignup,
        phone: signupPhone.trim(),
        avatar: selectedAvatar,
        favorites: [],
        role: emailToSignup === 'admin@strakstime.no' ? 'admin' : role,
        salonIds: role === 'business' ? ['1', '3'] : []
      };

      // Save user to Cloud database
      await saveCloudUserProfile(newUser);
      


      setSuccess(role === 'business' 
        ? 'Partner account created! Let\'s setup your salon listing next.'
        : 'Registration successful! Welcome to StraksTime.no'
      );

      setTimeout(() => {
        onLoginSuccess({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          avatar: newUser.avatar,
          favorites: [],
          role: role,
          salonIds: newUser.salonIds || []
        }, true);
        onClose();
      }, 1500);
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      console.error(err);
    }
  };

  // Direct login as Quick Profile
  const handleQuickLogin = async (demo: typeof DEMO_CUSTOMERS[0] | typeof DEMO_BUSINESSES[0]) => {
    setError('');
    const emailToMatch = demo.email.toLowerCase();

    try {
      // Check if the demo profile is in the Cloud already
      let cloudUser = await getCloudUserProfile(emailToMatch);
      let isNew = false;
      if (!cloudUser) {
        cloudUser = {
          name: demo.name,
          email: demo.email,
          phone: demo.phone,
          avatar: demo.avatar,
          favorites: demo.favorites,
          role: demo.role,
          salonIds: 'salonIds' in demo ? (demo as any).salonIds : []
        };
        await saveCloudUserProfile(cloudUser);
        isNew = true;
      }

      setSuccess(`Logged in as ${demo.name}!`);
      setTimeout(() => {
        onLoginSuccess({
          name: cloudUser!.name,
          email: cloudUser!.email,
          phone: cloudUser!.phone,
          avatar: cloudUser!.avatar,
          favorites: cloudUser!.favorites || [],
          role: cloudUser!.role,
          salonIds: cloudUser!.salonIds || []
        }, isNew);
        onClose();
      }, 600);
    } catch (err) {
      setError('Failed to login with quick profile.');
      console.error(err);
    }
  };

  const handleOAuthSuccess = async (user: any) => {
    if (!user.email) {
      setError('Could not get email from provider.');
      return;
    }
    const emailToMatch = user.email.toLowerCase();
    try {
      let foundUser = await getCloudUserProfile(emailToMatch);
      let isNew = false;
      
      if (!foundUser) {
        foundUser = {
          name: user.displayName || 'New User',
          email: emailToMatch,
          phone: user.phoneNumber || '',
          avatar: user.photoURL || SIGNUP_AVATAR_PRESETS[0],
          favorites: [],
          role: role,
          salonIds: role === 'business' ? ['1', '3'] : []
        };
        await saveCloudUserProfile(foundUser);
        isNew = true;
      } else {
        if (foundUser.role !== role) {
          setRole(foundUser.role || 'customer');
        }
      }

      setSuccess(`Welcome, ${foundUser.name}!`);
      setTimeout(() => {
        onLoginSuccess({
          name: foundUser!.name,
          email: foundUser!.email,
          phone: foundUser!.phone,
          avatar: foundUser!.avatar,
          favorites: foundUser!.favorites || [],
          role: foundUser!.role || role,
          salonIds: foundUser!.salonIds || []
        }, isNew);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
      setError('An error occurred during authentication.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleOAuthSuccess(result.user);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        console.error(err);
        setError('Google sign-in is not enabled in Firebase Console.');
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // user closed popup, don't show error or log it to prevent false positive error overlays
      } else {
        console.error(err);
        setError(err.message || 'Google sign in failed.');
      }
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleOAuthSuccess(result.user);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        console.error(err);
        setError('Facebook sign-in is not enabled in Firebase Console.');
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // user closed popup, don't show error or log it to prevent false positive error overlays
      } else {
        console.error(err);
        setError(err.message || 'Facebook sign in failed.');
      }
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 bg-brand-text/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        id="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-brand-border/60 relative"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-brand-muted hover:text-brand-text hover:bg-white/60 transition-all cursor-pointer z-[60]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Dual Role Selector / Header */}
        <div className="bg-instagram-gradient pt-14 pb-6 px-6 text-brand-text text-left relative overflow-hidden border-b border-brand-border/60">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.07] text-brand-text">
            {role === 'customer' ? (
              <Sparkles className="w-32 h-32 animate-spin-slow" />
            ) : (
              <Building className="w-32 h-32" />
            )}
          </div>
          
          {/* Header Toggle */}
          <div className="flex w-full gap-2 bg-white/40 p-1.5 rounded-2xl relative z-10 backdrop-blur-sm shadow-inner border border-white/60">
            <button
              id="role-toggle-customer"
              type="button"
              onClick={() => {
                setRole('customer');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                role === 'customer' 
                  ? 'bg-white text-brand-text shadow-sm border border-brand-border/40' 
                  : 'text-brand-muted hover:text-brand-text hover:bg-white/60'
              }`}
            >
              {t('auth.customer_hub')}
            </button>
            <button
              id="role-toggle-business"
              type="button"
              onClick={() => {
                setRole('business');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                role === 'business' 
                  ? 'bg-white text-brand-text shadow-sm border border-brand-border/40' 
                  : 'text-brand-muted hover:text-brand-text hover:bg-white/60'
              }`}
            >
              {t('auth.business_partner')}
            </button>
          </div>
        </div>

        {/* Auth Tabs (Sign In / Create Account) */}
        <div className="flex border-b border-brand-border bg-brand-bg px-4 pt-4">
          <button
            id="tab-auth-login"
            onClick={() => {
              setActiveTab('login');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 pb-3 text-[13px] font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            {t('auth.sign_in')}
          </button>
          <button
            id="tab-auth-signup"
            onClick={() => {
              setActiveTab('signup');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 pb-3 text-[13px] font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            {t('auth.create_account')}
          </button>
        </div>

        <div className="p-6">
          {/* Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="auth-error"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl mb-4 text-xs font-bold flex items-start gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                key="auth-success"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-green-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl mb-4 text-xs font-bold flex items-start gap-2 text-left"
              >
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">
{role === 'customer' ? t('auth.email_customer') : t('auth.email_business')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-brand-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="input-login-email"
                    type="email"
                    placeholder=""
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full border border-brand-border pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-brand-text bg-white outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">{t('auth.password')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-brand-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="input-login-password"
                    type="password"
                    placeholder=""
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full border border-brand-border pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-brand-text bg-white outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                id="btn-auth-signin"
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-black rounded-xl hover:shadow-md transition-all uppercase tracking-wider mt-2 cursor-pointer"
              >
{role === 'customer' ? t('auth.sign_in_book') : t('auth.sign_in_partner')}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-brand-border"></div>
                <span className="flex-shrink-0 mx-4 text-brand-muted text-xs font-bold uppercase">Or continue with</span>
                <div className="flex-grow border-t border-brand-border"></div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-border rounded-xl hover:bg-brand-surface transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-xs font-bold text-brand-text">Google</span>
                </button>
 
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-border rounded-xl hover:bg-brand-surface transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs font-bold text-brand-text">Facebook</span>
                </button>

              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">
  {role === 'customer' ? t('auth.name_customer') : t('auth.name_business')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-brand-muted">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="input-signup-name"
                      type="text"
                      placeholder=""
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full border border-brand-border pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-brand-text bg-white outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">{t('auth.phone')}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-brand-muted">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      id="input-signup-phone"
                      type="text"
                      placeholder=""
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="w-full border border-brand-border pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-brand-text bg-white outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">
{role === 'customer' ? 'Email Address' : 'Business Email Address'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-brand-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="input-signup-email"
                    type="email"
                    placeholder=""
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full border border-brand-border pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-brand-text bg-white outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-brand-text uppercase tracking-wider block">{t('auth.password')}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-brand-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="input-signup-password"
                    type="password"
                    placeholder=""
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full border border-brand-border pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-brand-text bg-white outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                id="btn-auth-signup-submit"
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-black rounded-xl hover:shadow-md transition-all uppercase tracking-wider mt-2 cursor-pointer"
              >
{role === 'customer' ? t('auth.register') : t('auth.register_partner')}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-brand-border"></div>
                <span className="flex-shrink-0 mx-4 text-brand-muted text-xs font-bold uppercase">Or continue with</span>
                <div className="flex-grow border-t border-brand-border"></div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-border rounded-xl hover:bg-brand-surface transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-xs font-bold text-brand-text">Google</span>
                </button>
 
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-border rounded-xl hover:bg-brand-surface transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs font-bold text-brand-text">Facebook</span>
                </button>

              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
