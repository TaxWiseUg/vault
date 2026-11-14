import React from 'react';
import {
  LayoutDashboard,
  Home,
  Wifi,
  Briefcase,
  Landmark,
  Receipt,
  History,
  Sparkles,
  Plus,
  ArrowUpRight,
  Settings,
  Bell,
  Sun,
  Moon,
  Cloud,
  LogIn,
  Keyboard,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { CategoryGoal, CategoryId, DebtGoal, UserProfile } from '../types';
import { ActiveTab } from './CategoryTabs';
import { formatUGX, formatUGXShort } from '../lib/constants';
import { useNotifications } from '../context/NotificationContext';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  categories: Record<CategoryId, CategoryGoal>;
  debt: DebtGoal;
  categoriesProgress: Record<CategoryId, { current: number; target: number; pct: number }>;
  debtProgress?: { current: number; total: number; pct: number };
  expenseCount: number;
  user: UserProfile | null;
  onOpenAddModal: (catId?: CategoryId) => void;
  onOpenAddExpenseModal: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenShortcuts: () => void;
  onOpenCommandPalette: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onChangeTab,
  categories,
  debt,
  categoriesProgress,
  debtProgress,
  expenseCount,
  user,
  onOpenAddModal,
  onOpenAddExpenseModal,
  onOpenSettings,
  onOpenNotifications,
  onOpenAuth,
  onOpenShortcuts,
  onOpenCommandPalette,
}) => {
  const { unreadCount } = useNotifications();

  const totalTarget =
    (categories.home_rent?.targetAmount || 0) +
    (categories.internet?.targetAmount || 0) +
    (categories.work_rent?.targetAmount || 0);

  const totalSaved =
    (categories.home_rent?.currentAmount || 0) +
    (categories.internet?.currentAmount || 0) +
    (categories.work_rent?.currentAmount || 0);

  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const debtPct = debtProgress ? Math.min(100, Math.round((debtProgress.current / (debtProgress.total || 1)) * 100)) : 0;

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <aside
      id="desktop-sidebar"
      className="hidden lg:flex flex-col w-72 xl:w-80 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 shrink-0 z-20 select-none transition-colors"
    >
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-indigo-500/20 shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
            <img src="/favicon.svg" alt="Vault Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Vault
              </h1>
              <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800">
                UGX
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              Smart Budget & Debt Desk
            </p>
          </div>
        </div>

        {/* Quick Search / Command Palette shortcut trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-mono font-bold flex items-center gap-1 transition-colors"
          title="Open Command Palette (Cmd + K)"
        >
          <kbd className="text-[10px]">⌘K</kbd>
        </button>
      </div>

      {/* Mini Financial Summary Bento Card */}
      <div className="px-5 pt-4 pb-2">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              Cycle Target
            </span>
            <span className="font-mono-num font-black text-indigo-600 dark:text-indigo-400">
              {overallPct}%
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono-num">
            <span>{formatUGXShort(totalSaved)}</span>
            <span className="text-slate-400 font-normal">of {formatUGXShort(totalTarget)}</span>
          </div>
        </div>
      </div>

      {/* Primary Actions Button Bar */}
      <div className="px-5 py-2 grid grid-cols-2 gap-2">
        <button
          id="desktop-quick-deposit-btn"
          onClick={() => onOpenAddModal()}
          className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Deposit</span>
        </button>

        <button
          id="desktop-quick-expense-btn"
          onClick={onOpenAddExpenseModal}
          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all"
        >
          <Receipt className="w-4 h-4 text-rose-500" />
          <span>Expense</span>
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-5 no-scrollbar">
        {/* Core Views */}
        <div>
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            Main Desk
          </p>
          <div className="space-y-1">
            <button
              id="sidebar-nav-overview"
              onClick={() => onChangeTab('overview')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">1</span>
            </button>

            <button
              id="sidebar-nav-debt"
              onClick={() => onChangeTab('debt')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'debt'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black shadow-sm border border-amber-200/60 dark:border-amber-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Landmark className={`w-4 h-4 ${activeTab === 'debt' ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500'}`} />
                <span>Office Debt</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono-num font-extrabold ${
                debtPct >= 100
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
              }`}>
                {debtPct >= 100 ? 'Paid ✓' : `${debtPct}%`}
              </span>
            </button>

            <button
              id="sidebar-nav-expenses"
              onClick={() => onChangeTab('expenses')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'expenses'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className={`w-4 h-4 ${activeTab === 'expenses' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                <span>Daily Expenses</span>
              </div>
              {expenseCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-mono-num font-extrabold">
                  {expenseCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Vault Categories */}
        <div>
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            Vault Categories
          </p>
          <div className="space-y-1">
            <button
              id="sidebar-nav-home-rent"
              onClick={() => onChangeTab('home_rent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'home_rent'
                  ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-black shadow-sm border border-orange-200/60 dark:border-orange-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className={`w-4 h-4 ${activeTab === 'home_rent' ? 'text-orange-600 dark:text-orange-400' : 'text-orange-500'}`} />
                <span>Home Rent</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono-num font-extrabold ${
                categoriesProgress.home_rent.pct >= 100
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300'
              }`}>
                {categoriesProgress.home_rent.pct}%
              </span>
            </button>

            <button
              id="sidebar-nav-internet"
              onClick={() => onChangeTab('internet')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'internet'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black shadow-sm border border-blue-200/60 dark:border-blue-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wifi className={`w-4 h-4 ${activeTab === 'internet' ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500'}`} />
                <span>Internet</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono-num font-extrabold ${
                categoriesProgress.internet.pct >= 100
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
              }`}>
                {categoriesProgress.internet.pct}%
              </span>
            </button>

            <button
              id="sidebar-nav-work-rent"
              onClick={() => onChangeTab('work_rent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'work_rent'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black shadow-sm border border-emerald-200/60 dark:border-emerald-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className={`w-4 h-4 ${activeTab === 'work_rent' ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-500'}`} />
                <span>Work Rent</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono-num font-extrabold ${
                categoriesProgress.work_rent.pct >= 100
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}>
                {categoriesProgress.work_rent.pct}%
              </span>
            </button>
          </div>
        </div>

        {/* Tools & AI */}
        <div>
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
            Intelligence & Logs
          </p>
          <div className="space-y-1">
            <button
              id="sidebar-nav-history"
              onClick={() => onChangeTab('history')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Savings Ledger</span>
              </div>
            </button>

            <button
              id="sidebar-nav-ai"
              onClick={() => onChangeTab('ai')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black shadow-sm border border-purple-200/60 dark:border-purple-900/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className={`w-4 h-4 ${activeTab === 'ai' ? 'text-purple-600 dark:text-purple-400' : 'text-purple-500'}`} />
                <span>AI Coach</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-extrabold">
                Gemini
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer Controls & User Sync */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
        {/* Sync & Auth Status Bar */}
        {user ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.displayName || 'Active Member'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Synced</span>
                </div>
              </div>
            </div>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Sign in to Cloud Sync</span>
            </div>
            <LogIn className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Quick Utility Icon Buttons */}
        <div className="flex items-center justify-between pt-1 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute 0 top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center font-mono-num">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Toggle Dark/Light Mode"
            >
              <Sun className="w-4 h-4 hidden dark:block text-amber-400" />
              <Moon className="w-4 h-4 block dark:hidden text-slate-600" />
            </button>

            <button
              onClick={onOpenShortcuts}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="App & Currency Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
