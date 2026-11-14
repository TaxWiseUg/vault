import React, { useState } from 'react';
import {
  Home,
  Wifi,
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  RotateCcw,
  Edit2,
  Edit3,
  ArrowLeft,
  TrendingUp,
  Target,
} from 'lucide-react';
import { CategoryGoal, CategoryId, SavingsEntry } from '../types';
import { formatUGX, formatUGXShort, QUICK_ADD_AMOUNTS } from '../lib/constants';

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const current = category.currentAmount || 0;
  const target = category.targetAmount;
  const remaining = Math.max(0, target - current);
  const pct = Math.min(100, Math.round((current / target) * 100));
  const isComplete = current >= target;

  const categoryEntries = entries.filter((e) => e.categoryId === category.id);
  const totalEntriesCount = categoryEntries.length;
  const averageDeposit = totalEntriesCount > 0 ? Math.round(current / totalEntriesCount) : 0;
  const dailyNeeded = daysLeftInMonth > 0 ? Math.ceil(remaining / daysLeftInMonth) : remaining;

  const CategoryIcon = category.id === 'home_rent' ? Home : category.id === 'internet' ? Wifi : Briefcase;
  let badgeClass = 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400';
  let iconBgClass = 'bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400';
  let remainingColor = 'text-orange-500 dark:text-orange-400';
  let progressFill = 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]';
  let quickAddHover = 'hover:bg-orange-50 dark:hover:bg-orange-950/50 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-800';

  if (category.id === 'internet') {
    badgeClass = 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400';
    iconBgClass = 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400';
    remainingColor = 'text-blue-500 dark:text-blue-400';
    progressFill = 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]';
    quickAddHover = 'hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800';
  } else if (category.id === 'work_rent') {
    badgeClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400';
    iconBgClass = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400';
    remainingColor = 'text-emerald-500 dark:text-emerald-400';
    progressFill = 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
    quickAddHover = 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800';
  }

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(targetInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      onUpdateTarget(category.id, val);
      setIsEditingTarget(false);
    }
  };

  return (
    <div id={`category-detail-${category.id}`} className="space-y-6 px-4 sm:px-6 pb-28 max-w-4xl mx-auto">
      {/* Top navigation header */}
      <div className="flex items-center justify-between pt-1">
        <button
          id="back-to-overview-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetInput(category.targetAmount.toString());
              setIsEditingTarget(!isEditingTarget);
            }}
            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Edit Target"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Target</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 text-xs flex items-center gap-1 shadow-sm"
            title="Mark Paid / Reset Cycle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Target Form Modal/Card */}
      {isEditingTarget && (
        <form
          onSubmit={handleSaveTarget}
          className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-lg space-y-3"
        >
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Set Monthly Target for {category.name}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 130000"
            />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">UGX</span>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingTarget(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none"
            >
              Save Target
            </button>
          </div>
        </form>
      )}

      {/* Reset Confirmation Prompt */}
      {showResetConfirm && (
        <div className="p-5 rounded-[28px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
          <div className="text-sm font-bold text-rose-900 dark:text-rose-300">
            Mark {category.name} as Paid & Start New Cycle?
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
            This will reset your current savings balance for {category.name} back to 0 UGX for the new cycle. Your previous transaction entries will remain safely in the ledger.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onResetProgress(category.id);
                setShowResetConfirm(false);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-200 dark:shadow-none"
            >
              Reset for Next Month
            </button>
          </div>
        </div>
      )}

      {/* Hero Category Progress Card */}
      <div className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-3xl ${iconBgClass} flex items-center justify-center shadow-inner`}>
              <CategoryIcon className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{category.name}</h2>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">{category.description}</p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${badgeClass}`}>
              Target: {formatUGXShort(target)}
            </span>
          </div>
        </div>

        {/* Big Numbers Grid: Target / Saved / Remaining */}
        <div className="grid grid-cols-3 gap-3 mt-6 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Target</div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono-num mt-0.5">
              {formatUGXShort(target)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Monthly goal</div>
          </div>

          <div className="text-center border-x border-slate-200/80 dark:border-slate-700/80 px-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Saved</div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono-num mt-0.5">
              {formatUGX(current)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{pct}% reached</div>
          </div>

          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Remaining</div>
            <div className={`text-base sm:text-lg font-black ${remainingColor} font-mono-num mt-0.5`}>
              {formatUGX(remaining)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">To complete</div>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>Goal Progress</span>
            <span className="font-mono-num font-black text-slate-900 dark:text-white text-sm">{pct}% Completed</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
            <div
              className={`${progressFill} h-full rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Milestone markers */}
          <div className="grid grid-cols-4 text-center text-[10px] font-mono-num font-bold text-slate-400 dark:text-slate-500 pt-1">
            <span className={pct >= 25 ? 'text-indigo-600 dark:text-indigo-400' : ''}>25%</span>
            <span className={pct >= 50 ? 'text-indigo-600 dark:text-indigo-400' : ''}>50%</span>
            <span className={pct >= 75 ? 'text-indigo-600 dark:text-indigo-400' : ''}>75%</span>
            <span className={`flex items-center justify-center gap-0.5 ${pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              <span>100%</span>
              <Target className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Pacing recommendation banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {isComplete ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Goal fully achieved this cycle!</span>
                  </span>
                ) : (
                  <span>
                    Save <strong className="text-indigo-600 dark:text-indigo-400 font-mono-num">{formatUGXShort(dailyNeeded)}/day</strong>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {isComplete ? 'Ready for payment' : `Based on ${daysLeftInMonth} days remaining in cycle`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick 1-Tap Deposit Shortcuts */}
      <div className="rounded-[32px] sm:rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 sm:p-7 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quick Micro-Contributions
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">1-tap to add immediately</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth -mx-1 px-1">
          {QUICK_ADD_AMOUNTS.map((amt) => (
            <button
              key={amt}
              id={`detail-quick-add-${amt}`}
              onClick={() => onQuickAdd(category.id, amt)}
              className={`py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all font-mono-num shrink-0 whitespace-nowrap active:scale-95 shadow-sm ${quickAddHover}`}
            >
              <span>+{formatUGX(amt)}</span>
            </button>
          ))}
        </div>

        <button
          id="detail-custom-deposit-btn"
          onClick={() => onOpenAddModal(category.id)}
          className="w-full py-4 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-200 dark:shadow-none active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Custom Amount / Add Memo</span>
        </button>
      </div>

      {/* Category history ledger */}
      <div className="rounded-[32px] sm:rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 sm:p-7 space-y-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {category.name} Log ({categoryEntries.length})
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Average deposit: {formatUGX(averageDeposit)}</p>
          </div>
        </div>

        {categoryEntries.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">No entries recorded for {category.name} yet.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Tap a quick-deposit button above to record your first amount!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {categoryEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {entry.note ? entry.note : 'Mini-saving deposit'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">{entry.date}</div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="font-mono-num font-black text-sm text-slate-900 dark:text-white">
                    +{formatUGX(entry.amount)}
                  </div>
                  {onEditEntry && (
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      title="Edit entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteEntry(entry)}
                    className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
