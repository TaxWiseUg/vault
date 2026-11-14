import React from 'react';
import { Settings, Bell, Cloud, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import { ActiveTab } from './CategoryTabs';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  user: UserProfile | null;
  activeTab?: ActiveTab;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab = 'overview',
  onOpenSettings,
  onOpenNotifications,
  onOpenAuth,
  onOpenCommandPalette,
}) => {
  const { unreadCount } = useNotifications();

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'V';

  const tabLabels: Record<ActiveTab, { title: string; subtitle: string }> = {
    overview: { title: 'Dash', subtitle: 'Your money, at a glance' },
    home_rent: { title: 'Home', subtitle: 'Rent savings' },
    internet: { title: 'WiFi', subtitle: 'Connectivity savings' },
    work_rent: { title: 'Work', subtitle: 'Workspace savings' },
    debt: { title: 'Office', subtitle: 'Debt payments' },
    history: { title: 'History', subtitle: 'All records' },
    settings: { title: 'Settings', subtitle: 'Account and preferences' },
  };

  const currentMeta = tabLabels[activeTab] || tabLabels.overview;

  return (
    <header
      id="main-header"
      className="sticky top-0 z-30 bg-zinc-50/95 dark:bg-zinc-950/95 border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 py-3 transition-colors"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Mobile: Brand Logo & Title */}
        <div className="flex lg:hidden items-center gap-2.5">
          <div className="w-9 h-9 rounded-surface overflow-hidden  shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
            <img src="/favicon.svg" alt="Vault Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                Vault
              </h1>
              <span className="text-xs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                UGX
              </span>
            </div>
          </div>
        </div>

        {/* Desktop (lg+): Page Title & Subtitle Breadcrumb */}
        <div className="hidden lg:flex items-center gap-4">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
              <span>{currentMeta.title}</span>
            </h2>
          </div>
        </div>

        {/* Right side: Realtime Cloud Sync Status, Notification Bell & Settings buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Sync / Account Status Badge */}
          {user ? (
            <button
              id="cloud-sync-status-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-surface bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60  transition-all active:scale-95 text-xs font-bold"
              title="Real-time multi-device cloud sync is active"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Live Sync</span>
            </button>
          ) : (
            <button
              id="signin-header-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-surface bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60  transition-all active:scale-95 text-xs font-bold"
              title="Sign in to sync across phone, tablet & laptop"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Sync Devices</span>
              <span className="sm:hidden">Sync</span>
            </button>
          )}

          {/* Notification Button */}
          <button
            id="open-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-surface bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800  hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-95 group"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center font-mono-num ">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="flex items-center gap-2 p-2.5 sm:px-3 sm:py-2 rounded-surface bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800  hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-95 group"
            title="Settings, Theme & Cloud Sync"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-5 h-5 rounded-full object-cover border border-indigo-200 dark:border-indigo-800"
                referrerPolicy="no-referrer"
              />
            ) : user ? (
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                {initials}
              </div>
            ) : (
              <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:rotate-45 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

