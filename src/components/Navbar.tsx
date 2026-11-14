import React from 'react';
import { Settings, Bell, Cloud, LogIn, Search, Plus, Receipt, Landmark } from 'lucide-react';
import { UserProfile, CategoryId } from '../types';
import { ActiveTab } from './CategoryTabs';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  user: UserProfile | null;
  activeTab?: ActiveTab;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAddModal?: (catId?: CategoryId) => void;
  onOpenAddExpense?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab = 'overview',
  onOpenSettings,
  onOpenNotifications,
  onOpenAuth,
  onOpenCommandPalette,
  onOpenAddModal,
  onOpenAddExpense,
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
    overview: { title: 'Dashboard', subtitle: 'Overview of monthly goals, daily burn rate & commitments' },
    home_rent: { title: 'Home Rent', subtitle: 'Target: 500,000 UGX monthly living rent' },
    internet: { title: 'Internet & WiFi', subtitle: 'Target: 175,000 UGX connectivity budget' },
    work_rent: { title: 'Work Rent', subtitle: 'Target: 150,000 UGX workspace & co-working' },
    debt: { title: 'Office Debt Commitment', subtitle: '720,000 UGX total debt • 2,000 UGX/day minimum' },
    expenses: { title: 'Daily Expenses', subtitle: 'Tracking outflows, fuel, groceries & utilities' },
    history: { title: 'Savings Ledger', subtitle: 'Historical audit log & exportable record of all deposits' },
    ai: { title: 'AI Financial Coach', subtitle: 'Powered by Gemini • Smart insights & cashflow forecasting' },
  };

  const currentMeta = tabLabels[activeTab] || tabLabels.overview;

  return (
    <header
      id="main-header"
      className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Mobile: Brand Logo & Title */}
        <div className="flex lg:hidden items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-md shadow-indigo-500/20 shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
            <img src="/favicon.svg" alt="Vault Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Vault
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                UGX
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Daily Budget & Savings
            </p>
          </div>
        </div>

        {/* Desktop (lg+): Page Title & Subtitle Breadcrumb */}
        <div className="hidden lg:flex items-center gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
              <span>{currentMeta.title}</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Desktop Quick Search & Action Bar */}
        <div className="hidden lg:flex items-center gap-3">
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Search or jump to...</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {onOpenAddModal && (
            <button
              onClick={() => onOpenAddModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Deposit</span>
            </button>
          )}

          {onOpenAddExpense && (
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/80 font-bold text-xs active:scale-95 transition-all"
            >
              <Receipt className="w-3.5 h-3.5 text-rose-500" />
              <span>Expense</span>
            </button>
          )}
        </div>

        {/* Right side: Realtime Cloud Sync Status, Notification Bell & Settings buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Sync / Account Status Badge */}
          {user ? (
            <button
              id="cloud-sync-status-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm transition-all active:scale-95 text-xs font-bold"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-sm transition-all active:scale-95 text-xs font-bold"
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
            className="relative p-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all active:scale-95 group"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center font-mono-num shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="flex items-center gap-2 p-2.5 sm:px-3 sm:py-2 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all active:scale-95 group"
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
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                {initials}
              </div>
            ) : (
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:rotate-45 transition-transform duration-300" />
            )}
            <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-slate-300">
              Settings
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

