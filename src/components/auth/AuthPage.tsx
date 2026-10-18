import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Globe,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  LogIn,
  Lock,
  Sparkles,
  CheckCircle2,
  Camera,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Search,
  Mail,
  Briefcase,
  Building2,
  Clock,
  ExternalLink,
  ChevronDown,
  Check,
  Copy,
  X,
} from 'lucide-react';
import { SUPPORTED_COUNTRIES, generateChatTimeNumber } from '../../data/countries';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../../utils/languages';
import { useChatTime } from '../../context/ChatTimeContext';
import { BrandLogo } from '../common/BrandLogo';
import { User, CountryInfo } from '../../types';

export const BUSINESS_CATEGORIES = [
  'Retail & Shopping',
  'Technology & Software',
  'Finance & Banking',
  'Education & Learning',
  'Healthcare & Medical',
  'Restaurant & Food',
  'Professional Services',
  'Arts & Entertainment',
  'Automotive & Transport',
  'Real Estate & Housing',
  'Personal / Individual',
];

export const AuthPage: React.FC = () => {
  const {
    registerNewAccount,
    loginAccount,
    sendPhoneOtp,
    verifyPhoneOtp,
    addToast,
    language,
    setLanguage,
    translateAppToLanguage,
    isTranslatingApp,
    t,
  } = useChatTime();

  // Screen modes: 'welcome' (WhatsApp Business landing) -> 'signup' -> 'login'
  const [screen, setScreen] = useState<'welcome' | 'signup' | 'login'>('welcome');

  // WhatsApp Signup Flow:
  // Step 1: Phone & Email Input
  // Step 2: Verification Code (Sent directly to email)
  // Step 3: WhatsApp Business Profile Setup (Name, Avatar, Category, Bio, PIN)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Country, Phone, Email
  // Requirement: "On the creative account the country don't autofill let it be select country if they tap it list all countries from a to z"
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Step 2 State: OTP Verification (No autofill - sent directly to email)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Step 3 State: WhatsApp Business Profile Setup
  const [isBusiness, setIsBusiness] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [businessCategory, setBusinessCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [bio, setBio] = useState('Welcome to our official ChatTime Business line.');
  const [businessHours, setBusinessHours] = useState('Mon - Fri: 9:00 AM - 6:00 PM');
  const [pin, setPin] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Error & Loading
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Language Selection Modal State
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');

  // Privacy Policy & Terms of Service Modal State
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'terms'>('privacy');

  // Current language object
  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
    SUPPORTED_LANGUAGES.find((l) => l.code === 'en') ||
    SUPPORTED_LANGUAGES[0];

  // Filter languages
  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(languageSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(languageSearch.toLowerCase()) ||
      l.region.toLowerCase().includes(languageSearch.toLowerCase())
  );

  // Filter countries alphabetically (A to Z) with letter jump
  const filteredCountries = SUPPORTED_COUNTRIES.filter((c) => {
    const q = countrySearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.code.includes(q) ||
      c.iso.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedLetter !== 'ALL' && !q) {
      return c.name.toUpperCase().startsWith(selectedLetter);
    }
    return true;
  });

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (signupStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signupStep, otpTimer]);

  const handleRegenerateNumber = () => {
    if (!selectedCountry) {
      setErrorMsg('Please select your country first.');
      setIsCountryPickerOpen(true);
      return;
    }
    setPhoneNumber(generateChatTimeNumber(selectedCountry.code));
    setErrorMsg('');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Submit Phone & Email -> Send Code
  const handleSendCodeToEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCountry) {
      setErrorMsg('Please select your country before continuing.');
      setIsCountryPickerOpen(true);
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address to receive your 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPhoneOtp(phoneNumber.trim(), false, email.trim());
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Could not send verification code.');
        return;
      }

      setOtpTimer(60);
      setCanResend(false);
      setSignupStep(2);
      setOtpCode(['', '', '', '', '', '']);
      addToast('Code Dispatched', `Verification code sent directly to ${email}.`, 'success');

      // Pre-fill username from email prefix if empty
      if (!username) {
        const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(prefix || 'business_user');
      }
      if (!name) {
        const readable = email.split('@')[0].replace(/[._-]/g, ' ');
        setName(readable.charAt(0).toUpperCase() + readable.slice(1));
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Network error sending verification code.');
    }
  };

  // Handle individual digit input in OTP box
  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newOtp = [...otpCode];

    if (!clean) {
      newOtp[index] = '';
      setOtpCode(newOtp);
      return;
    }

    // If user pasted a full 6-digit string
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        newOtp[idx] = c;
      });
      setOtpCode(newOtp);
      const nextIdx = Math.min(chars.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    newOtp[index] = clean;
    setOtpCode(newOtp);

    // Auto advance to next box
    if (index < 5 && clean) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const fullCode = otpCode.join('');

    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyPhoneOtp(phoneNumber.trim(), fullCode);
      setIsVerifyingOtp(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Invalid or expired 6-digit verification code.');
        return;
      }

      setSignupStep(3);
    } catch {
      setIsVerifyingOtp(false);
      setErrorMsg('Verification failed. Please check the code and try again.');
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await sendPhoneOtp(phoneNumber.trim(), false, email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setOtpTimer(60);
      setCanResend(false);
      addToast('New Code Sent', `A fresh 6-digit code was sent directly to ${email}`, 'success');
    } else {
      setErrorMsg(res.error || 'Failed to resend code');
    }
  };

  // Step 3: Complete WhatsApp Business Profile Setup
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please provide your Business or Full Name.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters (letters, numbers, underscores).');
      return;
    }

    setIsSubmitting(true);
    setIsInitializing(true);

    try {
      const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        cleanUsername
      )}&backgroundColor=0d9488`;

      const result = await registerNewAccount({
        name: name.trim(),
        username: cleanUsername,
        countryCode: selectedCountry?.code || '+1',
        countryName: selectedCountry?.name || 'International',
        phoneNumber: phoneNumber.trim(),
        chatTimeNumber: phoneNumber.trim(),
        email: email.trim(),
        isBusiness,
        businessCategory: isBusiness ? businessCategory : undefined,
        businessHours: isBusiness ? businessHours : undefined,
        avatar: avatarUrl || fallbackAvatar,
        bio: bio.trim(),
        pin: pin.trim() || undefined,
        role: 'user',
      });

      if (result.error) {
        setIsSubmitting(false);
        setIsInitializing(false);
        setErrorMsg(result.error);
        return;
      }

      // Successful registration will automatically set authenticated state in context
    } catch {
      setIsSubmitting(false);
      setIsInitializing(false);
      setErrorMsg('Failed to complete registration. Please try again.');
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your phone number, username, or email.');
      return;
    }

    setIsSubmitting(true);
    const res = await loginAccount(loginIdentifier.trim(), loginPin.trim() || undefined);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  // Render Shared Language Selector, Country Selector & Privacy Modals
  const renderSharedModals = () => (
    <>
      {/* Dedicated Full A to Z Country Selector Modal */}
      {isCountryPickerOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full h-[90vh] sm:h-[85vh] max-h-[700px] flex flex-col overflow-hidden shadow-2xl">
            {/* Top Drag Indicator for iOS Sheet */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Top Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCountryPickerOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700/80 active:scale-95 transition-all cursor-pointer shadow-sm min-h-[38px]"
                >
                  <ArrowLeft className="w-4 h-4 text-teal-400" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    {t('chooseCountry', 'Choose a Country')}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCountryPickerOpen(false)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/60 shrink-0 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    if (e.target.value) setSelectedLetter('ALL');
                  }}
                  placeholder="Search by country, calling code (+...), or ISO..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                  autoFocus
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* A to Z Alphabet Fast-Jump Row */}
              <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-1 no-scrollbar text-[11px] font-mono">
                {['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')].map((letter) => {
                  const isSelected = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => {
                        setSelectedLetter(letter);
                        setCountrySearch('');
                      }}
                      className={`px-2 py-1 rounded-lg shrink-0 font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Country List from A to Z */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-800/40">
              {filteredCountries.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No countries found matching "{countrySearch}"
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = selectedCountry?.iso === c.iso;
                  return (
                    <button
                      key={`${c.iso}-${c.code}`}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryPickerOpen(false);
                        setCountrySearch('');
                        setSelectedLetter('ALL');
                        setErrorMsg('');
                        addToast('Country Selected', `${c.flag} ${c.name} (${c.code}) selected.`, 'info');
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                          : 'hover:bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{c.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ISO: {c.iso}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-teal-400">
                          {c.code}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-400 shrink-0 ml-1" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Language Selector Modal with Dynamic Translation for Any Language */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full h-[88vh] sm:h-[85vh] max-h-[660px] flex flex-col overflow-hidden shadow-2xl">
            {/* Top Drag Indicator for iOS Sheet */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>

            {/* Top Header with Back button */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLanguageModalOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700/80 active:scale-95 transition-all cursor-pointer shadow-sm min-h-[38px]"
                >
                  <ArrowLeft className="w-4 h-4 text-teal-400" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    Select Language
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLanguageModalOpen(false)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  placeholder="Type any language (e.g. Vietnamese, Swahili, Yoruba...)"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
                  autoFocus
                />
                {languageSearch && (
                  <button
                    type="button"
                    onClick={() => setLanguageSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Dynamic Instant Translate Option for Any Language Entered */}
              {languageSearch.trim() && (
                <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border border-teal-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5 truncate">
                      <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Translate into "{languageSearch.trim()}"</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      Dynamically translate the entire ChatTime interface
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isTranslatingApp}
                    onClick={async () => {
                      const success = await translateAppToLanguage(languageSearch.trim());
                      if (success) {
                        setIsLanguageModalOpen(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    {isTranslatingApp ? 'Translating...' : 'Translate App'}
                  </button>
                </div>
              )}
            </div>

            {/* Language List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-800/40">
              {filteredLanguages.length === 0 ? (
                <div className="py-10 text-center space-y-3 px-4">
                  <p className="text-xs text-slate-400">
                    No predefined language matches "{languageSearch}".
                  </p>
                  <button
                    type="button"
                    disabled={isTranslatingApp}
                    onClick={async () => {
                      const success = await translateAppToLanguage(languageSearch.trim());
                      if (success) setIsLanguageModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isTranslatingApp ? 'Translating App...' : `Translate App to "${languageSearch}"`}</span>
                  </button>
                </div>
              ) : (
                filteredLanguages.map((l) => {
                  const isSelected = language === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setIsLanguageModalOpen(false);
                        addToast('Language Updated', `Switched app language to ${l.nativeName}.`, 'success');
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                          : 'hover:bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{l.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                            <span>{l.nativeName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({l.name})</span>
                          </div>
                          <div className="text-[10px] text-teal-400/80 font-mono mt-0.5">
                            {l.region} &bull; {l.code}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy & Terms of Service Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full h-[90vh] max-h-[720px] flex flex-col overflow-hidden shadow-2xl">
            {/* Header with Back button */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700/80 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-teal-400" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    Chat Time Legal & Security
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs: Privacy Policy vs Terms of Service */}
            <div className="flex items-center p-2 bg-slate-950 border-b border-slate-800 shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setPrivacyModalTab('privacy')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  privacyModalTab === 'privacy'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setPrivacyModalTab('terms')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  privacyModalTab === 'terms'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Terms of Service
              </button>
            </div>

            {/* Policy Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {privacyModalTab === 'privacy' ? (
                <>
                  <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm">End-to-End Encryption Guarantee</h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Your personal messages, voice calls, video calls, photos, voice notes, and media are protected by end-to-end encryption. Only you and the person you are communicating with can read or listen to them — not even Chat Time.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">1. Information We Collect</h4>
                    <p>
                      <strong>Account Information:</strong> You provide your phone number and email address to create an account and receive verification codes. You may optionally provide a display name, profile avatar, username, and business profile details.
                    </p>
                    <p>
                      <strong>Messages & Media:</strong> Messages and media files are encrypted in transit and at rest. View-once media is permanently deleted from servers as soon as it is viewed by the recipient.
                    </p>
                    <p>
                      <strong>Calling & Real-Time Data:</strong> Audio and video calls use WebRTC peer-to-peer protocols with DTLS/SRTP encryption. Call metadata is discarded once the call terminates.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">2. How We Protect Your Privacy</h4>
                    <p>
                      We do not sell, rent, or monetize your personal information or contact data to third parties or advertising networks. We use your phone number and email solely to authenticate and secure your account line.
                    </p>
                    <p>
                      You can toggle phone number masking and privacy mode at any time in your profile and privacy settings.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">3. Security PIN & Passcode Protection</h4>
                    <p>
                      Two-step verification PINs and local device passcode locks are stored using cryptographic hash functions. You maintain full ownership and control over your authentication credentials.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Terms of Service Overview</h4>
                      <p className="text-xs text-slate-300 mt-1">
                        By accessing or using Chat Time, you agree to comply with our Terms of Service designed to keep communication safe, private, and respectful worldwide.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">1. Acceptable Use of Chat Time</h4>
                    <p>
                      You agree to use Chat Time only for lawful personal or business communications. You must not send spam, phishing links, harmful malware, or engage in abusive harassment or impersonation.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">2. Account Responsibility</h4>
                    <p>
                      You are responsible for keeping your device and authentication credentials secure. Do not share your 6-digit verification code or security PIN with anyone.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">3. Business Profiles & Messaging</h4>
                    <p>
                      Business users agree to accurately represent their business details, categories, and working hours, and respect customer privacy and communication preferences at all times.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">4. Service Reliability</h4>
                    <p>
                      Chat Time continuously improves its encrypted messaging and calling infrastructure to provide modern HD reliability, privacy controls, and security protections for users across all platforms.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Chat Time Secure Communication &bull; Version 2.4
              </span>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                I Understand & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // =========================================================================
  // VIEW 1: WHATSAPP BUSINESS WELCOME SCREEN
  // "welcome to chat time before creat then agree and continue"
  // =========================================================================
  if (screen === 'welcome') {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between bg-slate-950 text-slate-100 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] px-4 sm:px-8 select-none relative overflow-y-auto">
        {renderSharedModals()}
        {/* Subtle Ambient Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Language Picker */}
        <header className="w-full max-w-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={true} />
          </div>
          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-xs text-slate-100 font-semibold cursor-pointer transition-all shadow-md active:scale-95 min-h-[40px]"
            title="Change Language"
          >
            <Globe className="w-4 h-4 text-teal-400" />
            <span>{currentLangObj.flag} {currentLangObj.nativeName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </header>

        {/* Center Hero: Red Themed ChatTime Welcome */}
        <main className="w-full max-w-md flex flex-col items-center text-center space-y-6 z-10 my-auto">
          {/* Red Chat Tile Emblem with Glowing Ring - No 'B' Badge */}
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-red-500/20 via-rose-500/30 to-red-600/20 border-2 border-red-500/40 p-2 shadow-2xl shadow-red-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-red-900/80 via-slate-900 to-slate-950 flex flex-col items-center justify-center shadow-inner relative group border border-red-500/30">
                <BrandLogo size="lg" showText={false} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              {t('welcomeTitle', 'Welcome to Chat Time')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              {t('welcomeSubtitle', 'Simple, reliable, and private messaging and HD calls for your business and personal conversations worldwide.')}
            </p>
          </div>

          {/* Business Features Highlights */}
          <div className="w-full grid grid-cols-3 gap-2 pt-2">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
              <ShieldCheck className="w-4 h-4 text-teal-400 mx-auto" />
              <div className="text-[11px] font-bold text-slate-200">{t('encrypted', 'Encrypted')}</div>
              <div className="text-[9px] text-slate-500">{t('endToEndPrivate', 'End-to-End Private')}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
              <Building2 className="w-4 h-4 text-teal-400 mx-auto" />
              <div className="text-[11px] font-bold text-slate-200">{t('business', 'Business')}</div>
              <div className="text-[9px] text-slate-500">{t('officialProfile', 'Official Profile')}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
              <Phone className="w-4 h-4 text-teal-400 mx-auto" />
              <div className="text-[11px] font-bold text-slate-200">{t('hdCalling', 'HD Calling')}</div>
              <div className="text-[9px] text-slate-500">{t('crystalClearAudio', 'Crystal Clear Audio')}</div>
            </div>
          </div>
        </main>

        {/* Bottom Actions: Terms & Agree and Continue */}
        <footer className="w-full max-w-md space-y-4 z-10 pt-4">
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            {t('readOur', 'Read our')}{' '}
            <button
              type="button"
              onClick={() => {
                setPrivacyModalTab('privacy');
                setIsPrivacyModalOpen(true);
              }}
              className="text-teal-400 cursor-pointer hover:underline font-semibold"
            >
              {t('privacyPolicy', 'Privacy Policy')}
            </button>
            {t('tapAgreeToAccept', '. Tap "Agree and continue" to accept the')}{' '}
            <button
              type="button"
              onClick={() => {
                setPrivacyModalTab('terms');
                setIsPrivacyModalOpen(true);
              }}
              className="text-teal-400 cursor-pointer hover:underline font-semibold"
            >
              {t('termsOfService', 'Terms of Service')}
            </button>
            .
          </p>

          <button
            type="button"
            onClick={() => {
              setScreen('signup');
              setSignupStep(1);
            }}
            className="w-full py-4 px-6 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-teal-500/25 active:scale-95 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{t('agreeAndContinue', 'AGREE AND CONTINUE')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-2 text-xs pt-1">
            <span className="text-slate-400">{t('alreadyRegistered', 'Already registered?')}</span>
            <button
              type="button"
              onClick={() => setScreen('login')}
              className="text-teal-400 font-bold hover:underline"
            >
              {t('logInToYourAccount', 'Sign In with number or email')}
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-[10px] text-slate-600 font-semibold tracking-widest uppercase">
              {t('encryptionNote', 'End-to-End Encrypted Messenger')}
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN SCREEN
  // =========================================================================
  if (screen === 'login') {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-start sm:justify-center bg-slate-950 text-slate-100 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] px-4 sm:px-6 select-none relative overflow-y-auto">
        {renderSharedModals()}

        {/* Top Navigation Bar: Back & Clear Language Selector for iPhone 14/13/X/XR */}
        <div className="w-full max-w-md flex items-center justify-between mb-3 z-10 shrink-0">
          <button
            type="button"
            onClick={() => setScreen('welcome')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer min-h-[40px]"
            title={t('back', 'Back to Welcome')}
          >
            <ArrowLeft className="w-4 h-4 text-teal-400" />
            <span>{t('back', 'Back')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-slate-100 text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer min-h-[40px]"
            title={t('selectLanguage', 'Change Language')}
          >
            <Globe className="w-4 h-4 text-teal-400" />
            <span>{currentLangObj.flag} {currentLangObj.nativeName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        </div>

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-xl z-10">
          {/* Header */}
          <div className="text-center pb-3 border-b border-slate-800 space-y-1">
            <h2 className="text-lg font-bold text-white font-display">{t('signInTitle', 'Sign In to ChatTime')}</h2>
            <p className="text-xs text-slate-400">{t('accountType', 'Personal or Business Account')}</p>
          </div>

          {/* Dedicated In-Card Language Selection Row */}
          <div
            onClick={() => setIsLanguageModalOpen(true)}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-teal-500/40 text-xs transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {t('selectLanguage', 'App Language')}
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                  <span>{currentLangObj.flag}</span>
                  <span>{currentLangObj.nativeName}</span>
                  <span className="text-slate-500 font-normal">({currentLangObj.name})</span>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-teal-500/15 group-hover:bg-teal-500/25 text-teal-300 text-[11px] font-bold border border-teal-500/30 shrink-0">
              {t('edit', 'Change')}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('loginIdentifier', 'Phone Number, Username, or Email')}
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={t('loginIdentifierPlaceholder', 'e.g. +1 415-892-3011, @username, or email')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                  {t('securityPin', 'Security PIN / Passcode')}
                </span>
                <span className="text-[10px] text-slate-500">{t('leaveBlankIfNoPin', 'Leave blank if no PIN')}</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4-digit PIN"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? t('signingIn', 'Signing In...') : t('continueToChatTime', 'Continue to ChatTime')}</span>
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/80 space-y-2">
            <div>
              {t('noAccount', "Don't have an account?")}{' '}
              <button
                type="button"
                onClick={() => {
                  setScreen('signup');
                  setSignupStep(1);
                }}
                className="text-teal-400 font-bold hover:underline cursor-pointer"
              >
                {t('createAccount', 'Create Account')}
              </button>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrivacyModalTab('privacy');
                  setIsPrivacyModalOpen(true);
                }}
                className="hover:text-slate-300 underline cursor-pointer"
              >
                {t('privacyPolicy', 'Privacy Policy')}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setPrivacyModalTab('terms');
                  setIsPrivacyModalOpen(true);
                }}
                className="hover:text-slate-300 underline cursor-pointer"
              >
                {t('termsOfService', 'Terms of Service')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MULTI-STEP WHATSAPP BUSINESS SIGNUP FLOW
  // =========================================================================
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-start sm:justify-center bg-slate-950 text-slate-100 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] px-4 sm:px-6 select-none relative overflow-y-auto">
      {renderSharedModals()}
      {/* Background Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl z-10 my-4">
        {/* Top Step Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (signupStep === 1) setScreen('welcome');
              else setSignupStep((prev) => (prev - 1) as any);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center flex-1">
            <h2 className="text-sm font-bold text-white font-display uppercase tracking-wider">
              {signupStep === 1 && t('verifyNumber', 'Verify Phone & Email')}
              {signupStep === 2 && t('verifyCode', 'Enter Verification Code')}
              {signupStep === 3 && t('profileInfo', 'WhatsApp Business Profile')}
            </h2>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  signupStep >= 1 ? 'bg-teal-400' : 'bg-slate-700'
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full ${
                  signupStep >= 2 ? 'bg-teal-400' : 'bg-slate-700'
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full ${
                  signupStep >= 3 ? 'bg-teal-400' : 'bg-slate-700'
                }`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700/80 cursor-pointer transition-colors shrink-0"
            title={t('selectLanguage', 'Change Language')}
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px] font-bold">{currentLangObj.flag}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium animate-in fade-in duration-150">
            {errorMsg}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: PHONE NUMBER & EMAIL INPUT */}
        {/* ------------------------------------------------------------- */}
        {signupStep === 1 && (
          <form onSubmit={handleSendCodeToEmail} className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {t('enterPhoneNumber', 'Enter your phone number & email')}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {t('verifyPhoneSubtitle', 'A secure 6-digit verification code will be sent to your email to verify your phone number.')}
              </p>
            </div>

            {/* Country / Region Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">
                {t('countryRegion', 'Country / Region')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCountryPickerOpen(true);
                  setCountrySearch('');
                  setSelectedLetter('ALL');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-950 hover:border-teal-500/50 hover:bg-slate-900/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {selectedCountry ? (
                    <span className="text-2xl shrink-0 leading-none">{selectedCountry.flag}</span>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-white truncate">
                      {selectedCountry ? selectedCountry.name : t('chooseCountry', 'Choose a country')}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {selectedCountry
                        ? `${selectedCountry.code} · ${selectedCountry.iso}`
                        : t('selectCountryPrompt', 'Select your country to set calling code')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedCountry && (
                    <span className="font-mono text-teal-400 font-bold text-xs px-2.5 py-1 rounded-xl bg-teal-500/10 border border-teal-500/20">
                      {selectedCountry.code}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                </div>
              </button>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-400">
                  {t('phoneNumber', 'Phone Number')}
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateNumber}
                  className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> {t('generateNumber', 'Generate Number')}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCountryPickerOpen(true);
                    setCountrySearch('');
                    setSelectedLetter('ALL');
                  }}
                  className="px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 font-mono text-sm text-teal-400 font-bold select-none shrink-0 cursor-pointer"
                  title={selectedCountry ? selectedCountry.name : 'Select Country'}
                >
                  {selectedCountry ? selectedCountry.code : '--'}
                </button>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onFocus={() => {
                    if (!selectedCountry) {
                      setIsCountryPickerOpen(true);
                    }
                  }}
                  placeholder={selectedCountry?.placeholder ? `e.g. ${selectedCountry.placeholder}` : t('enterPhonePlaceholder', 'Phone number')}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono font-semibold transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {t('enterPhoneSubtitle', 'Enter your mobile number to receive your secure verification code.')}
              </p>
            </div>

            {/* Email Address Input */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{t('emailAddress', 'Email Address')}</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder', 'e.g. name@company.com or personal@gmail.com')}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{t('verificationNotice', 'Your verification code will be delivered privately to this address.')}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-teal-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Mail className="w-4 h-4" />
              <span>{isSubmitting ? t('sendingCode', 'SENDING CODE...') : t('sendVerificationCode', 'NEXT (SEND VERIFICATION CODE)')}</span>
            </button>

            <div className="text-center text-[11px] text-slate-500 pt-2">
              By proceeding, you agree to ChatTime's{' '}
              <button
                type="button"
                onClick={() => {
                  setPrivacyModalTab('terms');
                  setIsPrivacyModalOpen(true);
                }}
                className="text-teal-400 hover:underline cursor-pointer"
              >
                {t('termsOfService', 'Terms of Service')}
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => {
                  setPrivacyModalTab('privacy');
                  setIsPrivacyModalOpen(true);
                }}
                className="text-teal-400 hover:underline cursor-pointer"
              >
                {t('privacyPolicy', 'Privacy Policy')}
              </button>.
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: VERIFICATION CODE SENT TO EMAIL */}
        {/* ------------------------------------------------------------- */}
        {signupStep === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {t('verifyCode', 'Enter Verification Code')}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {t('codeSentTo', 'We sent a 6-digit verification code to')} <strong className="text-teal-400">{email}</strong>. {t('enterCodeToVerify', 'Enter it below to verify phone number')} <strong className="text-white font-mono">{phoneNumber}</strong>.
              </p>
            </div>

            {/* Clean Verification Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{t('codeSent', 'Verification Code Sent')}</div>
                    <div className="text-[10px] text-slate-400">{t('checkInboxSpam', 'Please check your inbox or spam folder')}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                  {t('active', 'Code Active')}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('enterCodeInstructions', "We've sent a 6-digit verification code directly to your email address. Please open your mail app or browser, check your inbox or spam folder, and enter the code below to verify your phone number.")}
              </p>
            </div>

            {/* 6 Digit Input Boxes */}
            <div className="space-y-2">
              <label className="block text-center text-xs font-semibold text-slate-400">
                {t('enterVerificationCode', 'Enter 6-digit verification code')}
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono text-white bg-slate-950 border border-slate-800 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 rounded-2xl outline-none transition-all shadow-inner"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Resend & Edit info options */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setSignupStep(1)}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                {t('wrongEmailEdit', 'Wrong email or phone? Edit')}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend}
                className={`font-semibold text-[11px] ${
                  canResend ? 'text-teal-400 hover:underline cursor-pointer' : 'text-slate-500'
                }`}
              >
                {canResend ? t('resendCode', 'Resend Code to Email') : `${t('resendIn', 'Resend in')} ${otpTimer}s`}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp || otpCode.join('').length !== 6}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-teal-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Check className="w-4 h-4" />
              <span>{isVerifyingOtp ? t('verifying', 'VERIFYING...') : t('verifyAndProceed', 'VERIFY & CONTINUE')}</span>
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: WHATSAPP BUSINESS PROFILE SETUP */}
        {/* ------------------------------------------------------------- */}
        {signupStep === 3 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                {t('profileInfo', 'Profile Info')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('profileInfoSubtitle', 'Please provide your business or personal name and choose an optional profile picture.')}
              </p>
            </div>

            {/* Avatar & Photo Picker */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={
                    avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      username || 'business'
                    )}&backgroundColor=0d9488`
                  }
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-teal-400 bg-slate-950 shadow-xl"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <span className="text-[11px] text-teal-400 font-semibold">{t('addPhoto', 'Add photo')}</span>
            </div>

            {/* Account Type Selector (Business vs Personal) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIsBusiness(true)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isBusiness
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{t('business', 'Business Account')}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBusiness(false)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  !isBusiness
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('personal', 'Personal Account')}</span>
              </button>
            </div>

            {/* Name & Username Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {isBusiness ? t('businessName', 'Business Name *') : t('yourName', 'Full Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isBusiness ? 'e.g. Apex Global Store' : 'e.g. Alex Johnson'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {t('usernameHandle', 'Username (@handle) *')}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    placeholder="apex_store"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Business Category (if Business Account) */}
            {isBusiness && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  {t('businessCategory', 'Business Category')}
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description / About & Security PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {isBusiness ? t('businessDescription', 'Business Description') : t('aboutBio', 'About / Status')}
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Official ChatTime Account"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t('twoStepPin', 'Two-Step Verification PIN (Optional)')}</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4-digit PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Verified Summary Strip */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{selectedCountry?.flag || '🌍'}</span>
                <span className="font-mono text-teal-300 font-semibold">{phoneNumber}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 truncate max-w-[140px]">{email}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                {t('verified', 'Verified')}
              </span>
            </div>

            {/* Initializing Progress Indicator */}
            {isInitializing && (
              <div className="space-y-2 py-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{t('initializingWorkspace', 'Initializing your encrypted workspace...')}</span>
                  <span className="font-mono text-teal-400 font-bold">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 animate-pulse rounded-full w-full" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide uppercase transition-all shadow-xl shadow-teal-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? t('creatingAccount', 'FINISHING SETUP...') : t('finishSetup', 'FINISH & START MESSAGING')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
