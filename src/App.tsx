import React, { useEffect, useState } from 'react';
import { ChatTimeProvider, useChatTime } from './context/ChatTimeContext';
import { TopHeader } from './components/layout/TopHeader';
import { NavigationSidebar } from './components/layout/NavigationSidebar';
import { ChatList } from './components/chat/ChatList';
import { ChatWindow } from './components/chat/ChatWindow';
import { CallsView } from './components/calls/CallsView';
import { ContactsView } from './components/contacts/ContactsView';
import { StatusView } from './components/status/StatusView';
import { DiscoverView } from './components/discover/DiscoverView';
import { SettingsView } from './components/settings/SettingsView';
import { CallOverlay } from './components/calls/CallOverlay';
import { RegisterModal } from './components/auth/RegisterModal';
import { AuthPage } from './components/auth/AuthPage';
import { AppLockScreen } from './components/auth/AppLockScreen';
import { AccountBoundedScreen } from './components/auth/AccountBoundedScreen';
import { AppBackground } from './components/layout/AppBackground';
import { NewGroupModal } from './components/chat/NewGroupModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { BrandLogo } from './components/common/BrandLogo';
import { isSharedAppUrl } from './utils/sharedUrl';
import { AdminApp } from './admin/AdminApp';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export function isCurrentAdminApp(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Explicit environment variable for dedicated admin builds (e.g. Vercel admin deployment)
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_APP_MODE === 'admin' ||
      import.meta.env.VITE_IS_ADMIN === 'true' ||
      import.meta.env.VITE_ADMIN_ONLY === 'true')
  ) {
    return true;
  }

  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();

  // 2. Dedicated domain, subdomain or host containing 'admin' (e.g. admin.chattimeapp.name.ng, chattime-admin.vercel.app)
  if (
    host === 'admin.chattimeapp.name.ng' ||
    host.startsWith('admin.') ||
    host.includes('-admin.') ||
    host.includes('admin-') ||
    host.startsWith('admin-')
  ) {
    return true;
  }

  // 3. Dedicated path route (e.g. /admin or /admin/dashboard)
  if (path === '/admin' || path.startsWith('/admin/')) {
    return true;
  }

  // 4. Flexible testing / sandbox parameter (?app=admin or ?view=admin or ?mode=admin)
  if (
    search.includes('app=admin') ||
    search.includes('view=admin') ||
    search.includes('mode=admin')
  ) {
    return true;
  }
  return false;
}

const ChatTimeMain: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    isAuthLoading,
    activeCall,
    activeTab,
    activeChatId,
    chats,
    theme,
    accentColor,
    appBackground,
    wallpaper,
    wallpaperOpacity,
    toasts,
    removeToast,
    setInspectedUserId,
  } = useChatTime();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    const updateAppHeight = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`);
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    updateAppHeight();
    viewport?.addEventListener('resize', updateAppHeight);
    viewport?.addEventListener('scroll', updateAppHeight);
    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);

    return () => {
      viewport?.removeEventListener('resize', updateAppHeight);
      viewport?.removeEventListener('scroll', updateAppHeight);
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
      document.documentElement.style.removeProperty('--app-height');
    };
  }, []);

  const isUserBoundedLockout = Boolean(
    currentUser.isBanned || currentUser.boundingDetails?.scope === 'full_block'
  );
  const isShared = isSharedAppUrl();

  const isMobileChatOpen = activeTab === 'chats' && Boolean(activeChatId);

  if (isAuthLoading) {
    return (
      <div className="h-[var(--app-height,100dvh)] w-full max-w-full flex flex-col items-center justify-between py-12 px-6 bg-slate-950 text-slate-100 select-none relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10">
          <div className="relative">
            <BrandLogo size="xl" showText subtitle="Encrypted Messaging & Calls" />
          </div>

          {/* Smooth WhatsApp-style Progress Bar */}
          <div className="w-48 h-1 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden shadow-inner mt-4">
            <div className="h-full w-2/3 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full animate-pulse transition-all duration-300" />
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="flex flex-col items-center gap-1.5 z-10 text-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>End-to-End Encrypted</span>
          </div>
          <span className="text-[11px] font-bold text-slate-300 tracking-wider font-display">
            Chat Time
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[var(--app-height,100dvh)] w-full max-w-full flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans relative">
      {/* Dynamic Ambient Background & Wallpaper System */}
      {!activeCall && (
        <AppBackground
          style={appBackground}
          accent={accentColor}
          theme={theme}
          wallpaper={wallpaper}
          wallpaperOpacity={wallpaperOpacity}
        />
      )}

      {/* Global Toast Notifications */}
      {!activeCall && toasts.length > 0 && (
        <div className="fixed top-3 right-3 left-3 sm:left-auto z-50 flex flex-col gap-2 sm:max-w-sm w-auto pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl animate-in slide-in-from-top duration-200"
            >
              {t.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              ) : t.type === 'warning' || t.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-100">{t.title}</div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-100 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isAuthenticated ? (
        <AuthPage />
      ) : isUserBoundedLockout ? (
        /* Account Suspended & Bounded Lockout Screen */
        <AccountBoundedScreen />
      ) : (
        activeCall ? <CallOverlay /> : (
        <>
          {/* App Passcode Lock Screen */}
          <AppLockScreen />

          {/* Top Application Header (hidden on mobile when inside an active chat so chat has full screen space) */}
          <div className={isMobileChatOpen ? 'hidden md:block shrink-0' : 'block shrink-0'}>
            <TopHeader onOpenRegister={() => setIsRegisterOpen(true)} />
          </div>

          {/* Body: Left Rail + Active Tab Viewport */}
          <div
            className={`flex-1 min-h-0 w-full max-w-full flex overflow-hidden relative z-10 ${
              isMobileChatOpen ? 'pb-0' : 'body-mobile-bottom-pad md:pb-0'
            }`}
          >
            {/* Navigation Rail / Mobile Tabs */}
            <NavigationSidebar />

            {/* Tab Destination View */}
            <main className="flex-1 min-w-0 min-h-0 flex overflow-hidden">
              {activeTab === 'chats' && (
                <div className="flex-1 min-w-0 min-h-0 flex overflow-hidden">
                  {/* Chat List: On mobile, hide when a chat is open */}
                  <div
                    className={`w-full md:w-auto h-full min-h-0 ${
                      activeChatId ? 'hidden md:flex' : 'flex'
                    }`}
                  >
                    <ChatList onOpenNewGroupModal={() => setIsNewGroupOpen(true)} />
                  </div>

                  {/* Chat Window: On mobile, hide when no chat is selected */}
                  <div
                    className={`flex-1 min-w-0 h-full min-h-0 ${
                      !activeChatId ? 'hidden md:flex' : 'flex'
                    }`}
                  >
                    <ChatWindow />
                  </div>
                </div>
              )}

              {activeTab === 'calls' && <CallsView />}
              {activeTab === 'contacts' && (
                <ContactsView onOpenNewGroupModal={() => setIsNewGroupOpen(true)} />
              )}
              {activeTab === 'status' && <StatusView />}
              {activeTab === 'discover' && <DiscoverView />}
              {activeTab === 'settings' && <SettingsView />}
            </main>
          </div>

          {/* Account Creation / Switcher Modal */}
          <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />

          {/* Create New Group Modal */}
          <NewGroupModal isOpen={isNewGroupOpen} onClose={() => setIsNewGroupOpen(false)} />

          {/* Global Responsive User Profile Modal */}
          <UserProfileModal 
            onOpenRegister={() => setIsRegisterOpen(true)} 
            onClose={() => setInspectedUserId(null)} 
          />
        </>
        )
      )}
    </div>
  );
};

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState(() => isCurrentAdminApp());

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminMode(isCurrentAdminApp());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (isAdminMode) {
    return <AdminApp />;
  }

  return (
    <ChatTimeProvider>
      <ChatTimeMain />
    </ChatTimeProvider>
  );
}
