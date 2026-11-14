import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Check,
  Edit2,
  Edit3,
  Home,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  TrendingUp,
  Wifi,
  X,
} from 'lucide-react';
import type { CategoryGoal, CategoryId, SavingsEntry } from '../types';
import { formatUGX, QUICK_ADD_AMOUNTS } from '../lib/constants';

interface CategoryDetailViewProps {
  category: CategoryGoal;
  entries: SavingsEntry[];
  daysLeftInMonth: number;
  onBack: () => void;
  onOpenAddModal: (catId: CategoryId) => void;
  onQuickAdd: (catId: CategoryId, amount: number) => void;
  onEditEntry?: (entry: SavingsEntry) => void;
  onDeleteEntry: (entry: SavingsEntry) => void;
  onUpdateTarget: (catId: CategoryId, newTarget: number) => void;
  onResetProgress: (catId: CategoryId) => void;
}

export const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({
  category,
  entries,
  daysLeftInMonth,
  onBack,
  onOpenAddModal,
  onQuickAdd,
  onEditEntry,
  onDeleteEntry,
  onUpdateTarget,
  onResetProgress,
}) => {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(category.targetAmount.toString());
  const [targetError, setTargetError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const current = category.currentAmount || 0;
  const target = category.targetAmount || 0;
  const remaining = Math.max(0, target - current);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const isComplete = target > 0 && current >= target;
  const categoryEntries = entries.filter((entry) => entry.categoryId === category.id);
  const averageDeposit = categoryEntries.length > 0 ? Math.round(current / categoryEntries.length) : 0;
  const dailyNeeded = daysLeftInMonth > 0 ? Math.ceil(remaining / daysLeftInMonth) : remaining;
  const CategoryIcon = category.id === 'home_rent' ? Home : category.id === 'internet' ? Wifi : Briefcase;

  const handleSaveTarget = (event: React.FormEvent) => {
    event.preventDefault();
    const value = parseInt(targetInput.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(value) || value <= 0) {
      setTargetError('Enter a target greater than UGX 0.');
      return;
    }
    onUpdateTarget(category.id, value);
    setTargetError(null);
    setIsEditingTarget(false);
  };

  return (
    <div id={`category-detail-${category.id}`} className="w-full space-y-3 px-3 pb-8 sm:space-y-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          id="back-to-overview-btn"
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-surface border border-border bg-card px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.8} /> Overview
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTargetInput(category.targetAmount.toString());
              setTargetError(null);
              setIsEditingTarget((editing) => !editing);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-surface border border-border bg-card px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Edit2 aria-hidden="true" size={16} strokeWidth={1.8} /> Edit target
          </button>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            aria-label={`Reset ${category.name} progress`}
            title="Reset cycle"
            className="inline-flex size-11 items-center justify-center rounded-surface border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw aria-hidden="true" size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {isEditingTarget && (
        <form onSubmit={handleSaveTarget} className="space-y-3 rounded-surface border border-border bg-card p-4 sm:p-5">
          <div>
            <h3 className="text-base font-semibold">Monthly target</h3>
            <p className="mt-1 text-sm text-muted-foreground">Update the goal amount for {category.name}.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="category-target-input" className="text-sm font-medium">Target amount (UGX)</label>
            <input
              id="category-target-input"
              type="number"
              min="1"
              inputMode="numeric"
              value={targetInput}
              onChange={(event) => {
                setTargetInput(event.target.value);
                setTargetError(null);
              }}
              aria-invalid={Boolean(targetError)}
              aria-describedby={targetError ? 'category-target-error' : undefined}
              className="min-h-11 w-full rounded-surface border border-input bg-background px-3 text-sm font-mono-num tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {targetError && <p id="category-target-error" role="alert" className="text-sm text-destructive">{targetError}</p>}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setIsEditingTarget(false)} className="inline-flex min-h-11 items-center gap-2 rounded-surface border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X aria-hidden="true" size={16} strokeWidth={1.8} /> Cancel
            </button>
            <button type="submit" className="min-h-11 rounded-surface bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Save target
            </button>
          </div>
        </form>
      )}

      {showResetConfirm && (
        <div role="alertdialog" aria-labelledby="reset-category-title" aria-describedby="reset-category-description" className="space-y-3 rounded-surface border border-warning/40 bg-warning/10 p-4">
          <div>
            <h3 id="reset-category-title" className="text-base font-semibold">Reset this savings cycle?</h3>
            <p id="reset-category-description" className="mt-1 text-sm text-muted-foreground">
              {category.name} will return to UGX 0. Existing deposits will stay in the ledger.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setShowResetConfirm(false)} className="min-h-11 rounded-surface border border-border bg-card px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onResetProgress(category.id);
                setShowResetConfirm(false);
              }}
              className="min-h-11 rounded-surface bg-destructive px-3 text-sm font-semibold text-white hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Reset cycle
            </button>
          </div>
        </div>
      )}

      <section aria-labelledby="category-title" className="space-y-3 rounded-surface border border-border bg-card p-3 sm:space-y-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3 sm:pb-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-surface bg-muted text-foreground">
              <CategoryIcon aria-hidden="true" size={24} strokeWidth={1.8} />
            </span>
            <div>
              <h2 id="category-title" className="text-xl font-semibold tracking-tight sm:text-display">{category.name}</h2>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{category.description}</p>
            </div>
          </div>
          {isComplete && (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-pill bg-success/10 px-3 text-sm font-medium text-success">
              <Check aria-hidden="true" size={16} strokeWidth={1.8} /> Goal reached
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-surface bg-muted/50 p-2 sm:p-3">
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">Target</p>
            <p className="mt-0.5 truncate font-mono-num tabular-nums text-xs font-semibold sm:text-base">{formatUGX(target)}</p>
          </div>
          <div className="rounded-surface bg-muted/50 p-2 sm:p-3">
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">Saved</p>
            <p className="mt-0.5 truncate font-mono-num tabular-nums text-xs font-semibold sm:text-base">{formatUGX(current)}</p>
          </div>
          <div className="rounded-surface bg-muted/50 p-2 sm:p-3">
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">Left</p>
            <p className="mt-0.5 truncate font-mono-num tabular-nums text-xs font-semibold sm:text-base">{formatUGX(remaining)}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Goal progress</span>
            <span className="font-mono-num tabular-nums font-semibold">{pct}%</span>
          </div>
          <div role="progressbar" aria-label={`${category.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2.5 overflow-hidden rounded-pill bg-muted">
            <div className="h-full rounded-pill bg-primary transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-surface border border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <TrendingUp aria-hidden="true" size={16} strokeWidth={1.8} className="text-muted-foreground" />
            <p className="text-xs font-medium sm:text-sm">{isComplete ? 'Goal reached' : `${formatUGX(dailyNeeded)}/day needed`}</p>
          </div>
          <span className="text-[11px] text-muted-foreground">{daysLeftInMonth}d left</span>
        </div>
      </section>

      <section aria-labelledby="quick-deposit-heading" className="space-y-2 rounded-surface border border-border bg-card p-3 sm:space-y-3 sm:p-5">
        <div>
          <h3 id="quick-deposit-heading" className="text-base font-semibold">Quick deposits</h3>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">Add a preset amount or enter a custom deposit.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_ADD_AMOUNTS.map((amount) => (
            <button
              key={amount}
              id={`detail-quick-add-${amount}`}
              type="button"
              onClick={() => onQuickAdd(category.id, amount)}
              className="min-h-10 rounded-surface border border-border px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            >
              +{formatUGX(amount)}
            </button>
          ))}
        </div>
        <button
          id="detail-custom-deposit-btn"
          type="button"
          onClick={() => onOpenAddModal(category.id)}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-surface bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        >
          <Plus aria-hidden="true" size={16} strokeWidth={1.8} /> Custom amount and note
        </button>
      </section>

      <section aria-labelledby="category-ledger-title" className="space-y-3 rounded-surface border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 id="category-ledger-title" className="text-base font-semibold">{category.name} deposits ({categoryEntries.length})</h3>
            <p className="mt-1 text-sm text-muted-foreground">Average deposit: <span className="font-mono-num tabular-nums">{formatUGX(averageDeposit)}</span></p>
          </div>
        </div>
        {categoryEntries.length === 0 ? (
          <div className="rounded-surface border border-dashed border-border bg-muted/40 p-4">
            <p className="text-sm font-medium">No deposits in this goal yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Use a quick amount above to record the first one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {categoryEntries.map((entry) => (
              <li key={entry.id} id={`category-entry-${entry.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.note || 'Savings deposit'}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-mono-num tabular-nums text-sm font-semibold">+{formatUGX(entry.amount)}</span>
                  {onEditEntry && (
                    <button type="button" onClick={() => onEditEntry(entry)} aria-label="Edit deposit" title="Edit deposit" className="inline-flex size-11 items-center justify-center rounded-surface text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Edit3 aria-hidden="true" size={16} strokeWidth={1.8} />
                    </button>
                  )}
                  <button type="button" onClick={() => onDeleteEntry(entry)} aria-label="Delete deposit" title="Delete deposit" className="inline-flex size-11 items-center justify-center rounded-surface text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
