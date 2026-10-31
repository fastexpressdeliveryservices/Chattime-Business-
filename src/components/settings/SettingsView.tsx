import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  Lock,
  Bell,
  Check,
  Key,
  Eye,
  LogOut,
  Camera,
  Palette,
  Phone,
  Volume2,
  Play,
  Sun,
  Moon,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  UserPlus,
  Copy,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  X,
  Globe,
  Search,
  ShieldCheck,
  Download,
  Smartphone,
  Share2,
  MoreVertical,
  ExternalLink,
  Zap,
  HelpCircle,
  MessageSquare,
  FileText,
  ChevronRight,
  Info,
  Wand2,
  Mail,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { BrandLogo } from '../common/BrandLogo';
import { COUNTRIES } from '../../data/countries';
import { AccentColor, RingtoneStyle, ThemeMode, AppBackgroundStyle, WallpaperPattern } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import { SUPPORTED_LANGUAGES } from '../../utils/languages';
import { RegisterModal } from '../auth/RegisterModal';
import { openInExternalBrowser } from '../../utils/linkHandler';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { VoiceAISettingsSection } from '../voice/VoiceAISettingsSection';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    updateCurrentUser,
    updateNotificationSettings,
    sendPhoneOtp,
    verifyPhoneOtp,
    setIsAppLocked,
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    appBackground,
    setAppBackground,
    wallpaper,
    setWallpaper,
    wallpaperOpacity,
    setWallpaperOpacity,
    notificationPermission,
    requestBrowserNotifications,
    triggerTestCallNotification,
    language,
    setLanguage,
    t,
    logoutUser,
    deleteMyAccount,
    addToast,
    setActiveTab,
    startDirectChat,
    sendMessage,
    setVerificationBadgeByAdmin,
    openVoiceStudio,
    setInspectedUserId,
    loginAccount,
  } = useChatTime();

  const [activeSection, setActiveSection] = useState<
    'profile' | 'appearance' | 'voice_ai' | 'notifications' | 'language' | 'privacy' | 'security' | 'help' | 'app'
  >('profile');
  const [langSearch, setLangSearch] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Help Centre state (WhatsApp styled)
  const [helpSearch, setHelpSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [contactSubject, setContactSubject] = useState('Account & Login');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingSupportMsg, setIsSendingSupportMsg] = useState(false);

  const HELP_ARTICLES = [
    {
      id: 'verify',
      category: 'Account & Verification',
      title: 'How does verification code & email work?',
      content:
        'ChatTime uses official email verification codes. During signup, a 6-digit one-time passcode (OTP) is dispatched from "ChatTime Business" directly to your email address with the official red app emblem. Enter the code within 10 minutes to verify your account.',
    },
    {
      id: 'lastseen',
      category: 'Privacy & Security',
      title: 'How to hide Last Seen & Online presence?',
      content:
        'Go to Settings > Privacy Controls > Last Seen & Online Status. You can select "Everyone", "My Contacts", or "Nobody". When set to Nobody, other users will not see when you were last active or online, and your status remains completely private without displaying any privacy tags.',
    },
    {
      id: 'hidenumber',
      category: 'Privacy & Security',
      title: 'How to hide your Phone Number and Country?',
      content:
        'Under Settings > Privacy Controls, you can configure "Phone Number Visibility" and "Country & Region Visibility". Selecting "Nobody" or "Contacts Only" ensures your phone number and country remain hidden from other users across direct chats and profile views.',
    },
    {
      id: 'readreceipts',
      category: 'Chats & Messaging',
      title: 'How do read receipts and checkmarks work?',
      content:
        'ChatTime features standard real-time checkmarks: One grey tick means sent to the server; two grey ticks mean delivered to the recipient; and two sky-blue ticks mean read by the recipient. You can toggle read receipts off under Privacy Controls at any time.',
    },
    {
      id: 'encryption',
      category: 'Security & Safety',
      title: 'Are messages and calls end-to-end encrypted?',
      content:
        'Yes. All direct chats, voice notes, media, and peer-to-peer audio/video calls in ChatTime are end-to-end encrypted using industry-standard cryptography. No one outside the conversation, not even ChatTime staff, can read or listen to your communications.',
    },
    {
      id: 'pinlock',
      category: 'Security & Safety',
      title: 'Setting up 4-digit PIN App Lock',
      content:
        'Protect your messages from unauthorized local access by enabling a 4-digit PIN under Settings > Security & App Lock. Once enabled, ChatTime prompts for your PIN when reopening the application or after periods of inactivity.',
    },
  ];

  const handleContactSupport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSendingSupportMsg(true);
    try {
      const supportChatId = startDirectChat('user_chattime_support');
      if (contactMessage.trim()) {
        const fullMsg = `[Inquiry: ${contactSubject}]\n${contactMessage.trim()}`;
        await sendMessage(supportChatId, fullMsg);
      }
      setActiveTab('chats');
      addToast(
        'Connected to Support',
        'Official ChatTime 24/7 Support desk opened.',
        'success'
      );
      setContactMessage('');
    } catch {
      setActiveTab('chats');
    } finally {
      setIsSendingSupportMsg(false);
    }
  };

  // Admin Quick Code Login State (Code: 0814)
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  const handleAdminCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = adminCodeInput.trim();
    if (code !== '0814' && code !== '814') {
      addToast('Invalid Admin Code', 'The code entered does not match master administrator credentials.', 'warning');
      return;
    }
    setIsAdminLoggingIn(true);
    try {
      const res = await loginAccount('0814');
      if (res.user) {
        addToast('Admin Authorized', 'Logged in as ChatTime Administrator.', 'success');
        setAdminCodeInput('');
      } else {
        addToast('Login Failed', res.error || 'Could not verify admin code.', 'error');
      }
    } catch {
      addToast('Error', 'Failed to connect to authentication service.', 'error');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // PWA Install state
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowInstallGuide(true);
      } else {
        addToast('Installing App', 'ChatTime is being installed to your device.', 'success');
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  // Profile fields state
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [statusFeeling, setStatusFeeling] = useState(currentUser.statusFeeling);
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [profileSaved, setProfileSaved] = useState(false);

  // Phone verification state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState(currentUser.countryCode || '+1');
  const [newPhoneDigits, setNewPhoneDigits] = useState('');
  const [otpSentCode, setOtpSentCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');

  // Security PIN state
  const [newPin, setNewPin] = useState(currentUser.securitySettings?.pinCode || '');

  useEffect(() => {
    setName(currentUser.name);
    setUsername(currentUser.username);
    setBio(currentUser.bio);
    setStatusFeeling(currentUser.statusFeeling);
    setLocation(currentUser.location || '');
    setWebsite(currentUser.website || '');
    setAvatar(currentUser.avatar);
    setPhoneCountryCode(currentUser.countryCode || '+1');
    setNewPin(currentUser.securitySettings?.pinCode || '');
  }, [currentUser.id]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
      updateCurrentUser({ avatar: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      name: name.trim() || currentUser.name,
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || currentUser.username,
      bio,
      statusFeeling,
      location,
      website,
      avatar,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleRequestPhoneOtp = async () => {
    setPhoneError('');
    setPhoneSuccess('');
    const digits = newPhoneDigits.replace(/[^0-9]/g, '');
    if (digits.length < 6) {
      setPhoneError('Please enter a valid phone number (at least 6 digits).');
      return;
    }
    const formattedPhone = `${phoneCountryCode} ${digits}`;
    const res = await sendPhoneOtp(formattedPhone, true);
    if (!res.success) {
      setPhoneError(res.error || 'Failed to send verification code.');
    } else {
      setOtpSentCode(res.code || '');
      setOtpInput(res.code || '');
    }
  };

  const handleVerifyPhoneUpdate = async () => {
    setPhoneError('');
    const digits = newPhoneDigits.replace(/[^0-9]/g, '');
    const formattedPhone = `${phoneCountryCode} ${digits}`;
    const countryObj = COUNTRIES.find((c) => c.code === phoneCountryCode);

    const res = await verifyPhoneOtp(formattedPhone, otpInput.trim(), {
      updateCurrentUser: true,
      countryCode: phoneCountryCode,
      countryName: countryObj?.name || currentUser.countryName,
    });

    if (!res.success) {
      setPhoneError(res.error || 'Invalid verification code.');
    } else {
      setPhoneSuccess(`Verified & updated to ${formattedPhone}`);
      setOtpSentCode(null);
      setOtpInput('');
      setNewPhoneDigits('');
      setIsEditingPhone(false);
    }
  };

  const updatePrivacyField = (updates: Partial<typeof currentUser.privacySettings>) => {
    updateCurrentUser({
      privacySettings: {
        ...currentUser.privacySettings,
        ...updates,
      },
    });
  };

  const updateSecurityField = (updates: Partial<typeof currentUser.securitySettings>) => {
    updateCurrentUser({
      securitySettings: {
        ...currentUser.securitySettings,
        ...updates,
      },
    });
  };

  const notifSettings = currentUser.notificationSettings || {
    messagePreviews: true,
    soundEffects: true,
    callRingtone: true,
    ringtoneStyle: 'harmonic' as RingtoneStyle,
    ringtoneVolume: 80,
    communityAlerts: true,
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden select-none">
      {/* Settings Navigation Sidebar */}
      <div className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 p-4 flex md:flex-col justify-between shrink-0">
        <div className="space-y-1 w-full">
          {/* Mobile Back Button */}
          <div className="flex md:hidden items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-sm min-h-[38px]"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>{t('backToChats', 'Back to Chats')}</span>
            </button>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {t('settings', 'Settings')}
            </span>
          </div>

          <h2 className="hidden md:block text-lg font-bold text-slate-100 font-display px-3 py-2">
            Settings
          </h2>

          <div className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'profile', label: t('myProfile', 'Profile & Phone'), icon: UserIcon },
              { id: 'appearance', label: t('appearance', 'Themes & Colours'), icon: Palette },
              { id: 'voice_ai', label: t('voiceAi', 'Voice Changing & AI'), icon: Wand2 },
              { id: 'notifications', label: t('notifications', 'Ringtones & Alerts'), icon: Bell },
              { id: 'language', label: t('language', 'App Language'), icon: Globe },
              { id: 'privacy', label: t('privacy', 'Privacy Controls'), icon: Eye },
              { id: 'security', label: t('security', 'Security & Lock'), icon: Lock },
              { id: 'help', label: t('helpCentre', 'Help & Support'), icon: HelpCircle },
              { id: 'app', label: isInstalled ? t('installedOnDevice', 'App Installed (v2.5)') : t('installOnPhone', 'Install on Phone'), icon: Smartphone },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-slate-800/80">
          {!isInstalled ? (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-600/20 via-slate-900 to-slate-900 border border-red-500/40 hover:border-red-400 text-left transition-all group cursor-pointer shadow-lg shadow-red-500/10 mb-1"
              title={t('installApp', 'Install ChatTime on your phone or computer')}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{t('installApp', 'Install App')}</div>
                  <div className="text-[10px] text-red-300/80 truncate">{t('installAppDesc', 'Chrome & Phone APK')}</div>
                </div>
              </div>
            </button>
          ) : (
            <div className="w-full flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t('installedOnDevice', 'Installed on Device')}</span>
            </div>
          )}

          <button
            onClick={logoutUser}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('signOut', 'Sign Out of Account')}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Content Panel */}
      <div
        style={{
          paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 24px) + 5rem)',
        }}
        className="flex-1 h-full overflow-y-auto p-4 sm:p-8 max-w-3xl"
      >
        {/* 1. PROFILE & PHONE VERIFICATION */}
        {activeSection === 'profile' && (
          <div className="space-y-8">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  Complete User Profile
                </h3>
                <p className="text-xs text-slate-400">
                  Update your profile photo, name, username, and verified phone number.
                </p>
              </div>

              {/* Avatar & Identity Card */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img
                      src={avatar}
                      alt={currentUser.name}
                      className="w-20 h-20 rounded-3xl object-cover border-2 border-teal-400 bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                    <label
                      className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                      title="Upload New Photo"
                    >
                      <Camera className="w-6 h-6 text-teal-300" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-base font-bold text-slate-100">{currentUser.name}</div>
                      <VerifiedBadge user={currentUser} size="sm" />
                    </div>
                    <div className="text-xs text-teal-400 font-medium">@{currentUser.username}</div>
                    <div className="text-xs font-mono text-slate-300 mt-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-teal-400" />
                      <span>{currentUser.phoneNumber || currentUser.chatTimeNumber}</span>
                      {currentUser.phoneVerified && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectedUserId(currentUser.id || 'me')}
                    className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-xs font-bold text-slate-950 cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>View Full Profile</span>
                  </button>
                  <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-teal-400" />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Admin Verification Badge Control Card */}
              {currentUser.role === 'admin' && (
                <div className="p-5 bg-slate-900 border border-amber-500/30 rounded-3xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                          Official Verification Badge (Admin Setting)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Choose the verified tick badge displayed on your profile and messages.
                        </p>
                      </div>
                    </div>
                    <VerifiedBadge user={currentUser} size="md" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setVerificationBadgeByAdmin(currentUser.id, 'red')}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        currentUser.isRedVerified ||
                        currentUser.verificationBadge === 'red' ||
                        currentUser.verificationBadgeType === 'red'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-lg shadow-rose-500/20'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <VerifiedBadge type="red" size="xs" />
                      <span>Red Tick (VIP/Admin)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationBadgeByAdmin(currentUser.id, 'blue')}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        currentUser.isVerified &&
                        !currentUser.isRedVerified &&
                        currentUser.verificationBadge !== 'red' &&
                        currentUser.verificationBadgeType !== 'red'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-lg shadow-sky-500/20'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <VerifiedBadge type="blue" size="xs" />
                      <span>Blue Tick (Verified)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationBadgeByAdmin(currentUser.id, 'none')}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        !currentUser.isVerified &&
                        !currentUser.isRedVerified &&
                        currentUser.verificationBadge !== 'red'
                          ? 'bg-slate-800 text-slate-200 border-slate-700'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span>No Badge</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Phone Number Update & Verification Section */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-teal-400" />
                      Registered Phone Number
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Current: <span className="font-mono text-slate-200 font-semibold">{currentUser.phoneNumber || currentUser.chatTimeNumber}</span> ({currentUser.countryName})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhone(!isEditingPhone);
                      setPhoneError('');
                      setPhoneSuccess('');
                      setOtpSentCode(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold transition-colors"
                  >
                    {isEditingPhone ? 'Cancel Change' : 'Change Phone Number'}
                  </button>
                </div>

                {phoneSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{phoneSuccess}</span>
                  </div>
                )}

                {isEditingPhone && (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <p className="text-xs text-slate-300">
                      Enter your new phone number. We will send a 6-digit verification code to confirm ownership.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={phoneCountryCode}
                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-400 font-bold"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code + c.name} value={c.code}>
                            {c.flag} {c.code} ({c.name})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={newPhoneDigits}
                        onChange={(e) => setNewPhoneDigits(e.target.value)}
                        placeholder="Enter new phone number digits..."
                        className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleRequestPhoneOtp}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shrink-0"
                      >
                        Send OTP Code
                      </button>
                    </div>

                    {otpSentCode && (
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-teal-500/40 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold">
                            Enter 6-Digit Verification Code:
                          </span>
                          <span className="font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                            SMS Code: {otpSentCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="6-digit code"
                            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold tracking-widest text-teal-300 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyPhoneUpdate}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                          >
                            Verify & Save Number
                          </button>
                        </div>
                      </div>
                    )}

                    {phoneError && <p className="text-xs text-rose-400">{phoneError}</p>}
                  </div>
                )}
              </div>

              {/* Editable Profile Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Username
                    </label>
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
                      <span className="text-xs text-slate-500">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-slate-100 focus:outline-none pl-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Current Status Feeling
                  </label>
                  <input
                    type="text"
                    value={statusFeeling}
                    onChange={(e) => setStatusFeeling(e.target.value)}
                    placeholder="e.g. Available, Building on ChatTime"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Bio / About
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Website
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {profileSaved && (
                  <span className="text-xs text-teal-400 flex items-center gap-1 font-bold">
                    <Check className="w-4 h-4" />
                    Profile saved permanently!
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-6 py-2.5 bg-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-teal-400 shadow-lg shadow-teal-500/20"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. APPEARANCE & COLOUR SYSTEM */}
        {activeSection === 'appearance' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  Appearance, Themes & Colour System
                </h3>
                <p className="text-xs text-slate-400">
                  Customize ChatTime with Dark Mode, Midnight OLED, Light Mode, and 8 accent colours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('chats')}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-slate-700 transition-colors shrink-0 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back to Chats</span>
              </button>
            </div>

            {/* Theme Mode Selector */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Interface Theme Mode
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: 'dark',
                      label: 'Obsidian Dark',
                      desc: 'Deep slate studio dark mode',
                      icon: Moon,
                    },
                    {
                      id: 'midnight',
                      label: 'Midnight AMOLED',
                      desc: 'True pitch-black contrast',
                      icon: Sparkles,
                    },
                    {
                      id: 'light',
                      label: 'Daylight Clean',
                      desc: 'Crisp high-contrast light mode',
                      icon: Sun,
                    },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const active = theme === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setTheme(m.id as ThemeMode)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                        active
                          ? 'bg-teal-500/15 border-teal-500 text-slate-100 shadow-lg'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-5 h-5 text-teal-400" />
                        {active && <Check className="w-4 h-4 text-teal-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{m.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color Selector */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Primary Brand Accent Colour
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select a vibrant color scheme that radiates across buttons, highlights, and background atmosphere.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(
                  [
                    { id: 'orange', label: 'Solar Orange', hex: '#f97316', desc: 'Fiery radiant sunset' },
                    { id: 'teal', label: 'Cyber Teal', hex: '#14b8a6', desc: 'Clean mint modern' },
                    { id: 'indigo', label: 'Royal Indigo', hex: '#6366f1', desc: 'Deep electric dusk' },
                    { id: 'sky', label: 'Ocean Sky', hex: '#0ea5e9', desc: 'Vivid azure sea' },
                    { id: 'emerald', label: 'Neon Emerald', hex: '#10b981', desc: 'Lush cyber matrix' },
                    { id: 'rose', label: 'Crimson Rose', hex: '#f43f5e', desc: 'Bold radiant ruby' },
                    { id: 'amber', label: 'Solar Amber', hex: '#f59e0b', desc: 'Warm golden glow' },
                    { id: 'violet', label: 'Electric Violet', hex: '#8b5cf6', desc: 'Mystic royal twilight' },
                  ] as const
                ).map((col) => {
                  const active = accentColor === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setAccentColor(col.id as AccentColor)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        active
                          ? 'bg-slate-800 border-white text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          style={{ backgroundColor: col.hex }}
                          className="w-5 h-5 rounded-full shadow-inner shrink-0"
                        />
                        <span className="text-xs font-semibold">{col.label}</span>
                      </div>
                      {active && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-xs text-slate-400">
                  Chosen accent: <strong className="text-white capitalize">{accentColor}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('chats')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go Back to Chats</span>
                </button>
              </div>
            </div>

            {/* App Background Atmosphere Selector */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  App Background Atmosphere
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Change the app background experience with dynamic lighting, glowing horizon gradients, or cyber grids.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: 'whatsapp',
                      label: 'WhatsApp Clear',
                      desc: 'Classic clean WhatsApp background with subtle doodle wallpaper and high contrast.',
                    },
                    {
                      id: 'glow',
                      label: 'Ambient Radiant Glow',
                      desc: 'Smooth luminous breathing orbs tinted by your chosen accent color.',
                    },
                    {
                      id: 'sunset',
                      label: 'Sunset Horizon',
                      desc: 'Fiery warm orange, solar amber, and dusky twilight horizon glow.',
                    },
                    {
                      id: 'aurora',
                      label: 'Aurora Wave',
                      desc: 'Flowing multi-color northern lights shimmering across the background.',
                    },
                    {
                      id: 'cyber',
                      label: 'Cyber Matrix Grid',
                      desc: 'High-tech perspective grid with illuminated accent horizon lines.',
                    },
                    {
                      id: 'cosmic',
                      label: 'Cosmic Nebula',
                      desc: 'Interstellar deep space nebula with delicate stardust clusters.',
                    },
                    {
                      id: 'mesh',
                      label: 'Silky Gradient Mesh',
                      desc: 'Modern organic color blend that shifts with your chosen accent.',
                    },
                    {
                      id: 'minimal',
                      label: 'Studio Minimal',
                      desc: 'Ultra-clean solid dark studio backdrop with razor-sharp contrast.',
                    },
                  ] as const
                ).map((b) => {
                  const active = appBackground === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setAppBackground(b.id as AppBackgroundStyle)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                        active
                          ? 'bg-teal-500/15 border-teal-500 text-slate-100 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100">{b.label}</span>
                        {active && <Check className="w-4 h-4 text-teal-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{b.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat & App Wallpaper Pattern Overlay */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Wallpaper Pattern & Texture
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Subtle tactile wallpaper motif overlay on the app and chat window.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Opacity:</span>
                  <input
                    type="range"
                    min="0.02"
                    max="0.30"
                    step="0.02"
                    value={wallpaperOpacity}
                    onChange={(e) => setWallpaperOpacity(parseFloat(e.target.value))}
                    className="w-24 accent-teal-500"
                  />
                  <span className="font-mono text-teal-400 text-[11px]">
                    {Math.round(wallpaperOpacity * 100)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {(
                  [
                    { id: 'doodle', label: 'Doodles & Bubbles' },
                    { id: 'geometric', label: 'Geometric Facets' },
                    { id: 'stars', label: 'Constellations' },
                    { id: 'circuit', label: 'Cyber Traces' },
                    { id: 'none', label: 'No Pattern (Clean)' },
                  ] as const
                ).map((wp) => {
                  const active = wallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      onClick={() => setWallpaper(wp.id as WallpaperPattern)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        active
                          ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{wp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VOICE CHANGING & KRISP AUDIO PLATFORM (Immediately after Appearance) */}
        {activeSection === 'voice_ai' && <VoiceAISettingsSection />}

        {/* 3. RINGTONES & NOTIFICATIONS */}
        {activeSection === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Call Ringtones & Notifications
              </h3>
              <p className="text-xs text-slate-400">
                Configure your incoming/outgoing call ringtone, volume, and background push alerts.
              </p>
            </div>

            {/* Browser / PWA Push Notification & Phone Ringing When Sleeping */}
            <div className="p-5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/30 rounded-3xl space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Phone Notifications & Ringing (When Phone is Sleeping)
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Rings with sound & vibration on your phone even when the screen is locked or sleeping like a normal mobile app.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {notificationPermission === 'granted'
                    ? '✓ Normal App Ringing Active'
                    : 'Permission Needed'}
                </span>
              </div>

              {notificationPermission !== 'granted' && (
                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={requestBrowserNotifications}
                    className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Allow Notifications on Phone</span>
                  </button>
                </div>
              )}
            </div>

            {/* Professional Ringtone Selector & Preview */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Incoming Call Ringtone</h4>
                  <p className="text-[11px] text-slate-400">
                    Choose a studio-synthesized ringtone and click play to test
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifSettings.callRingtone}
                  onChange={(e) => {
                    soundEffects.setCallRingtoneEnabled(e.target.checked);
                    updateNotificationSettings({ callRingtone: e.target.checked });
                  }}
                  className="w-4 h-4 accent-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(
                  [
                    { id: 'harmonic', name: 'Harmonic Studio Arpeggio', desc: 'Warm C-major chord progression' },
                    { id: 'pulse', name: 'Nordic Pulse', desc: 'Clean modern dual-chord cadence' },
                    { id: 'marimba', name: 'Acoustic Marimba', desc: 'Crisp melodic percussive chime' },
                    { id: 'classic', name: 'Executive Digital Bell', desc: 'Classic professional dual-tone ring' },
                  ] as const
                ).map((rt) => {
                  const selected = notifSettings.ringtoneStyle === rt.id;
                  return (
                    <div
                      key={rt.id}
                      onClick={() => {
                        soundEffects.setRingtoneStyle(rt.id);
                        soundEffects.previewRingtone(rt.id);
                        updateNotificationSettings({ ringtoneStyle: rt.id });
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        selected
                          ? 'bg-teal-500/15 border-teal-500/40 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{rt.name}</div>
                        <div className="text-[10px] text-slate-400">{rt.desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.previewRingtone(rt.id);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-teal-300 transition-colors"
                        title="Preview Ringtone"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Ringtone Volume Slider */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-teal-400" />
                    Ringtone & Alert Volume
                  </span>
                  <span className="font-mono text-teal-400">{notifSettings.ringtoneVolume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={notifSettings.ringtoneVolume}
                  onChange={(e) => {
                    const vol = Number(e.target.value);
                    soundEffects.setVolume(vol);
                    updateNotificationSettings({ ringtoneVolume: vol });
                  }}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Sound Effects & Community Alerts */}
            <div className="space-y-3">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">In-App Message & Action Sounds</h4>
                  <p className="text-[11px] text-slate-400">Play subtle chimes when sending/receiving messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifSettings.soundEffects}
                  onChange={(e) => {
                    soundEffects.setEnabled(e.target.checked);
                    updateNotificationSettings({ soundEffects: e.target.checked });
                  }}
                  className="w-4 h-4 accent-teal-500"
                />
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Community Announcement Alerts</h4>
                  <p className="text-[11px] text-slate-400">Receive instant notifications for joined communities</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifSettings.communityAlerts}
                  onChange={(e) => updateNotificationSettings({ communityAlerts: e.target.checked })}
                  className="w-4 h-4 accent-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. LANGUAGE SELECTOR (A TO Z FOR ALL COUNTRIES) */}
        {activeSection === 'language' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <span>{t('language', 'App Language')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the language for the ChatTime interface. Updates chats, calls, and settings instantly.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  placeholder="Search language or country..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Grid of All 51 Global Languages A to Z */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[65dvh] overflow-y-auto pr-1">
              {SUPPORTED_LANGUAGES.filter(
                (l) =>
                  !langSearch.trim() ||
                  l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                  l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
                  l.code.toLowerCase().includes(langSearch.toLowerCase()) ||
                  l.region.toLowerCase().includes(langSearch.toLowerCase())
              ).map((lang) => {
                const isCurrent = language === lang.code || language.startsWith(lang.code + '-');
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      addToast('Language Updated', `Switched to ${lang.name} (${lang.nativeName})`, 'success');
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-teal-500/15 border-teal-500 text-white shadow-md ring-1 ring-teal-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{lang.flag}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{lang.nativeName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({lang.code})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{lang.name}</div>
                      </div>
                    </div>
                    {isCurrent ? (
                      <Check className="w-4 h-4 text-teal-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 font-medium">
                        {lang.region}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Active language: <strong className="text-teal-400">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.nativeName || language}</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('chats')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back to Chats</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. PRIVACY CONTROLS */}
        {activeSection === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">Privacy Controls</h3>
              <p className="text-xs text-slate-400">
                Control who can see your phone number, online status, stories, and read receipts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Phone Number Visibility</h4>
                  <p className="text-[11px] text-slate-400">
                    Control who can see your phone number on your profile
                  </p>
                </div>
                <select
                  value={currentUser.privacySettings.numberVisibility}
                  onChange={(e) => updatePrivacyField({ numberVisibility: e.target.value as any })}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts Only</option>
                  <option value="nobody">Nobody (Hidden)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Mask Phone Number in Public Views</h4>
                  <p className="text-[11px] text-slate-400">
                    Hide middle digits of your phone number to non-contacts
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.phonePrivate}
                  onChange={(e) => updateCurrentUser({ phonePrivate: e.target.checked })}
                  className="w-4 h-4 accent-teal-500"
                />
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">
                    Last Seen & Online Status
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Control who can see when you are online or last active
                  </p>
                </div>
                <select
                  value={currentUser.privacySettings.lastSeenVisibility}
                  onChange={(e) =>
                    updatePrivacyField({ lastSeenVisibility: e.target.value as any })
                  }
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Read Receipts</h4>
                  <p className="text-[11px] text-slate-400">
                    Show double checkmarks when you read messages
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.privacySettings.readReceipts}
                  onChange={(e) => updatePrivacyField({ readReceipts: e.target.checked })}
                  className="w-4 h-4 accent-teal-500"
                />
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Who Can Call Me</h4>
                  <p className="text-[11px] text-slate-400">
                    Filter incoming voice and video calls
                  </p>
                </div>
                <select
                  value={currentUser.privacySettings.whoCanCallMe}
                  onChange={(e) => updatePrivacyField({ whoCanCallMe: e.target.value as any })}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts Only</option>
                </select>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Country & Region Visibility</h4>
                  <p className="text-[11px] text-slate-400">
                    Control who can see your country on your profile
                  </p>
                </div>
                <select
                  value={currentUser.privacySettings.countryVisibility || 'everyone'}
                  onChange={(e) => updatePrivacyField({ countryVisibility: e.target.value as any })}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts Only</option>
                  <option value="nobody">Nobody (Hidden)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Date of Joining Visibility</h4>
                  <p className="text-[11px] text-slate-400">
                    Control who can see when you joined ChatTime
                  </p>
                </div>
                <select
                  value={currentUser.privacySettings.joinDateVisibility || 'everyone'}
                  onChange={(e) => updatePrivacyField({ joinDateVisibility: e.target.value as any })}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">My Contacts Only</option>
                  <option value="nobody">Nobody (Hidden)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 5. SECURITY & PIN LOCK */}
        {activeSection === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                Security & App Lock
              </h3>
              <p className="text-xs text-slate-400">
                Protect your account with a 4-digit PIN passcode and two-factor authentication.
              </p>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">4-Digit App Passcode Lock</h4>
                    <p className="text-[11px] text-slate-400">
                      Lock your screen with a PIN code
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentUser.securitySettings.pinEnabled}
                  onChange={(e) =>
                    updateSecurityField({
                      pinEnabled: e.target.checked,
                      pinCode: newPin || '1234',
                    })
                  }
                  className="w-4 h-4 accent-teal-500"
                />
              </div>

              {currentUser.securitySettings.pinEnabled && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="4-digit PIN"
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 w-40"
                  />
                  <button
                    onClick={() =>
                      updateSecurityField({ pinEnabled: true, pinCode: newPin || '1234' })
                    }
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl"
                  >
                    Save PIN
                  </button>
                  <button
                    onClick={() => setIsAppLocked(true)}
                    className="ml-auto px-4 py-2 bg-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-teal-400"
                  >
                    Lock App Now
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Require PIN verification when signing in from a new device
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={currentUser.securitySettings.twoFactorEnabled}
                onChange={(e) => updateSecurityField({ twoFactorEnabled: e.target.checked })}
                className="w-4 h-4 accent-teal-500"
              />
            </div>

            <div className="p-5 bg-slate-900 border border-teal-500/20 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-teal-400" />
                  Create New Account or Sign In Another
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Register another personal account or switch between existing logins
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-teal-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create / Switch Account</span>
              </button>
            </div>

            <div className="p-5 bg-slate-900 border border-rose-500/20 rounded-3xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-100">Account Session</h4>
                <p className="text-[11px] text-slate-400">
                  Sign out of your account on this device
                </p>
              </div>
              <button
                onClick={logoutUser}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Permanent Account Deletion */}
            <div className="p-5 bg-slate-900/90 border border-rose-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Delete Account Permanently
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Permanently delete your profile, chat history, and remove this account from the server
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. HELP & SUPPORT (WhatsApp Style) */}
        {activeSection === 'help' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <span>Help Centre & Support</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Browse help topics, contact our 24/7 dedicated support desk, or check your encryption and app info.
              </p>
            </div>

            {/* WhatsApp-Style Official Support Account & Concierge */}
            <div className="p-5 bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/40 rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src="/icon.svg"
                      alt="ChatTime Support"
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-800 border-2 border-rose-500/60 shadow-md"
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute -bottom-0.5 -right-0.5" title="Online 24/7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white">ChatTime Support</h4>
                      <VerifiedBadge type="red" size="sm" />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Official Support Desk
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Direct WhatsApp-style 24/7 technical care, account security & inquiries.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleContactSupport()}
                  disabled={isSendingSupportMsg}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isSendingSupportMsg ? 'Opening...' : 'Message Support'}</span>
                </button>
              </div>

              {/* Inquiry Composer */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap gap-2">
                  {['Account & Login', 'Verification / OTP', 'Krisp Audio & Voice', 'Privacy & Settings', 'Other Question'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setContactSubject(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        contactSubject === cat
                          ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Type a message to ChatTime Support... (Sends as 1-on-1 direct message)"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500/80 resize-none"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    End-to-end encrypted • Not a public channel
                  </span>
                  <button
                    type="button"
                    onClick={() => handleContactSupport()}
                    disabled={isSendingSupportMsg}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Inquiry</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Human Support Concierge Card */}
            <div className="grid grid-cols-1 gap-3.5">
              {/* Human Support Email Card */}
              <div className="p-4 bg-slate-900 border border-teal-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
                    <Mail className="w-4 h-4" />
                    <span>Human Support Email</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">24/7 Monitored</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white">
                  <span>support@chattime.com</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('support@chattime.com');
                      addToast('Email Copied', 'support@chattime.com copied to clipboard.', 'info');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Copy Email"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <a
                  href="mailto:support@chattime.com?subject=ChatTime%20Support%20Inquiry"
                  className="w-full py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Support Concierge</span>
                </a>
              </div>

            </div>

            {/* Search Help Articles */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={helpSearch}
                onChange={(e) => setHelpSearch(e.target.value)}
                placeholder="Search help articles, FAQs & security guides..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/80"
              />
            </div>

            {/* FAQ Accordion List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Frequently Asked Questions
              </h4>
              {HELP_ARTICLES.filter(
                (a) =>
                  !helpSearch ||
                  a.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
                  a.content.toLowerCase().includes(helpSearch.toLowerCase()) ||
                  a.category.toLowerCase().includes(helpSearch.toLowerCase())
              ).map((article) => {
                const isExpanded = expandedFaqId === article.id;
                return (
                  <div
                    key={article.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : article.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="pr-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-0.5">
                          {article.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-100">
                          {article.title}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 text-teal-400' : ''
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="p-4 pt-1 border-t border-slate-800/60 text-xs text-slate-300 leading-relaxed bg-slate-950/40 animate-in fade-in duration-150">
                        {article.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Terms & Privacy Policy and App Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Terms & Privacy Policy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ChatTime guarantees complete user data confidentiality, zero selling of personal info, and cryptographically verified privacy.
                </p>
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider pt-1">
                  Verified Legal Compliance
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Info className="w-4 h-4 text-teal-400" />
                  <span>App Information</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ChatTime Business Web & Mobile • Version 2.5.0 • End-to-end encrypted messaging engine active.
                </p>
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  System Operational (Live)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. APP INSTALLATION & PWA / WEBAPK SYSTEM */}
        {activeSection === 'app' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-red-500" />
                <span>Application Installation & Device Sync</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Install ChatTime directly to your phone, tablet, or computer with the official red app emblem, offline caching, and fullscreen communications.
              </p>
            </div>

            {/* Hero App Banner Card with Red Logo */}
            <div className="p-6 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border border-red-500/30 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src="/pwa-192x192.png"
                      alt="Chat Time Official Logo"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-red-500/50 shadow-xl shadow-red-500/25"
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-extrabold text-white font-display">
                        Chat Time Business
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-mono font-bold">
                        Official Red Logo
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Encrypted Messaging • HD Voice & Video Calls • Stories
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-0.5">
                      <span>Package: <strong className="text-slate-200">app.chattime.messenger</strong></span>
                      <span>•</span>
                      <span>v2.5.0</span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0">
                  {isInstalled ? (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Installed on Device</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span>Ready to Install</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 relative z-10">
                {!isInstalled ? (
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-xl shadow-red-500/30 active:scale-98 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Install ChatTime to Phone (Base APK)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      addToast('App Ready', 'ChatTime is running as an installed standalone app with real-time sync.', 'success');
                    }}
                    className="flex-1 py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>App is Installed & Up to Date</span>
                  </button>
                )}

                {isInIframe && (
                  <button
                    onClick={() => openInExternalBrowser(window.location.href)}
                    className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                    <span>Open in Chrome / Browser</span>
                  </button>
                )}

                <button
                  onClick={() => setShowInstallGuide(true)}
                  className="py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Installation Guide</span>
                </button>
              </div>
            </div>

            {/* Platform Guides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Android & Google Chrome */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Android & Google Chrome</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On Android phones and Google Chrome, tapping <strong>Install</strong> packages ChatTime with the official red icon.
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                  <li>Tap the <strong className="text-slate-200">Install ChatTime</strong> button above.</li>
                  <li>Or tap Chrome menu <MoreVertical className="w-3 h-3 inline text-emerald-400" /> (three dots) in the top right.</li>
                  <li>Select <strong className="text-slate-200">Install app</strong> or <strong className="text-slate-200">Add to Home screen</strong>.</li>
                  <li>The app will appear in your app drawer with the red ChatTime logo.</li>
                </ol>
              </div>

              {/* iPhone & iPad (Safari) */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                  <Share2 className="w-4 h-4" />
                  <span>iPhone & iPad (Safari)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On iOS, Apple Safari installs the app via the Share sheet.
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                  <li>Open this link in <strong className="text-slate-200">Safari</strong>.</li>
                  <li>Tap the <strong className="text-slate-200">Share</strong> icon <Share2 className="w-3 h-3 inline text-teal-400" /> in the bottom toolbar.</li>
                  <li>Scroll down and select <strong className="text-slate-200">Add to Home Screen</strong>.</li>
                  <li>Tap <strong className="text-slate-200">Add</strong>. ChatTime launches standalone in full screen!</li>
                </ol>
              </div>
            </div>

            {/* Native Capabilities Breakdown */}
            <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Installed Application Features</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Full-screen app view with no URL bar</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hardware camera & mic for HD calls</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant incoming call & message push</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Fast offline cache for instant loading</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Delete Account?</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete your account (<strong>@{currentUser.username}</strong>)?
              This will remove all your data, messages, and contact details from ChatTime. This action cannot be undone.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={async () => {
                  setIsDeletingAccount(true);
                  const res = await deleteMyAccount();
                  setIsDeletingAccount(false);
                  if (res.success) {
                    setShowDeleteConfirm(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-500/25 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingAccount ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installation Guide & Prompt Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Chat Time Logo"
                  className="w-12 h-12 rounded-2xl object-cover border border-red-500/40 shadow-md shadow-red-500/20"
                />
                <div>
                  <h2 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                    <span>Chat Time</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-sans">Official</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Encrypted Messaging & Calls</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-red-400" />
                  Install ChatTime on Your Phone
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Install ChatTime as a standalone application on your home screen with the official red logo.
                </p>
              </div>

              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowInstallGuide(false);
                  }}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now (1-Tap Prompt)</span>
                </button>
              )}

              {isInIframe && (
                <button
                  onClick={() => openInExternalBrowser(window.location.href)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 shadow-md cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-teal-400" />
                  <span>Open in {isAndroid ? 'Chrome' : isIOS ? 'Safari' : 'Browser'} to Install</span>
                </button>
              )}

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
                {isIOS ? (
                  <>
                    <div className="font-bold text-teal-400 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4" />
                      <span>iPhone / iPad (Safari) Installation</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                      <li>Open this link in <strong className="text-white">Safari</strong>.</li>
                      <li>Tap the <strong className="text-white">Share</strong> button in the bottom toolbar.</li>
                      <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</li>
                      <li>Tap <strong className="text-white">Add</strong>. ChatTime is installed on your Home screen!</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-red-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>Android (Google Chrome) Installation</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                      <li>Open in <strong className="text-white">Google Chrome</strong>.</li>
                      <li>Tap Chrome menu <MoreVertical className="w-3.5 h-3.5 inline text-red-400" /> (three dots) at the top-right.</li>
                      <li>Tap <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.</li>
                      <li>Android will install the official app to your app drawer and home screen.</li>
                    </ol>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
};
