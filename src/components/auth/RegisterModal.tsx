import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  Globe,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  LogIn,
  Lock,
  Sparkles,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Mail,
  Briefcase,
  Check,
  Building2,
  KeyRound,
  ChevronDown,
} from 'lucide-react';
import { SUPPORTED_COUNTRIES, generateChatTimeNumber } from '../../data/countries';
import { useChatTime } from '../../context/ChatTimeContext';
import { BrandLogo } from '../common/BrandLogo';
import type { CountryInfo } from '../../types';

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

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const { registerNewAccount, loginAccount, sendPhoneOtp, verifyPhoneOtp, addToast } =
    useChatTime();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  // 3-step WhatsApp Business registration flow:
  // Step 1: Phone & Email
  // Step 2: Enter Verification Code generated on email onto the number
  // Step 3: WhatsApp Business Profile Setup
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Country, Phone & Email (No autofill - browse A to Z)
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Code Verification
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: Profile fields
  const [isBusiness, setIsBusiness] = useState(true);
  const [businessCategory, setBusinessCategory] = useState(BUSINESS_CATEGORIES[0]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('Welcome to our official ChatTime Business line.');
  const [businessHours, setBusinessHours] = useState('Mon - Fri: 9:00 AM - 6:00 PM');
  const [pin, setPin] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter countries alphabetically from A to Z with letter jump
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

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setStep(1);
      setOtpCode(['', '', '', '', '', '']);
      setGeneratedCode(null);
    }
  }, [isOpen]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, otpTimer]);

  if (!isOpen) return null;

  const handleRegenerate = () => {
    if (!selectedCountry) {
      setErrorMsg('Please select your country first.');
      setIsCountryPickerOpen(true);
      return;
    }
    setPhoneNumber(generateChatTimeNumber(selectedCountry.code));
    setOtpCode(['', '', '', '', '', '']);
    setGeneratedCode(null);
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

  // Step 1: Send Code to Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCountry) {
      setErrorMsg('Please select your country first.');
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

      setGeneratedCode(res.code || '123456');
      setOtpTimer(60);
      setCanResend(false);
      setStep(2);
      setOtpCode(['', '', '', '', '', '']);

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

  // Step 2: Handle individual digit input in OTP box
  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    const newOtp = [...otpCode];

    if (!clean) {
      newOtp[index] = '';
      setOtpCode(newOtp);
      return;
    }

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

    if (index < 5 && clean) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutofillCode = () => {
    if (generatedCode && generatedCode.length === 6) {
      setOtpCode(generatedCode.split(''));
      addToast('Code Pasted', 'Verification code put onto the number.', 'info');
    }
  };

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

      setStep(3);
    } catch {
      setIsVerifyingOtp(false);
      setErrorMsg('Verification failed. Please try again.');
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await sendPhoneOtp(phoneNumber.trim(), false, email.trim());
    setIsSubmitting(false);

    if (res.success) {
      setGeneratedCode(res.code || '123456');
      setOtpTimer(60);
      setCanResend(false);
      addToast('New Code Sent', `A fresh 6-digit code was sent to ${email}`, 'success');
    } else {
      setErrorMsg(res.error || 'Failed to resend code');
    }
  };

  // Step 3: Complete WhatsApp Business Profile
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim() || !username.trim()) {
      setErrorMsg('Business/Full Name and Username are required.');
      return;
    }
    setIsSubmitting(true);
    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const res = await registerNewAccount({
      name: name.trim(),
      username: cleanUser,
      countryCode: selectedCountry?.code || '+1',
      countryName: selectedCountry?.name || 'International',
      bio:
        bio.trim() ||
        (isBusiness ? 'Official ChatTime Business Account' : 'Available on ChatTime'),
      businessHours: isBusiness ? businessHours : undefined,
      pin: pin.length === 4 ? pin : undefined,
      chatTimeNumber: phoneNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim() || undefined,
      isBusiness,
      businessCategory: isBusiness ? businessCategory : undefined,
      avatar:
        avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          cleanUser
        )}&backgroundColor=0d9488`,
    });
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setName('');
    setUsername('');
    setPin('');
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your phone number, username, or email.');
      return;
    }
    setIsSubmitting(true);
    const res = await loginAccount(loginIdentifier.trim(), loginPin || undefined);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    setLoginIdentifier('');
    setLoginPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overscroll-none select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-transparent border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" showText={false} />
            <div>
              <h3 className="text-sm font-bold text-white font-display">Chat Time Business Account</h3>
              <p className="text-[11px] text-slate-400">Step-by-step account onboarding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2.5 gap-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setStep(1);
              setErrorMsg('');
            }}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              mode === 'register'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              mode === 'login'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In Existing
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {mode === 'register' ? (
            <div className="p-5 space-y-4">
              {/* 3-Step Progress Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      step >= 1 ? 'text-teal-400' : 'text-slate-500'
                    }`}
                  >
                    1. Phone & Email
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      step >= 2 ? 'text-teal-400' : 'text-slate-500'
                    }`}
                  >
                    2. Put Code on Number
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      step >= 3 ? 'text-teal-400' : 'text-slate-500'
                    }`}
                  >
                    3. Business Profile
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      step === 1 ? 'w-1/3 bg-teal-400' : step === 2 ? 'w-2/3 bg-teal-400' : 'w-full bg-teal-400'
                    }`}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              {/* STEP 1: PHONE & EMAIL INPUT */}
              {step === 1 && (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    {/* Country / Region Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-teal-400" /> Country / Region
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCountryPickerOpen(true);
                          setCountrySearch('');
                          setSelectedLetter('ALL');
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-teal-500/50 hover:bg-slate-800/80 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {selectedCountry ? (
                            <span className="text-xl shrink-0 leading-none">{selectedCountry.flag}</span>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                              <Globe className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {selectedCountry ? selectedCountry.name : 'Choose a country'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {selectedCountry
                                ? `${selectedCountry.code} · ${selectedCountry.iso}`
                                : 'Select country to set calling code'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {selectedCountry && (
                            <span className="font-mono text-teal-400 font-bold text-xs px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                              {selectedCountry.code}
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
                        </div>
                      </button>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-teal-400" /> Phone Number
                        </label>
                        <button
                          type="button"
                          onClick={handleRegenerate}
                          className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Generate Number
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
                          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-xs font-mono font-bold text-teal-300 cursor-pointer"
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
                          placeholder={selectedCountry?.placeholder ? `e.g. ${selectedCountry.placeholder}` : "Phone number"}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-teal-400" /> Email Address (To Receive 6-Digit Code)
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. business@company.com or personal@gmail.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                      />
                      <p className="text-[11px] text-teal-400/90 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-teal-400 shrink-0" />
                        A 6-digit code will be generated on your email to verify your phone number.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isSubmitting ? 'GENERATING CODE...' : 'NEXT (SEND CODE TO EMAIL)'}</span>
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFICATION CODE SENT TO EMAIL -> PUT ON NUMBER */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-bold text-white">Put Code on Number</h4>
                      <p className="text-xs text-slate-400">
                        Code sent to <span className="text-teal-300 font-semibold">{email}</span> for{' '}
                        <span className="text-white font-mono">{phoneNumber}</span>.
                      </p>
                    </div>

                    {generatedCode && (
                      <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-teal-300 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email Code:
                          </div>
                          <div className="text-xs font-mono font-extrabold text-white tracking-widest mt-0.5">
                            {generatedCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutofillCode}
                          className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] shrink-0 transition-colors"
                        >
                          Put Code on Number
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-center text-xs font-semibold text-slate-400">
                        Enter 6-digit verification code
                      </label>
                      <div className="flex items-center justify-center gap-2">
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
                            className="w-10 h-12 text-center text-lg font-bold font-mono text-white bg-slate-900 border border-slate-800 focus:border-teal-400 rounded-xl outline-none"
                            autoFocus={index === 0}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-slate-400 hover:text-white underline text-[11px]"
                      >
                        Edit phone or email
                      </button>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={!canResend}
                        className={`text-[11px] font-semibold ${
                          canResend ? 'text-teal-400 hover:underline' : 'text-slate-500'
                        }`}
                      >
                        {canResend ? 'Resend to Email' : `Resend in ${otpTimer}s`}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.join('').length !== 6}
                    className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isVerifyingOtp ? 'VERIFYING...' : 'PUT CODE ON NUMBER & VERIFY'}</span>
                  </button>
                </form>
              )}

              {/* STEP 3: WHATSAPP BUSINESS PROFILE SETUP */}
              {step === 3 && (
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Avatar Picker */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img
                        src={
                          avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            username || 'business'
                          )}&backgroundColor=0d9488`
                        }
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-teal-400 bg-slate-950 shadow-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <span className="text-[11px] text-teal-400 font-semibold">Add photo</span>
                  </div>

                  {/* Business vs Personal selector */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsBusiness(true)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isBusiness ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" /> Business
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBusiness(false)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        !isBusiness ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Personal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        {isBusiness ? 'Business Name *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={isBusiness ? 'e.g. Apex Global' : 'e.g. Alex'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Username (@handle) *
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                        }
                        placeholder="handle"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  {isBusiness && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-400">
                        Business Category
                      </label>
                      <select
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      >
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        {isBusiness ? 'Business Hours' : 'Status'}
                      </label>
                      <input
                        type="text"
                        value={isBusiness ? businessHours : bio}
                        onChange={(e) =>
                          isBusiness ? setBusinessHours(e.target.value) : setBio(e.target.value)
                        }
                        placeholder={isBusiness ? 'Mon-Fri 9AM-6PM' : 'Available on ChatTime'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-teal-400" /> Two-Step PIN (Optional)
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="4 digits"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSubmitting ? 'CREATING...' : 'CREATE ACCOUNT & START MESSAGING'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* LOGIN TAB */
            <div className="p-5 space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phone Number, Username, or Email
                    </label>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. +1 415-892-3011, @username, or email"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                        Security PIN / Passcode
                      </span>
                      <span className="text-[10px] text-slate-500">Leave blank if no PIN</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4-digit PIN"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSubmitting ? 'SIGNING IN...' : 'SIGN IN TO CHATTIME'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Country Selector Modal */}
      {isCountryPickerOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full h-[88vh] sm:h-[80vh] max-h-[640px] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Choose a Country</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCountryPickerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/60 shrink-0 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    if (e.target.value) setSelectedLetter('ALL');
                  }}
                  placeholder="Search country or dialing code..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Alphabet Fast-Jump Row */}
              <div className="flex items-center gap-1 overflow-x-auto pt-0.5 pb-0.5 no-scrollbar text-[10px] font-mono">
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
                      className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Country List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
              {filteredCountries.map((c) => {
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
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                        : 'hover:bg-slate-800/70 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{c.flag}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ISO: {c.iso}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-teal-400">
                        {c.code}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 ml-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
