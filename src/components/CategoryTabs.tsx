import React from 'react';
import { LayoutDashboard, Home, Wifi, Briefcase, History, Sparkles, Receipt, Landmark } from 'lucide-react';
import { CategoryId } from '../types';

export type ActiveTab = 'overview' | CategoryId | 'debt' | 'expenses' | 'history' | 'ai';

interface CategoryTabsProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  categoriesProgress: Record<CategoryId, { current: number; target: number; pct: number }>;
  debtProgress?: { current: number; total: number; pct: number };
  expenseCount?: number;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  onChangeTab,
  categoriesProgress,
  debtProgress,
  expenseCount = 0,
}) => {
  const debtPct = debtProgress ? Math.min(100, Math.round((debtProgress.current / (debtProgress.total || 1)) * 100)) : 0;

  const tabs = [
    {
      id: 'overview' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'home_rent' as ActiveTab,
      label: 'Home Rent',
      icon: Home,
      badge: `${categoriesProgress.home_rent.pct}%`,
      badgeColor:
        categoriesProgress.home_rent.pct >= 100
          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
          : 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400',
    },
    {
      id: 'internet' as ActiveTab,
      label: 'Internet',
      icon: Wifi,
      badge: `${categoriesProgress.internet.pct}%`,
      badgeColor:
        categoriesProgress.internet.pct >= 100
          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400',
    },
    {
      id: 'work_rent' as ActiveTab,
      label: 'Work Rent',
      icon: Briefcase,
      badge: `${categoriesProgress.work_rent.pct}%`,
      badgeColor:
        categoriesProgress.work_rent.pct >= 100
          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
    },
    {
      id: 'debt' as ActiveTab,
      label: 'Office Debt (720k)',
      icon: Landmark,
      badge: debtPct >= 100 ? 'Paid ✓' : `${debtPct}%`,
      badgeColor:
        debtPct >= 100
          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'Expenses',
      icon: Receipt,
      badge: expenseCount > 0 ? `${expenseCount}` : null,
      badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400',
    },
    {
      id: 'history' as ActiveTab,
      label: 'Ledger',
      icon: History,
      badge: null,
    },
    {
      id: 'ai' as ActiveTab,
      label: 'AI Coach',
      icon: Sparkles,
      badge: 'Gemini',
      badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400',
    },
  ];

  return (
    <div id="category-tabs-container" className="lg:hidden px-4 sm:px-6 pt-3 pb-2 max-w-4xl mx-auto w-full">
      {/* Fitted Horizontal Scroller Container with hidden scrollbars and smooth touch navigation */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <nav
          className="flex items-center gap-2 min-w-max p-1.5 rounded-2xl bg-slate-200/50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 transition-colors"
          aria-label="Navigation Tabs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700/80'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="leading-none">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold font-mono-num leading-none shrink-0 ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
