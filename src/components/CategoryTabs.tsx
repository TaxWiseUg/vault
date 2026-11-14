import { Briefcase, Home, Landmark, Wifi } from 'lucide-react';
import type { CategoryId } from '../types';

export type ActiveTab = 'overview' | CategoryId | 'debt' | 'expenses' | 'history';

interface CategoryTabsProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  categoriesProgress: Record<CategoryId, { current: number; target: number; pct: number }>;
  debtProgress?: { current: number; total: number; pct: number };
}

export function CategoryTabs({ activeTab, onChangeTab, categoriesProgress, debtProgress }: CategoryTabsProps) {
  const debtPct = debtProgress
    ? Math.min(100, Math.round((debtProgress.current / (debtProgress.total || 1)) * 100))
    : 0;
  const tabs = [
    { id: 'home_rent' as const, label: 'Home Rent', icon: Home, pct: categoriesProgress.home_rent.pct },
    { id: 'internet' as const, label: 'Internet', icon: Wifi, pct: categoriesProgress.internet.pct },
    { id: 'work_rent' as const, label: 'Work Rent', icon: Briefcase, pct: categoriesProgress.work_rent.pct },
    { id: 'debt' as const, label: 'Office Debt', icon: Landmark, pct: debtPct },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-3 sm:px-6">
      <nav
        className="grid grid-cols-4 gap-1 rounded-surface border border-border bg-muted/60 p-1"
        aria-label="Savings categories"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-surface px-1 py-1.5 text-center transition-colors sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 ${
                active
                  ? 'bg-card text-primary'
                  : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
              }`}
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.8} className="shrink-0" />
              <span className="text-xs font-medium leading-tight">{tab.label}</span>
              <span className="font-mono-num text-xs text-muted-foreground sm:ml-auto">{tab.pct}%</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
