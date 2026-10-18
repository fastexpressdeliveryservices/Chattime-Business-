import React from 'react';
import {
  MessageSquare,
  PhoneCall,
  Users,
  CircleDot,
  Compass,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useChatTime, NavigationTab } from '../../context/ChatTimeContext';
import { isSharedAppUrl } from '../../utils/sharedUrl';

export const NavigationSidebar: React.FC = () => {
  const { activeTab, activeChatId, setActiveTab, chats, calls, statuses, currentUser, t } = useChatTime();
  const isMobileChatOpen = activeTab === 'chats' && Boolean(activeChatId);

  const totalUnreadMessages = chats.reduce((sum, c) => {
    const isMember =
      c.participants.includes(currentUser.id) || (c.type !== 'direct' && c.isPublic);
    if (!isMember || c.isMuted) return sum;
    return sum + (c.unreadCount || 0);
  }, 0);
  const missedCallsCount = calls.filter(
    (c) =>
      c.status === 'missed' &&
      c.direction === 'missed' &&
      (c.receiverId === currentUser.id || c.callerId === currentUser.id)
  ).length;
  const activeStoriesCount = statuses.length;

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'chats',
      label: t('chats', 'Chats'),
      icon: MessageSquare,
      badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined,
    },
    {
      id: 'calls',
      label: t('calls', 'Calls'),
      icon: PhoneCall,
      badge: missedCallsCount > 0 ? missedCallsCount : undefined,
    },
    {
      id: 'contacts',
      label: t('contacts', 'Contacts'),
      icon: Users,
    },
    {
      id: 'status',
      label: t('status', 'Status'),
      icon: CircleDot,
      badge: activeStoriesCount > 0 ? activeStoriesCount : undefined,
    },
    {
      id: 'discover',
      label: t('communities', 'Communities'),
      icon: Compass,
    },
  ];

  return (
    <>
      {/* Desktop Left Vertical Rail */}
      <aside className="hidden md:flex flex-col justify-between w-20 bg-slate-900/90 border-r border-slate-800/80 py-4 items-center shrink-0 z-20">
        <div className="flex flex-col gap-2 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative group flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-teal-400 rounded-r-full" />
                )}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-teal-500 text-slate-950 text-[10px] font-bold flex items-center justify-center shadow">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 w-full px-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all ${
              activeTab === 'settings'
                ? 'bg-teal-500/15 text-teal-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {activeTab === 'settings' && (
              <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-teal-400 rounded-r-full" />
            )}
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1">{t('settings', 'Settings')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)',
          height: 'calc(3.75rem + max(env(safe-area-inset-bottom, 0px), 0px))',
        }}
        className={`${
          isMobileChatOpen ? 'hidden' : 'md:hidden flex'
        } fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 items-center justify-around z-30 select-none pt-1`}
      >
        {[
          ...navItems,
          { id: 'settings' as NavigationTab, label: t('settings', 'Settings'), icon: Settings, badge: undefined },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-0 flex-1 active:scale-90 ${
                isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-0.5 bg-teal-400 rounded-full" />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-teal-500 text-slate-950 text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
