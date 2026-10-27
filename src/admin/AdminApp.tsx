import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  Phone,
  Radio,
  CheckCircle,
  Ban,
  Search,
  ShieldCheck,
  Crown,
  Key,
  Trash2,
  Download,
  Power,
  RotateCcw,
  Sparkles,
  FileText,
  Activity,
  UserX,
  AlertCircle,
  Volume2,
  Lock,
  Unlock,
  LogOut,
  UserCheck,
  UserPlus,
  Sliders,
  Server,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Eye,
  Check,
  X,
  Send,
  Calendar,
  Clock,
  Compass,
  Menu,
  Bot,
  Headphones,
  Zap,
} from 'lucide-react';
import { User, Chat, PlatformFeatureSettings, AdminRole, AdminPermission, AdminAuditLog, AccountBoundingDetails } from '../types';
import { formatTime, formatLastSeen } from '../utils/formatters';
import { VerifiedBadge } from '../components/common/VerifiedBadge';
import { AccountBoundingModal } from '../components/admin/AccountBoundingModal';
import { buildApiUrl } from '../utils/apiConfig';

const getStoredAdminToken = (): string => {
  try {
    return (
      sessionStorage.getItem('chattime_admin_token') ||
      localStorage.getItem('chattime_admin_token') ||
      ''
    );
  } catch {
    return '';
  }
};

const adminFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const token = getStoredAdminToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-admin-token', token);
  }
  const resolvedUrl = typeof input === 'string' ? buildApiUrl(input) : input;
  return fetch(resolvedUrl, {
    ...init,
    credentials: 'include',
    headers,
  });
};

export const AdminApp: React.FC = () => {
  // Admin Authentication State
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form state
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'moderation' | 'calls' | 'voice_ai' | 'features' | 'admins' | 'audit' | 'system' | 'support'
  >('overview');

  // Voice AI Admin Configuration & Subscription State
  const [voiceAdminConfig, setVoiceAdminConfig] = useState<any>({
    provider: 'web_audio_dsp_gemini_tts',
    liveEngineEnabled: true,
    ttsEngineEnabled: true,
    weeklyPriceNgn: 1000,
    monthlyPriceNgn: 6000,
    yearlyPriceNgn: 20000,
    freeTierAllowedEffects: ['original'],
    krispRtcLicensingInfo: 'Integrated WebRTC Low-Latency Formant DSP with Krisp RTC audio pipeline compatibility. Zero-latency client-side Web Audio synthesis.',
    regionalVoices: [],
  });
  const [voiceAiStats, setVoiceAiStats] = useState<any>(null);
  const [voiceSubscriptionsList, setVoiceSubscriptionsList] = useState<any[]>([]);
  const [isSavingVoiceConfig, setIsSavingVoiceConfig] = useState(false);
  const [grantSubUserId, setGrantSubUserId] = useState('');
  const [grantSubTier, setGrantSubTier] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isGrantingSub, setIsGrantingSub] = useState(false);

  const [welcomeConfig, setWelcomeConfig] = useState({
    enabled: true,
    senderName: 'ChatTime Support',
    senderAvatar: '/icon.svg',
    messageText: 'Hello! Welcome to ChatTime Business. We are delighted to have you. If you need any assistance, have questions, or want to explore features, reply here anytime. End-to-end encrypted support is available 24/7.',
    senderId: 'user_chattime_support',
  });
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);
  const [newSysName, setNewSysName] = useState('');
  const [newSysUsername, setNewSysUsername] = useState('');
  const [newSysBio, setNewSysBio] = useState('');
  const [newSysBadge, setNewSysBadge] = useState<'red' | 'blue'>('red');
  const [isCreatingSysAccount, setIsCreatingSysAccount] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AdminAuditLog[]>([]);
  const [platformFeatures, setPlatformFeatures] = useState<PlatformFeatureSettings>({
    allowRegistration: true,
    allowMessaging: true,
    allowCalls: true,
    allowVideoCalls: true,
    allowGroupCalls: true,
    allowGroups: true,
    allowCommunities: true,
    allowVoiceNotes: true,
    allowVoiceChanger: true,
    allowFileSharing: true,
    allowMediaSharing: true,
    allowReactions: true,
    allowStories: true,
    allowNotifications: true,
    voiceEffectsEnabled: true,
    voiceModifiers: ['American 🇺🇸', 'British 🇬🇧', 'Indian 🇮🇳', 'Asian 🌏', 'Australian 🇦🇺', 'Jamaican 🇯🇲'],
  });
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemUptime, setSystemUptime] = useState<number>(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Filters & Modals
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'online' | 'bounded' | 'admins' | 'verified'>('all');
  const [boundingModalUser, setBoundingModalUser] = useState<User | null>(null);
  const [isBoundingModalOpen, setIsBoundingModalOpen] = useState(false);

  // PIN Reset Modal
  const [pinResetUser, setPinResetUser] = useState<User | null>(null);
  const [customPinInput, setCustomPinInput] = useState('');

  // Delete User Confirmation
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  // New Admin Creation Modal
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('admin');

  // Broadcast state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<{ title: string; text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (title: string, text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ title, text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Check current admin session on mount
  useEffect(() => {
    adminFetch('/api/admin/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setAdminUser(data.user);
          setAdminPermissions(data.permissions || []);
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // 2. Fetch admin data when logged in
  const fetchAdminData = async () => {
    try {
      const [resUsers, resAnalytics, resReports, resLogs] = await Promise.all([
        adminFetch('/api/admin/users').then((r) => (r.ok ? r.json() : [])),
        adminFetch('/api/admin/analytics').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/admin/reports').then((r) => (r.ok ? r.json() : [])),
        adminFetch('/api/admin/audit-logs').then((r) => (r.ok ? r.json() : [])),
      ]);

      if (Array.isArray(resUsers)) setUsersList(resUsers);
      if (resAnalytics) {
        setAnalyticsData(resAnalytics);
        if (resAnalytics.overview) {
          setMaintenanceMode(Boolean(resAnalytics.overview.maintenanceMode));
        }
        if (resAnalytics.systemHealth?.uptimeSeconds) {
          setSystemUptime(resAnalytics.systemHealth.uptimeSeconds);
        }
      }
      if (Array.isArray(resReports)) setReportsList(resReports);
      if (Array.isArray(resLogs)) setAuditLogsList(resLogs);

      // Fetch features
      const resFeatures = await adminFetch('/api/admin/platform-features');
      if (resFeatures.ok) {
        const feat = await resFeatures.json();
        if (feat.features) setPlatformFeatures(feat.features);
      }

      // Fetch Voice AI config & subscriptions
      fetchVoiceAdminData();
    } catch (err) {
      console.error('[Admin] Error loading dashboard data:', err);
    }
  };

  const fetchVoiceAdminData = async () => {
    try {
      const res = await adminFetch('/api/admin/voice-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setVoiceAdminConfig(data.config);
        if (data.stats) setVoiceAiStats(data.stats);
        if (data.subscriptions) setVoiceSubscriptionsList(data.subscriptions);
      }
    } catch (err) {
      console.error('[Admin] Error loading voice AI data:', err);
    }
  };

  const handleSaveVoiceConfig = async (newConfig: any) => {
    setIsSavingVoiceConfig(true);
    try {
      const res = await adminFetch('/api/admin/voice-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });
      if (res.ok) {
        setVoiceAdminConfig(newConfig);
        showToast('Voice Settings Saved', 'Voice AI parameters and pricing updated successfully.', 'success');
        fetchVoiceAdminData();
      } else {
        showToast('Save Failed', 'Could not update voice settings.', 'error');
      }
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to save configuration.', 'error');
    } finally {
      setIsSavingVoiceConfig(false);
    }
  };

  const handleGrantVoiceSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantSubUserId.trim()) return;
    setIsGrantingSub(true);
    try {
      const res = await adminFetch('/api/admin/voice-subscriptions/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdOrEmail: grantSubUserId.trim(),
          plan: grantSubTier,
          grantedBy: adminUser?.name || 'Administrator',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Subscription Granted', `Voice Premium activated for ${grantSubUserId}.`, 'success');
        setGrantSubUserId('');
        fetchVoiceAdminData();
      } else {
        showToast('Failed to Grant', data.error || 'User not found.', 'error');
      }
    } catch (e: any) {
      showToast('Error', e.message || 'Operation failed.', 'error');
    } finally {
      setIsGrantingSub(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchAdminData();
      const interval = setInterval(fetchAdminData, 15000);
      return () => clearInterval(interval);
    }
  }, [adminUser?.id]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    try {
      const res = await adminFetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierInput.trim(),
          password: passwordInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      if (data.token) {
        try {
          sessionStorage.setItem('chattime_admin_token', data.token);
          localStorage.setItem('chattime_admin_token', data.token);
        } catch {}
      }

      setAdminUser(data.user);
      setAdminPermissions(data.permissions || []);
      showToast('Admin Authenticated', `Welcome back, ${data.user.name} (${data.role.toUpperCase()})`, 'success');
    } catch {
      setLoginError('Network failure. Could not connect to administration service.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {}
    try {
      sessionStorage.removeItem('chattime_admin_token');
      localStorage.removeItem('chattime_admin_token');
    } catch {}
    setAdminUser(null);
    setAdminPermissions([]);
    showToast('Signed Out', 'Administrative session terminated.', 'info');
  };

  // Permissions helper
  const hasPerm = (perm: AdminPermission): boolean => {
    if (!adminUser) return false;
    if (adminUser.role === 'super_admin' || adminUser.email === 'prosperikeokwu@gmail.com' || adminUser.email === 'fastexpressdeliveryservices00@gmail.com') return true;
    return adminPermissions.includes(perm);
  };

  // User Actions
  const handleToggleVerify = async (userId: string, badgeType: 'red' | 'blue' | 'none') => {
    if (!hasPerm('manage_verifications')) {
      showToast('Permission Denied', 'Your role cannot alter verification badges.', 'error');
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser?.id,
          isVerified: badgeType !== 'none',
          badgeType,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        showToast('Verification Updated', `Badge status updated to ${badgeType}.`, 'success');
      }
    } catch {
      showToast('Update Failed', 'Could not update verification.', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: AdminRole | 'user') => {
    if (!hasPerm('manage_roles')) {
      showToast('Permission Denied', 'Only Super Admin can reassign platform roles.', 'error');
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser?.id,
          role: newRole,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        showToast('Role Updated', `User role changed to ${newRole.toUpperCase()}.`, 'success');
      } else {
        const err = await res.json();
        showToast('Role Update Failed', err.error || 'Failed.', 'error');
      }
    } catch {
      showToast('Error', 'Could not update role.', 'error');
    }
  };

  const handleResetPin = async (userId: string, newPin: string) => {
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin, adminName: adminUser?.name }),
      });
      if (res.ok) {
        showToast('PIN Reset', `Security PIN successfully updated.`, 'success');
        setPinResetUser(null);
        setCustomPinInput('');
        fetchAdminData();
      }
    } catch {
      showToast('Error', 'Failed to reset PIN.', 'error');
    }
  };

  const handleTerminateSessions = async (userId: string) => {
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/terminate-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: adminUser?.name }),
      });
      if (res.ok) {
        showToast('Sessions Terminated', 'All remote sessions revoked for user.', 'success');
        fetchAdminData();
      }
    } catch {
      showToast('Error', 'Failed to terminate sessions.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!hasPerm('manage_users')) {
      showToast('Permission Denied', 'Insufficient permissions.', 'error');
      return;
    }
    try {
      const res = await adminFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName: adminUser?.name }),
      });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        setDeleteTargetUser(null);
        showToast('User Deleted', 'Account permanently removed.', 'success');
      }
    } catch {
      showToast('Error', 'Failed to delete user.', 'error');
    }
  };

  // Feature Flag Toggle
  const handleToggleFeature = async (key: keyof PlatformFeatureSettings) => {
    if (!hasPerm('manage_features')) {
      showToast('Permission Denied', 'Only Super Admin can configure platform feature flags.', 'error');
      return;
    }
    const nextVal = !platformFeatures[key];
    const newFeatures = { ...platformFeatures, [key]: nextVal };
    setPlatformFeatures(newFeatures);

    try {
      const res = await adminFetch('/api/admin/platform-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser?.id,
          updates: { [key]: nextVal },
        }),
      });
      if (res.ok) {
        showToast('Feature Flag Updated', `${key} is now ${nextVal ? 'ENABLED' : 'DISABLED'}.`, 'success');
      }
    } catch {
      showToast('Error', 'Failed to save feature flag.', 'error');
    }
  };

  // Maintenance Mode Toggle
  const handleToggleMaintenance = async () => {
    if (!hasPerm('system_settings')) {
      showToast('Permission Denied', 'Only Super Admin can toggle maintenance mode.', 'error');
      return;
    }
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    try {
      await adminFetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState, adminName: adminUser?.name }),
      });
      showToast(
        'Maintenance Mode',
        nextState ? 'Maintenance mode is now ACTIVE.' : 'Maintenance mode DEACTIVATED.',
        nextState ? 'error' : 'success'
      );
    } catch {
      showToast('Error', 'Failed to update maintenance mode.', 'error');
    }
  };

  // Broadcast announcement
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    try {
      const res = await adminFetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          priority: announcementPriority,
          author: adminUser?.name || 'Super Admin',
        }),
      });
      if (res.ok) {
        setBroadcastSent(true);
        setTimeout(() => setBroadcastSent(false), 3000);
        setAnnouncementTitle('');
        setAnnouncementContent('');
        showToast('Announcement Dispatched', 'Real-time alert pushed to all connected clients.', 'success');
      }
    } catch {
      showToast('Error', 'Failed to dispatch broadcast.', 'error');
    }
  };

  // Create new staff admin
  const handleCreateAdminStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPerm('manage_admins')) {
      showToast('Permission Denied', 'Only Super Admin can appoint staff administrators.', 'error');
      return;
    }
    try {
      const res = await adminFetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser?.id,
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          username: newAdminUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
          role: newAdminRole,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setUsersList((prev) => [created.user, ...prev]);
        setIsCreateAdminOpen(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminUsername('');
        showToast('Administrator Created', `${created.user.name} added as ${newAdminRole.toUpperCase()}.`, 'success');
      } else {
        const err = await res.json();
        showToast('Creation Failed', err.error || 'Failed.', 'error');
      }
    } catch {
      showToast('Error', 'Failed to create administrator account.', 'error');
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.phoneNumber && u.phoneNumber.includes(q)) ||
      (u.chatTimeNumber && u.chatTimeNumber.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (userFilter === 'online') return u.isOnline;
    if (userFilter === 'bounded') return u.isBounded || u.isBanned;
    if (userFilter === 'admins') return ['super_admin', 'admin', 'moderator', 'support', 'analyst'].includes(u.role);
    if (userFilter === 'verified') return u.isVerified;
    return true;
  });

  // -------------------------------------------------------------
  // RENDER: LOADING STATE
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6 select-none font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div className="text-sm font-bold tracking-wide">Connecting to Administration Gateway...</div>
        <div className="text-xs text-slate-500 mt-1">Verifying cryptographic session signature</div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SEPARATE DEDICATED ADMIN LOGIN SCREEN
  // -------------------------------------------------------------
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-8 select-none font-sans text-slate-100 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-md shadow-red-600/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wide uppercase text-white font-mono">ChatTime Ops</div>
              <div className="text-[10px] text-slate-400">Enterprise Administration Platform</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400">Gateway Online</span>
          </div>
        </header>

        {/* Center Login Form */}
        <main className="w-full max-w-md mx-auto my-auto z-10 py-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center mx-auto mb-3 text-red-400 shadow-inner">
                <Crown className="w-7 h-7 text-amber-400" />
              </div>
              <h1 className="text-xl font-extrabold text-white">Administrator Access</h1>
              <p className="text-xs text-slate-400 mt-1">
                Authorized platform operators only. Public access is forbidden.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Official Administrator Credentials Reference */}
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-xs space-y-1.5 shadow-sm">
              <div className="font-bold flex items-center gap-1.5 text-amber-400">
                <Crown className="w-3.5 h-3.5" /> Official Platform Admin Credentials
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                <div>Admin Code: <strong className="text-amber-300 font-bold text-xs">0814</strong> (or <span className="text-teal-400">fastexpressdeliveryservices00@gmail.com</span>)</div>
                <div>Password: <strong className="text-amber-300 font-bold text-xs">prosper100@</strong></div>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Admin Login Code / Email / Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="Enter code: 0814 or email"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="prosper100@"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmittingLogin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authenticate into Admin Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col items-center gap-2 text-center">
              <a
                href="/"
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>&larr; Switch to Customer ChatTime App (app.chattimeapp.name.ng)</span>
              </a>
              <p className="text-[11px] text-slate-500">
                All admin sessions are verified with server-side RBAC and recorded in audit logs.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-600 z-10">
          ChatTime Administration Gateway • Isolated Infrastructure • All Rights Reserved
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SUPER ADMIN ENTERPRISE DASHBOARD
  // -------------------------------------------------------------
  const overviewStats = analyticsData?.overview || {};
  const isSuper = adminUser.role === 'super_admin' || adminUser.email === 'prosperikeokwu@gmail.com' || adminUser.email === 'fastexpressdeliveryservices00@gmail.com';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans select-none">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />}
            <div>
              <div className="font-bold">{toastMessage.title}</div>
              <div className="text-[11px] opacity-80">{toastMessage.text}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modern SaaS Admin Navigation Sidebar */}
      <aside
        className={`${
          isMobileNavOpen ? 'flex' : 'hidden'
        } md:flex fixed md:static inset-0 md:inset-auto z-40 w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 overflow-y-auto`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-md shadow-red-600/30">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white tracking-wide font-mono">ChatTime Admin</div>
                <div className="text-[10px] text-slate-400">Master Operations Portal</div>
              </div>
            </div>
            <button
              onClick={() => setIsMobileNavOpen(false)}
              className="md:hidden w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Platform Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>User Management</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('moderation')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'moderation'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Moderation & Reports</span>
              </div>
              {reportsList.filter((r) => r.status === 'pending').length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                  {reportsList.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Call Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('voice_ai')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'voice_ai'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Voice Studio & AI Engine</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                DSP & TTS
              </span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'features'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Feature Flags (RBAC)</span>
            </button>

            {isSuper && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Staff & Admin Roles</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Immutable Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>System & Broadcast</span>
            </button>
          </nav>
        </div>

        {/* Admin User Profile & Sign Out Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <a
            href="/"
            className="w-full flex items-center justify-center gap-2 mb-3 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-teal-400 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
            title="Launch Customer Facing ChatTime App"
          >
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>Customer App</span>
          </a>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={adminUser.avatar}
                alt={adminUser.name}
                className="w-8 h-8 rounded-xl object-cover bg-slate-800 border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{adminUser.name}</span>
                  <VerifiedBadge user={adminUser} size="xs" />
                </div>
                <div className="text-[10px] text-amber-400 font-mono uppercase font-semibold">
                  {adminUser.role.replace('_', ' ')}
                </div>
              </div>
            </div>

            <button
              onClick={handleAdminLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Terminate Admin Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Viewport */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-slate-950">
        {/* Top Header Controls Bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer shrink-0"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="text-xs sm:text-base font-bold text-white uppercase tracking-wider font-mono truncate">
              {activeTab === 'overview' && 'Platform Overview'}
              {activeTab === 'users' && 'User Directory'}
              {activeTab === 'moderation' && 'Moderation Queue'}
              {activeTab === 'calls' && 'Calling Telemetry'}
              {activeTab === 'features' && 'Feature Flags'}
              {activeTab === 'admins' && 'Staff & RBAC'}
              {activeTab === 'audit' && 'Security Audit Logs'}
              {activeTab === 'system' && 'System Health'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
              <span>Refresh</span>
            </button>

            {maintenanceMode && (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
                Maintenance Mode Active
              </span>
            )}
          </div>
        </header>

        {/* Tab Content Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: PLATFORM OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Users className="w-4 h-4 text-teal-400" /> Total Accounts
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{overviewStats.totalUsers || 0}</div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Real database records
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Activity className="w-4 h-4 text-emerald-400" /> Online Users Now
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {overviewStats.onlineUsers || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    DAU: {overviewStats.dailyActiveUsers || 0} • MAU: {overviewStats.monthlyActiveUsers || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-4 h-4 text-sky-400" /> Messages Sent
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {overviewStats.totalMessages || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Text: {overviewStats.textMessages || 0} • Voice Notes: {overviewStats.voiceNotes || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                    <Phone className="w-4 h-4 text-indigo-400" /> Call Minutes
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {(overviewStats.voiceMinutes || 0) + (overviewStats.videoMinutes || 0)} min
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Voice: {overviewStats.voiceMinutes || 0}m • Video: {overviewStats.videoMinutes || 0}m
                  </div>
                </div>
              </div>

              {/* Service Health & Infrastructure Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-teal-400" /> Service Infrastructure
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                      <span className="text-slate-400">Core REST API</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Online (Express)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                      <span className="text-slate-400">Real-time WebSocket</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Operational
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                      <span className="text-slate-400">Persistent Storage</span>
                      <span className="text-slate-200 font-mono">
                        {analyticsData?.systemHealth?.storageUsage || 'Connected'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> Trust & Safety Status
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                      <span className="text-slate-400">Pending Abuse Reports</span>
                      <span className="text-rose-400 font-bold">{overviewStats.pendingReports || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                      <span className="text-slate-400">Bounded / Suspended Users</span>
                      <span className="text-amber-400 font-bold">{overviewStats.suspendedUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950">
                      <span className="text-slate-400">Officially Verified Badges</span>
                      <span className="text-sky-400 font-bold">{overviewStats.verifiedUsers || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-red-400" /> Encryption & Privacy
                  </h3>
                  <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-300 leading-relaxed">
                    ChatTime customer communications are end-to-end encrypted like WhatsApp. Administrative tools operate strictly through metadata, account authorities, and trust policies without backdoors.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: USER DIRECTORY & MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name, @handle, phone, email..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  {(['all', 'online', 'bounded', 'admins', 'verified'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setUserFilter(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        userFilter === f
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Data Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">ChatTime Number</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Badge (Admin)</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            No users match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-xl object-cover bg-slate-800 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-white flex items-center gap-1.5 truncate">
                                    <span>{u.name}</span>
                                    <VerifiedBadge user={u} size="xs" />
                                  </div>
                                  <div className="text-[11px] text-teal-400 font-mono">@{u.username}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono text-slate-300">
                              {u.phoneNumber || u.chatTimeNumber}
                            </td>

                            <td className="py-3 px-4">
                              {u.isBanned ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                  Banned
                                </span>
                              ) : u.isBounded ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  Suspended
                                </span>
                              ) : u.isOnline ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  Online
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">
                                  {formatLastSeen(u.lastSeen)}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold border ${
                                  u.role === 'super_admin' || u.role === 'admin'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : u.role === 'moderator'
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                    : u.role === 'support'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : u.role === 'analyst'
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVerify(u.id, 'red')}
                                  className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                                    u.isVerified && (u.isRedVerified || u.verificationBadge === 'red')
                                      ? 'bg-rose-500/30 border-rose-500 text-rose-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-rose-400'
                                  }`}
                                  title="Assign Red Verified Tick"
                                >
                                  <VerifiedBadge type="red" size="xs" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVerify(u.id, 'blue')}
                                  className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                                    u.isVerified && !(u.isRedVerified || u.verificationBadge === 'red')
                                      ? 'bg-sky-500/30 border-sky-500 text-sky-300'
                                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-sky-400'
                                  }`}
                                  title="Assign Blue Verified Tick"
                                >
                                  <VerifiedBadge type="blue" size="xs" />
                                </button>
                                {u.isVerified && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVerify(u.id, 'none')}
                                    className="p-1 rounded-lg bg-slate-950 text-slate-500 hover:text-white"
                                    title="Revoke Verification"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setBoundingModalUser(u);
                                    setIsBoundingModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
                                  title="Suspend / Restrict Account"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setPinResetUser(u);
                                    setCustomPinInput('');
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 cursor-pointer"
                                  title="Reset PIN"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleTerminateSessions(u.id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                  title="Terminate Remote Sessions"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                                {isSuper && (
                                  <button
                                    onClick={() => setDeleteTargetUser(u)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                                    title="Permanently Delete Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: MODERATION & ABUSE REPORTS */}
          {/* ======================================================== */}
          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-2">Abuse & Safety Reports Queue</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Incoming user reports regarding harassment, impersonation, or platform abuse.
                </p>

                {reportsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl">
                    No open reports at this time.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportsList.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{r.reason}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {r.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Reported by @{r.reporterUsername} against @{r.targetUsername}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await adminFetch(`/api/admin/reports/${r.id}/resolve`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ adminName: adminUser.name }),
                              });
                              showToast('Report Resolved', 'Report closed.', 'success');
                              fetchAdminData();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CALL TELEMETRY & MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Live Active Calls
                  </div>
                  <div className="text-3xl font-bold text-emerald-400 font-mono">
                    {analyticsData?.systemHealth?.activeCallsCount || 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">WebSocket audio/video mesh</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Voice Minutes
                  </div>
                  <div className="text-3xl font-bold text-white font-mono">
                    {overviewStats.voiceMinutes || 0}m
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">High fidelity Opus codec</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Video Minutes
                  </div>
                  <div className="text-3xl font-bold text-indigo-400 font-mono">
                    {overviewStats.videoMinutes || 0}m
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">H.264 / VP8 encrypted video</div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: MASTER FEATURE FLAGS */}
          {/* ======================================================== */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Dynamic Platform Feature Flags</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Toggle capabilities instantly without redeploying code. Customer apps gracefully disable inactive features.
                    </p>
                  </div>
                </div>

                {/* Quick Presets / Disable Controls */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> Quick Disable & Kill Switches
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Live Server Propagation</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const updates = { allowCalls: false, allowVideoCalls: false, allowGroupCalls: false };
                        setPlatformFeatures((prev) => ({ ...prev, ...updates }));
                        await adminFetch('/api/admin/platform-features', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: adminUser?.id, updates }),
                        });
                        showToast('Calls Disabled', 'All voice, video, and group calling disabled across platform.', 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer transition-all"
                    >
                      Disable All Calls
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const updates = { allowVideoCalls: !platformFeatures.allowVideoCalls };
                        setPlatformFeatures((prev) => ({ ...prev, ...updates }));
                        await adminFetch('/api/admin/platform-features', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: adminUser?.id, updates }),
                        });
                        showToast('Video Calls', `Video calling ${updates.allowVideoCalls ? 'enabled' : 'disabled'}.`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold cursor-pointer transition-all"
                    >
                      {platformFeatures.allowVideoCalls ? 'Disable Video Calls' : 'Enable Video Calls'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const updates = { allowVoiceNotes: !platformFeatures.allowVoiceNotes };
                        setPlatformFeatures((prev) => ({ ...prev, ...updates }));
                        await adminFetch('/api/admin/platform-features', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: adminUser?.id, updates }),
                        });
                        showToast('Voice Notes', `Voice note recording ${updates.allowVoiceNotes ? 'enabled' : 'disabled'}.`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer transition-all"
                    >
                      {platformFeatures.allowVoiceNotes ? 'Disable Voice Notes' : 'Enable Voice Notes'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const updates = { allowRegistration: !platformFeatures.allowRegistration };
                        setPlatformFeatures((prev) => ({ ...prev, ...updates }));
                        await adminFetch('/api/admin/platform-features', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: adminUser?.id, updates }),
                        });
                        showToast('Registration', `New user registration ${updates.allowRegistration ? 'opened' : 'closed'}.`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-bold cursor-pointer transition-all"
                    >
                      {platformFeatures.allowRegistration ? 'Disable Registration' : 'Enable Registration'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const updates = { allowFileSharing: false, allowMediaSharing: false };
                        setPlatformFeatures((prev) => ({ ...prev, ...updates }));
                        await adminFetch('/api/admin/platform-features', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: adminUser?.id, updates }),
                        });
                        showToast('Uploads Disabled', 'File and photo uploads disabled across platform.', 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer transition-all"
                    >
                      Disable File/Media Uploads
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const updates = { maintenanceMode: !platformFeatures.maintenanceMode };
                        setPlatformFeatures((prev) => ({ ...prev, ...updates }));
                        await adminFetch('/api/admin/platform-features', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: adminUser?.id, updates }),
                        });
                        showToast(
                          'Maintenance Mode',
                          updates.maintenanceMode ? 'Maintenance mode ACTIVATED.' : 'Maintenance mode deactivated.',
                          updates.maintenanceMode ? 'info' : 'success'
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                        platformFeatures.maintenanceMode
                          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {platformFeatures.maintenanceMode ? 'Deactivate Maintenance Mode' : 'Activate Maintenance Mode'}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const updates = {
                          allowRegistration: true,
                          allowMessaging: true,
                          allowCalls: true,
                          allowVideoCalls: true,
                          allowGroupCalls: true,
                          allowGroups: true,
                          allowCommunities: true,
                          allowVoiceNotes: true,
                          allowVoiceChanger: true,
                          allowFileSharing: true,
                          allowMediaSharing: true,
                          allowReactions: true,
                          allowStories: true,
                          allowNotifications: true,
                          maintenanceMode: false,
                        };
                        setPlatformFeatures((prev) => ({ ...prev, ...updates }));
                        await adminFetch('/api/admin/platform-features', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminId: adminUser?.id, updates }),
                        });
                        showToast('All Features Enabled', 'All platform capabilities are fully active.', 'success');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer transition-all ml-auto"
                    >
                      Enable All Features
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'allowMessaging' as const, label: 'Instant Messaging', desc: 'Permit direct and group chat messages.', category: 'Messaging' },
                    { key: 'allowVoiceNotes' as const, label: 'Voice Notes & Audio Recording', desc: 'Permit users to record and send audio voice notes.', category: 'Messaging' },
                    { key: 'allowCalls' as const, label: 'Voice Calling', desc: 'Enable 1-to-1 WebRTC encrypted voice calls.', category: 'Calling' },
                    { key: 'allowVideoCalls' as const, label: 'Video Calling', desc: 'Enable camera streaming and video calls.', category: 'Calling' },
                    { key: 'allowGroupCalls' as const, label: 'Group Calls & Rooms', desc: 'Allow multi-participant audio/video rooms.', category: 'Calling' },
                    { key: 'allowRegistration' as const, label: 'New User Registration', desc: 'Allow new accounts to sign up on ChatTime.', category: 'Access' },
                    { key: 'allowGroups' as const, label: 'Group Chat Creation', desc: 'Allow users to create new group conversations.', category: 'Social' },
                    { key: 'allowCommunities' as const, label: 'Communities & Channels', desc: 'Allow public channels and broadcast communities.', category: 'Social' },
                    { key: 'allowStories' as const, label: 'Status & Stories', desc: 'Permit 24-hour encrypted status updates.', category: 'Social' },
                    { key: 'allowFileSharing' as const, label: 'File Sharing', desc: 'Allow PDF, DOC, and zip file attachments.', category: 'Media' },
                    { key: 'allowMediaSharing' as const, label: 'Media Sharing', desc: 'Allow photo and video gallery uploads.', category: 'Media' },
                    { key: 'allowVoiceChanger' as const, label: 'Voice Modifier AI', desc: 'Allow audio voice modulation and accents.', category: 'Media' },
                    { key: 'allowReactions' as const, label: 'Message Reactions', desc: 'Allow emoji reactions on messages.', category: 'Messaging' },
                    { key: 'allowNotifications' as const, label: 'Push Notifications', desc: 'Deliver instant web push alerts and notifications.', category: 'Access' },
                  ].map((f) => {
                    const isEnabled = Boolean(platformFeatures[f.key]);
                    return (
                      <div
                        key={f.key}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{f.label}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              {f.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{f.desc}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFeature(f.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                            isEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: STAFF ADMINISTRATORS & RBAC */}
          {/* ======================================================== */}
          {activeTab === 'admins' && isSuper && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Staff Management & Role Delegation</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Super Admin can create, promote, demote, or terminate staff accounts.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateAdminOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Administrator</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Admin Member</th>
                      <th className="py-3 px-4">Contact / Email</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4 text-right">Role Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersList
                      .filter((u) => ['super_admin', 'admin', 'moderator', 'support', 'analyst'].includes(u.role))
                      .map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={staff.avatar}
                                alt={staff.name}
                                className="w-8 h-8 rounded-xl object-cover bg-slate-800"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{staff.name}</span>
                                  <VerifiedBadge user={staff} size="xs" />
                                </div>
                                <div className="text-[11px] text-teal-400 font-mono">@{staff.username}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {staff.email || staff.phoneNumber || staff.chatTimeNumber}
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {staff.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <select
                              value={staff.role}
                              onChange={(e) => handleUpdateRole(staff.id, e.target.value as AdminRole)}
                              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="admin">Admin</option>
                              <option value="moderator">Moderator</option>
                              <option value="support">Support</option>
                              <option value="analyst">Analyst</option>
                              <option value="user">Demote to Regular User</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: IMMUTABLE AUDIT LOGS */}
          {/* ======================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Immutable Administrative Audit Log</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Every administrative action, credential change, and policy adjustment is logged.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Operator</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Target</th>
                        <th className="py-2.5 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      {auditLogsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            No audit events logged yet.
                          </td>
                        </tr>
                      ) : (
                        auditLogsList.slice(0, 50).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-slate-400">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 text-teal-400">{log.adminName}</td>
                            <td className="py-2.5 px-3 text-amber-400 font-bold">{log.action}</td>
                            <td className="py-2.5 px-3 text-slate-300">{log.targetName || log.targetId || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{log.details || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: VOICE STUDIO & AI ENGINE CONTROL CENTER */}
          {/* ======================================================== */}
          {activeTab === 'voice_ai' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                    <Volume2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">Voice Studio & AI Engine Operations</h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                        Online
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                      Configure real-time WebRTC audio DSP filters, Krisp RTC pipeline compatibility, Google GenAI Text-to-Speech synthesis, and Voice Premium subscription pricing.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchVoiceAdminData}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Stats</span>
                  </button>
                </div>
              </div>

              {/* Usage & Cost Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TTS Syntheses</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">
                    {voiceAiStats?.totalSyntheses || 0}
                  </div>
                  <div className="text-[10px] text-teal-400 mt-1">Google GenAI Flash TTS</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chars Synthesized</div>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {(voiceAiStats?.totalCharacters || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Input text processed</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Cost</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    ₦{voiceAiStats?.estimatedCostNgn || 0}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 mt-1">~${voiceAiStats?.estimatedCostUsd || '0.000'} USD</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Subscribers</div>
                  <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                    {voiceSubscriptionsList.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Voice Premium users</div>
                </div>
              </div>

              {/* Engine Provider & Subscription Pricing Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Engine Configuration */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Audio Engine Architecture</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-white">Live Call Voice Changer (DSP)</div>
                        <div className="text-[11px] text-slate-400">Zero-latency Web Audio Formant Filters during calls</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveVoiceConfig({
                            ...voiceAdminConfig,
                            liveEngineEnabled: !voiceAdminConfig.liveEngineEnabled,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          voiceAdminConfig.liveEngineEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {voiceAdminConfig.liveEngineEnabled ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-white">AI Speech Synthesis (TTS)</div>
                        <div className="text-[11px] text-slate-400">Google GenAI 24kHz Studio Speech Engine</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveVoiceConfig({
                            ...voiceAdminConfig,
                            ttsEngineEnabled: !voiceAdminConfig.ttsEngineEnabled,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          voiceAdminConfig.ttsEngineEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {voiceAdminConfig.ttsEngineEnabled ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div className="text-xs font-bold text-slate-300">Krisp RTC SDK & Web Audio Compatibility:</div>
                      <p className="leading-relaxed">
                        Live audio processing operates client-side through high-order parametric biquad filters and phase-vocoder DSP nodes (&lt; 15ms latency), ensuring pristine microphone clarity without network delays. Asynchronous voice notes use backend Google GenAI synthesis.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subscription Pricing Configuration */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Voice Premium Pricing (NGN ₦)</h3>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveVoiceConfig(voiceAdminConfig);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Weekly Plan (7 Days)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
                        <input
                          type="number"
                          value={voiceAdminConfig.weeklyPriceNgn}
                          onChange={(e) =>
                            setVoiceAdminConfig({ ...voiceAdminConfig, weeklyPriceNgn: Number(e.target.value) })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Monthly Plan (30 Days)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
                        <input
                          type="number"
                          value={voiceAdminConfig.monthlyPriceNgn}
                          onChange={(e) =>
                            setVoiceAdminConfig({ ...voiceAdminConfig, monthlyPriceNgn: Number(e.target.value) })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Yearly Plan (365 Days)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
                        <input
                          type="number"
                          value={voiceAdminConfig.yearlyPriceNgn}
                          onChange={(e) =>
                            setVoiceAdminConfig({ ...voiceAdminConfig, yearlyPriceNgn: Number(e.target.value) })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingVoiceConfig}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSavingVoiceConfig ? 'Saving Pricing...' : 'Save Voice AI Pricing'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Grant Premium Subscription to User */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <UserPlus className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm font-bold text-white">Grant VIP Voice Premium Subscription</h3>
                </div>

                <form onSubmit={handleGrantVoiceSubscription} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={grantSubUserId}
                      onChange={(e) => setGrantSubUserId(e.target.value)}
                      placeholder="Enter User ID, Email (e.g. user_xxx or name@gmail.com)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <select
                      value={grantSubTier}
                      onChange={(e) => setGrantSubTier(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                    >
                      <option value="weekly">Weekly (7 Days)</option>
                      <option value="monthly">Monthly (30 Days)</option>
                      <option value="yearly">Yearly (365 Days)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isGrantingSub || !grantSubUserId.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isGrantingSub ? 'Granting...' : 'Grant VIP Access'}
                  </button>
                </form>

                {/* Subscriptions Table */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden mt-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Subscriber</th>
                        <th className="py-2.5 px-3">Plan</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Expires At</th>
                        <th className="py-2.5 px-3">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {voiceSubscriptionsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">
                            No custom subscribers registered yet. Administrators have permanent automatic VIP bypass.
                          </td>
                        </tr>
                      ) : (
                        voiceSubscriptionsList.map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-bold text-white">{sub.userId}</td>
                            <td className="py-2.5 px-3 capitalize text-amber-300">{sub.plan}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {new Date(sub.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">₦{sub.amountPaidNgn}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Supported Regional Voice Styles Catalog */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Supported Regional Voice Styles (12 Accents)</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Real-time Formant DSP + Gemini 3.8 Flash TTS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'en-US', name: 'American English', flag: '🇺🇸', tier: 'Free', tts: 'Puck' },
                    { id: 'en-GB', name: 'British English', flag: '🇬🇧', tier: 'Premium', tts: 'Charon' },
                    { id: 'en-SCT', name: 'Scottish English', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', tier: 'Premium', tts: 'Fenrir' },
                    { id: 'en-AU', name: 'Australian English', flag: '🇦🇺', tier: 'Premium', tts: 'Kore' },
                    { id: 'en-CA', name: 'Canadian English', flag: '🇨🇦', tier: 'Premium', tts: 'Aoede' },
                    { id: 'en-NG', name: 'Nigerian English', flag: '🇳🇬', tier: 'Free', tts: 'Charon' },
                    { id: 'en-GH', name: 'Ghanaian English', flag: '🇬🇭', tier: 'Premium', tts: 'Puck' },
                    { id: 'en-ZA', name: 'South African English', flag: '🇿🇦', tier: 'Premium', tts: 'Fenrir' },
                    { id: 'en-IN', name: 'Indian English', flag: '🇮🇳', tier: 'Free', tts: 'Kore' },
                    { id: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸', tier: 'Premium', tts: 'Aoede' },
                    { id: 'es-419', name: 'Spanish (Latin America)', flag: '🇲🇽', tier: 'Premium', tts: 'Charon' },
                    { id: 'en-JM', name: 'Jamaican Patois', flag: '🇯🇲', tier: 'Premium', tts: 'Puck' },
                  ].map((accent) => (
                    <div key={accent.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{accent.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{accent.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">TTS: {accent.tts} • DSP Formants</div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          accent.tier === 'Free'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {accent.tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: SYSTEM MANAGEMENT & BROADCAST */}
          {/* ======================================================== */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Emergency Maintenance Mode Switch */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Power className={`w-5 h-5 ${maintenanceMode ? 'text-rose-500' : 'text-emerald-500'}`} />
                    <h3 className="text-sm font-bold text-white">Platform Maintenance Lock</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    When active, customer chat actions are paused with a maintenance announcement.
                  </p>
                </div>

                <button
                  onClick={handleToggleMaintenance}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                    maintenanceMode
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {maintenanceMode ? 'Deactivate Maintenance' : 'Activate Maintenance'}
                </button>
              </div>

              {/* Real-time Global Announcement Form */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-400" /> Dispatch System Announcement
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Broadcast high-priority notifications instantly to all connected mobile and web apps.
                  </p>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="e.g. Scheduled Network Upgrade / Important Security Notice"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Announcement Content
                    </label>
                    <textarea
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      rows={3}
                      placeholder="Details of the announcement displayed to users..."
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(['normal', 'high', 'urgent'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAnnouncementPriority(p)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer ${
                            announcementPriority === p
                              ? p === 'urgent'
                                ? 'bg-rose-500 text-white'
                                : p === 'high'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-teal-500 text-slate-950'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{broadcastSent ? 'Dispatched!' : 'Broadcast to App'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Account Bounding / Restrict Modal */}
      {isBoundingModalOpen && boundingModalUser && (
        <AccountBoundingModal
          isOpen={isBoundingModalOpen}
          user={boundingModalUser}
          onClose={() => {
            setIsBoundingModalOpen(false);
            setBoundingModalUser(null);
          }}
          onSave={async (b: AccountBoundingDetails) => {
            await adminFetch(`/api/admin/users/${boundingModalUser.id}/bound`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ boundingDetails: b, isBanned: b.scope === 'full_block' }),
            });
            setIsBoundingModalOpen(false);
            setBoundingModalUser(null);
            showToast('Account Updated', 'Restrictions successfully applied.', 'success');
            fetchAdminData();
          }}
          onUnbind={async () => {
            await adminFetch(`/api/admin/users/${boundingModalUser.id}/unbound`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adminName: adminUser.name }),
            });
            setIsBoundingModalOpen(false);
            setBoundingModalUser(null);
            showToast('Account Unbounded', 'All restrictions lifted.', 'success');
            fetchAdminData();
          }}
        />
      )}

      {/* PIN Reset Modal */}
      {pinResetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-400" /> Reset Security PIN
            </h3>
            <p className="text-xs text-slate-400">
              Set a new 4 to 6 digit security PIN for <strong>{pinResetUser.name}</strong>.
            </p>
            <input
              type="text"
              value={customPinInput}
              onChange={(e) => setCustomPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 123456"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-teal-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPinResetUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={customPinInput.length < 4}
                onClick={() => handleResetPin(pinResetUser.id, customPinInput)}
                className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs disabled:opacity-40"
              >
                Save New PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Deletion Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Permanently Delete Account?</h3>
            <p className="text-xs text-slate-400">
              This action cannot be undone. All chats, profile, and data for <strong>{deleteTargetUser.name}</strong> will be permanently purged.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteTargetUser.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Administrator Modal */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" /> Appoint Staff Administrator
              </h3>
              <button onClick={() => setIsCreateAdminOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminStaff} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@chattimeapp.name.ng"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Handle / Username
                </label>
                <input
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. jdoe_admin"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Authority Role
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                >
                  <option value="super_admin">SUPER ADMIN (Full Master Access)</option>
                  <option value="admin">ADMIN (Operations & Safety)</option>
                  <option value="moderator">MODERATOR (Content & Abuse Reports)</option>
                  <option value="support">SUPPORT (Customer Verifications & Inquiries)</option>
                  <option value="analyst">ANALYST (Read-Only Metrics & Audit)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
