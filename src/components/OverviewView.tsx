import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Cloud,
  Edit3,
  Flame,
  Home,
  Landmark,
  Plus,
  Receipt,
  Wifi,
} from 'lucide-react';
import type { BudgetOverview, CategoryGoal, CategoryId, DebtGoal, ExpenseEntry, SavingsEntry, UserProfile } from '../types';
import { formatUGX } from '../lib/constants';

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
  const totalExpensesSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryList: CategoryGoal[] = [categories.home_rent, categories.internet, categories.work_rent];
  const debtPct = debt
    ? Math.min(100, Math.round(((debt.paidAmount || 0) / (debt.totalDebt || 1)) * 100))
    : 0;

  const handleBottomBarDeposit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = parseInt(quickAmount.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(amount) || amount <= 0) return;

    if (quickCat === 'all') {
      const categoryIds: CategoryId[] = ['home_rent', 'internet', 'work_rent'];
      if (onQuickAddMultiple) onQuickAddMultiple(categoryIds, amount);
      else categoryIds.forEach((categoryId) => onQuickAdd(categoryId, amount));
      return;
    }

    onQuickAdd(quickCat, amount);
  };

  return (
    <div id="overview-view" className="w-full space-y-6 px-4 pb-8 sm:px-6">
      <section aria-labelledby="overview-title" className="rounded-surface border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly savings</p>
            <h2 id="overview-title" className="mt-1 text-display font-semibold tracking-tight text-foreground">
              {formatUGX(overview.totalSaved)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">saved of {formatUGX(overview.totalTarget)} target</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-border px-3 text-sm text-foreground">
              <CalendarDays aria-hidden="true" size={16} strokeWidth={1.8} />
              <span><span className="font-mono-num tabular-nums">{overview.daysLeftInMonth}</span> days left</span>
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-border px-3 text-sm text-foreground">
              <Flame aria-hidden="true" size={16} strokeWidth={1.8} />
              <span><span className="font-mono-num tabular-nums">{overview.streakDays}</span> day streak</span>
            </span>
          </div>
        </div>

        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-foreground">Overall progress</span>
            <span className="font-mono-num tabular-nums font-semibold text-primary">{overview.overallPercentage}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-pill bg-muted"
            role="progressbar"
            aria-label="Overall savings progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.max(0, Math.min(100, overview.overallPercentage))}
          >
            <div
              className="h-full rounded-pill bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, overview.overallPercentage))}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Remaining</span>
              <strong className="font-mono-num tabular-nums font-semibold">{formatUGX(overview.totalRemaining)}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Daily pace needed</span>
              <strong className="font-mono-num tabular-nums font-semibold">{formatUGX(overview.requiredDailyRateTotal)}/day</strong>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>{user ? 'Cloud sync enabled' : 'Your records are saved on this device'}</span>
          </div>
          {!user && onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex min-h-11 items-center gap-2 rounded-surface px-3 text-sm font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sync across devices <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="category-goals-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 id="category-goals-title" className="text-xl font-semibold tracking-tight">Savings goals</h3>
            <p className="mt-1 text-sm text-muted-foreground">Choose a goal to see its deposits and history.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {categoryList.map((category) => {
            const current = category.currentAmount || 0;
            const target = category.targetAmount || 0;
            const remaining = Math.max(0, target - current);
            const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
            const complete = target > 0 && current >= target;
            const Icon = category.id === 'home_rent' ? Home : category.id === 'internet' ? Wifi : Briefcase;

            return (
              <article key={category.id} id={`category-card-${category.id}`} className="flex flex-col rounded-surface border border-border bg-card p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  aria-label={`Open ${category.name} goal`}
                  className="w-full rounded-surface text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-surface bg-muted text-foreground">
                      <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm sm:text-base font-semibold">{category.name}</h4>
                        <ChevronRight aria-hidden="true" size={16} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-0.5 flex items-baseline justify-between gap-2">
                        <strong className="font-mono-num tabular-nums text-lg font-semibold">{formatUGX(current)}</strong>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-pill bg-muted"
                    role="progressbar"
                    aria-label={`${category.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                  >
                    <div className="h-full rounded-pill bg-primary transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                    {complete ? (
                      <span className="inline-flex items-center gap-1 font-medium text-success">
                        <Check aria-hidden="true" size={16} strokeWidth={1.8} /> Goal reached
                      </span>
                    ) : (
                      <span className="font-medium text-muted-foreground">{formatUGX(remaining)} left</span>
                    )}
                    <span className="text-muted-foreground">Target {formatUGX(target)}</span>
                  </div>
                </button>

                <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={() => onQuickAdd(category.id, 5000)}
                    className="min-h-9 rounded-surface border border-border px-1.5 text-[11px] font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    +{formatUGX(5000)}
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickAdd(category.id, 10000)}
                    className="min-h-9 rounded-surface border border-border px-1.5 text-[11px] font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    +{formatUGX(10000)}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAddModal(category.id)}
                    aria-label={`Custom deposit to ${category.name}`}
                    title="Custom deposit amount"
                    className="inline-flex min-h-9 items-center justify-center gap-1 rounded-surface border border-border px-1.5 text-[11px] font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus aria-hidden="true" size={16} strokeWidth={1.8} />
                    Custom
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="quick-deposit-title" className="rounded-surface border border-border bg-card p-4 sm:p-5">
        <div className="mb-4">
          <h3 id="quick-deposit-title" className="text-xl font-semibold tracking-tight">Quick deposit</h3>
          <p className="mt-1 text-sm text-muted-foreground">Log the same amount to one goal or split it across all three.</p>
        </div>
        <form onSubmit={handleBottomBarDeposit} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="space-y-1.5">
            <label htmlFor="bar-deposit-input" className="text-sm font-medium">Amount (UGX)</label>
            <input
              id="bar-deposit-input"
              type="text"
              inputMode="numeric"
              value={quickAmount}
              onChange={(event) => setQuickAmount(event.target.value)}
              placeholder="5,000"
              className="min-h-11 w-full rounded-surface border border-input bg-background px-3 text-sm font-mono-num tabular-nums text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bar-category-select" className="text-sm font-medium">Savings goal</label>
            <select
              id="bar-category-select"
              value={quickCat}
              onChange={(event) => setQuickCat(event.target.value as CategoryId | 'all')}
              className="min-h-11 w-full rounded-surface border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All three goals (same amount each)</option>
              <option value="home_rent">Home Rent</option>
              <option value="internet">Internet</option>
              <option value="work_rent">Work Rent</option>
            </select>
          </div>
          <button
            id="bar-save-contribution-btn"
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-surface bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mb-0"
          >
            <Plus aria-hidden="true" size={16} strokeWidth={1.8} /> Save deposit
          </button>
        </form>
      </section>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <section aria-labelledby="expenses-snapshot-title" className="rounded-surface border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-surface bg-muted text-foreground">
                  <Receipt aria-hidden="true" size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 id="expenses-snapshot-title" className="text-base font-semibold">Daily expenses</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {expenses.length} records · <span className="font-mono-num tabular-nums">{formatUGX(totalExpensesSpent)}</span> spent
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onOpenAddExpense && (
                  <button type="button" onClick={onOpenAddExpense} className="min-h-11 rounded-surface border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Add expense
                  </button>
                )}
                {onOpenExpenses && (
                  <button type="button" onClick={onOpenExpenses} aria-label="View expenses" className="inline-flex size-11 items-center justify-center rounded-surface text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            </div>
          </section>

          {debt && onOpenDebt && (
            <section aria-labelledby="debt-snapshot-title" className="rounded-surface border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-surface bg-muted text-foreground">
                    <Landmark aria-hidden="true" size={20} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 id="debt-snapshot-title" className="text-base font-semibold">Office debt</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-mono-num tabular-nums">{debtPct}%</span> repaid ·{' '}
                      <span className="font-mono-num tabular-nums">{formatUGX(Math.max(0, debt.totalDebt - (debt.paidAmount || 0)))}</span> remaining
                    </p>
                  </div>
                </div>
                <button id="overview-open-debt-btn" type="button" onClick={onOpenDebt} className="inline-flex min-h-11 items-center gap-2 rounded-surface border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  View debt <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
                </button>
              </div>
            </section>
          )}
        </div>

        <section aria-labelledby="recent-savings-title" className="rounded-surface border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 id="recent-savings-title" className="text-base font-semibold">Recent deposits</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your latest savings entries.</p>
            </div>
            <button id="view-all-history-btn" type="button" onClick={onOpenLedger} className="inline-flex min-h-11 items-center gap-2 rounded-surface px-2 text-sm font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Ledger <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
            </button>
          </div>

          {recentEntries.length === 0 ? (
            <div className="rounded-surface border border-dashed border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">No deposits recorded yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Add your first deposit to start tracking a goal.</p>
              <button type="button" onClick={() => onOpenAddModal()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-surface bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Plus aria-hidden="true" size={16} strokeWidth={1.8} /> Add a deposit
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentEntries.slice(0, 5).map((entry) => {
                const category = categories[entry.categoryId] || categories.home_rent;
                const Icon = entry.categoryId === 'home_rent' ? Home : entry.categoryId === 'internet' ? Wifi : Briefcase;
                return (
                  <li key={entry.id} className="flex min-h-14 items-center justify-between gap-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon aria-hidden="true" size={18} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{category.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{entry.date}{entry.note ? ` · ${entry.note}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-mono-num tabular-nums text-sm font-semibold">+{formatUGX(entry.amount)}</span>
                      {onEditEntry && (
                        <button type="button" onClick={() => onEditEntry(entry)} aria-label={`Edit ${category.name} deposit`} title="Edit deposit" className="inline-flex size-11 items-center justify-center rounded-surface text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <Edit3 aria-hidden="true" size={16} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
