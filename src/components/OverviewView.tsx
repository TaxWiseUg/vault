import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Flame,
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Home,
  Wifi,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Cloud,
  Edit3,
  Receipt,
  TrendingDown,
  Landmark,
} from 'lucide-react';
import { BudgetOverview, CategoryGoal, CategoryId, SavingsEntry, UserProfile, ExpenseEntry, DebtGoal } from '../types';
import { formatUGX, formatUGXShort, QUICK_ADD_AMOUNTS } from '../lib/constants';

interface OverviewViewProps {
  categories: Record<CategoryId, CategoryGoal>;
  overview: BudgetOverview;
  recentEntries: SavingsEntry[];
  expenses?: ExpenseEntry[];
  debt?: DebtGoal;
  user?: UserProfile | null;
  onOpenAddModal: (catId?: CategoryId) => void;
  onQuickAdd: (catId: CategoryId, amount: number) => void;
  onQuickAddMultiple?: (categoryIds: CategoryId[], amountPerCategory: number) => void;
  onSelectCategory: (catId: CategoryId) => void;
  onOpenLedger: () => void;
  onOpenExpenses?: () => void;
  onOpenAddExpense?: () => void;
  onOpenDebt?: () => void;
  onEditEntry?: (entry: SavingsEntry) => void;
  onOpenAuth?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  categories,
  overview,
  recentEntries,
  expenses = [],
  debt,
  user,
  onOpenAddModal,
  onQuickAdd,
  onQuickAddMultiple,
  onSelectCategory,
  onOpenLedger,
  onOpenExpenses,
  onOpenAddExpense,
  onOpenDebt,
  onEditEntry,
  onOpenAuth,
}) => {
  const [quickAmount, setQuickAmount] = useState<string>('5000');
  const [quickCat, setQuickCat] = useState<CategoryId | 'all'>('all');

  const totalExpensesSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryList: CategoryGoal[] = [
    categories.home_rent,
    categories.internet,
    categories.work_rent,
  ];

  const handleBottomBarDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(quickAmount.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      if (quickCat === 'all') {
        if (onQuickAddMultiple) {
          onQuickAddMultiple(['home_rent', 'internet', 'work_rent'], parsed);
        } else {
          onQuickAdd('home_rent', parsed);
          onQuickAdd('internet', parsed);
          onQuickAdd('work_rent', parsed);
        }
      } else {
        onQuickAdd(quickCat, parsed);
      }
    }
  };

  return (
    <div id="overview-view" className="space-y-6 px-4 sm:px-6 lg:px-8 pb-28 max-w-6xl mx-auto w-full">
      {/* Master Overview / Milestone Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              Monthly Budget Goals
            </span>
            <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-mono-num tracking-tight">
                {formatUGX(overview.totalSaved)}
              </h2>
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                of {formatUGX(overview.totalTarget)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="font-mono-num">{overview.daysLeftInMonth} days left in cycle</span>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-mono-num">{overview.streakDays}d streak</span>
            </div>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>Overall Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono-num text-sm">
              {overview.overallPercentage}% Completed
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${overview.overallPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
            <span>
              Remaining:{' '}
              <strong className="text-orange-600 dark:text-orange-400 font-mono-num">
                {formatUGX(overview.totalRemaining)}
              </strong>
            </span>
            <span>
              Daily Target:{' '}
              <strong className="text-slate-900 dark:text-white font-mono-num">
                {formatUGXShort(overview.requiredDailyRateTotal)}/day
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Interactive Goal Cards (Home Rent, Internet, Work Rent) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Monthly Categories
          </h3>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Tap a card for detailed log
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoryList.map((cat) => {
            const current = cat.currentAmount || 0;
            const target = cat.targetAmount;
            const remaining = Math.max(0, target - current);
            const pct = Math.min(100, Math.round((current / target) * 100));
            const isCompleted = current >= target;

            const isHome = cat.id === 'home_rent';
            const isInternet = cat.id === 'internet';
            const Icon = isHome ? Home : isInternet ? Wifi : Briefcase;

            let cardBorder = 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700';
            let iconBg = 'bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400';
            let progressBar = 'bg-orange-500';
            let badgeStyle = 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/60';

            if (isInternet) {
              iconBg = 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400';
              progressBar = 'bg-blue-500';
              badgeStyle = 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60';
            } else if (!isHome) {
              iconBg = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400';
              progressBar = 'bg-emerald-500';
              badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60';
            }

            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => onSelectCategory(cat.id)}
                className={`bg-white dark:bg-slate-900 p-6 rounded-[28px] sm:rounded-[32px] border ${cardBorder} shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between group relative`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-inner transition-transform group-hover:scale-105`}>
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>

                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeStyle}`}>
                      {pct}%
                    </span>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <span>{cat.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono-num">
                        {formatUGX(current)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        of {formatUGXShort(target)}
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <div
                        className={`${progressBar} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold pt-1">
                      {isCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Completed ✓
                        </span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">
                          {formatUGX(remaining)} left
                        </span>
                      )}
                      <span className="text-slate-400 font-mono-num">
                        Target: {formatUGXShort(target)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Add Action Buttons on Card */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAdd(cat.id, 5000);
                    }}
                    className="flex-1 py-2 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold font-mono-num transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    +5k
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAdd(cat.id, 10000);
                    }}
                    className="flex-1 py-2 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold font-mono-num transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    +10k
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddModal(cat.id);
                    }}
                    className="py-2 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all active:scale-95 border border-indigo-100 dark:border-indigo-900"
                    title="Custom deposit amount"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Deposit Command Bar */}
      <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-7 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Quick Action
            </p>
            <h4 className="text-xl font-bold tracking-tight">Log Daily Deposit</h4>
          </div>
        </div>

        <form
          onSubmit={handleBottomBarDeposit}
          className="flex flex-wrap sm:flex-nowrap gap-2.5 items-center w-full md:w-auto justify-center"
        >
          <div className="relative flex-1 sm:flex-initial">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">
              UGX
            </span>
            <input
              id="bar-deposit-input"
              type="text"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              placeholder="5,000"
              className="bg-slate-800 dark:bg-slate-950 border border-slate-700/60 dark:border-slate-800 rounded-2xl pl-14 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-36 font-mono text-sm font-bold"
            />
          </div>

          <select
            id="bar-category-select"
            value={quickCat}
            onChange={(e) => setQuickCat(e.target.value as CategoryId | 'all')}
            className="bg-slate-800 dark:bg-slate-950 border border-slate-700/60 dark:border-slate-800 rounded-2xl px-3 py-3 text-white outline-none font-bold text-xs min-w-[140px] focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">⚡ All 3 Accounts (Each)</option>
            <option value="home_rent">Home Rent</option>
            <option value="internet">Internet</option>
            <option value="work_rent">Work Rent</option>
          </select>

          <button
            id="bar-save-contribution-btn"
            type="submit"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            Save Deposit
          </button>
        </form>
      </div>

      {/* Responsive Bento Grid: Left (Expenses & Debt) | Right (Recent Savings Ledger) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Expenses & Debt */}
        <div className="space-y-6">
          {/* Expense Tracker Snapshot Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Daily Expenses</h4>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">
                    {expenses.length} logs
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Total spent: <strong className="text-slate-700 dark:text-slate-200 font-mono-num">{formatUGX(totalExpensesSpent)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddExpense && (
                <button
                  onClick={onOpenAddExpense}
                  className="py-2.5 px-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log</span>
                </button>
              )}
              {onOpenExpenses && (
                <button
                  onClick={onOpenExpenses}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Office Debt Commitment Snapshot Card */}
          {debt && onOpenDebt && (
            <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] p-6 shadow-sm border border-amber-200/70 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Office Debt</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                      {Math.min(100, Math.round(((debt.paidAmount || 0) / (debt.totalDebt || 1)) * 100))}% Paid
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Remaining: <strong className="text-amber-700 dark:text-amber-400 font-mono-num">{formatUGX(Math.max(0, debt.totalDebt - (debt.paidAmount || 0)))}</strong> of {formatUGXShort(debt.totalDebt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="overview-open-debt-btn"
                  onClick={onOpenDebt}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <span>Pay Office Debt</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Savings Activity Ledger Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 transition-colors h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Savings Activity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest recorded deposits to categories
                </p>
              </div>
              {recentEntries.length > 0 && (
                <button
                  id="view-all-history-btn"
                  onClick={onOpenLedger}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
                >
                  <span>View full ({recentEntries.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentEntries.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  No savings entries recorded yet.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Use "+Save" or "Save Deposit" above to start your first daily streak!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentEntries.slice(0, 5).map((entry) => {
                  const cat = categories[entry.categoryId] || categories.home_rent;
                  const isHome = entry.categoryId === 'home_rent';
                  const isInternet = entry.categoryId === 'internet';
                  const EntryIcon = isHome ? Home : isInternet ? Wifi : Briefcase;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
                            isHome
                              ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400'
                              : isInternet
                              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          <EntryIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono-num">• {entry.date}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {entry.note ? entry.note : 'Deposit'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="font-mono-num font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                          +{formatUGX(entry.amount)}
                        </div>
                        {onEditEntry && (
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            title="Edit deposit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
