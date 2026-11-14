import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  Wifi,
  Briefcase,
  Plus,
  Calendar,
  Tag,
  Check,
  Sparkles,
  ArrowRight,
  PartyPopper,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CategoryGoal, CategoryId, SavingsEntry } from '../types';
import { formatUGX, formatUGXShort, QUICK_ADD_AMOUNTS, NOTE_PRESETS } from '../lib/constants';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Record<CategoryId, CategoryGoal>;
  initialCategoryId?: CategoryId;
  onSaveEntry: (entry: Omit<SavingsEntry, 'id'>) => Promise<void>;
  onSaveMultipleEntries?: (entries: Array<Omit<SavingsEntry, 'id'>>) => Promise<void>;
}

const ALL_CATEGORY_IDS: CategoryId[] = ['home_rent', 'internet', 'work_rent'];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialCategoryId = 'home_rent',
  onSaveEntry,
  onSaveMultipleEntries,
}) => {
  useLockBodyScroll(isOpen);

  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([initialCategoryId]);
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategories([initialCategoryId || 'home_rent']);
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, initialCategoryId]);

  // Keyboard shortcut: Escape to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
  const isAllSelected = selectedCategories.length === ALL_CATEGORY_IDS.length;
  const totalDepositAmount = numAmount * selectedCategories.length;

  const handleToggleCategory = (catId: CategoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        // Prevent deselecting all - must keep at least 1 category
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Revert to just the initial or first category
      setSelectedCategories([initialCategoryId || 'home_rent']);
    } else {
      setSelectedCategories([...ALL_CATEGORY_IDS]);
    }
  };

  const handleSelectOnly = (catId: CategoryId, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCategories([catId]);
  };

  const handleQuickChip = (val: number) => {
    setAmount((prev) => {
      const cur = parseInt(prev.replace(/[^0-9]/g, ''), 10) || 0;
      return (cur + val).toString();
    });
  };

  const handlePresetAll = (val: number) => {
    setSelectedCategories([...ALL_CATEGORY_IDS]);
    setAmount(val.toString());
  };

  // Check if any selected category will reach its goal with this deposit
  const willAnyReachGoal = selectedCategories.some((catId) => {
    const cat = categories[catId] || categories.home_rent;
    const currentSaved = cat.currentAmount || 0;
    const target = cat.targetAmount;
    return currentSaved + numAmount >= target && currentSaved < target;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || selectedCategories.length === 0) return;

    setIsSubmitting(true);
    try {
      if (willAnyReachGoal) {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#F97316', '#3B82F6', '#10B981', '#EC4899'],
        });
      }

      const defaultNote =
        note.trim() ||
        (selectedCategories.length > 1
          ? `Deposit to ${selectedCategories.length} categories`
          : 'Mini-deposit');

      const entriesToCreate: Array<Omit<SavingsEntry, 'id'>> = selectedCategories.map((catId) => ({
        categoryId: catId,
        amount: numAmount,
        date,
        note: defaultNote,
        createdAt: Date.now(),
      }));

      if (onSaveMultipleEntries && entriesToCreate.length > 1) {
        await onSaveMultipleEntries(entriesToCreate);
      } else {
        for (const entry of entriesToCreate) {
          await onSaveEntry(entry);
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to save deposit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/60 dark:bg-black/70 p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="quick-add-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-surface shadow-floating border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in duration-200"
      >
        {/* Header - Always visible at top */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-surface bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5] pointer-events-none" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Record Deposit</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Deposit to one, multiple, or all accounts at once
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-add-modal-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close modal"
            className="p-2 rounded-surface bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4 pointer-events-none" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 overflow-y-auto space-y-4 flex-1">
          {/* Category Selector with Multi-Account Capability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Select Destination Accounts ({selectedCategories.length} selected)
              </label>

              {/* Quick Select All Button */}
              <button
                type="button"
                id="modal-select-all-categories-btn"
                onClick={handleSelectAll}
                className={`text-xs font-bold px-2.5 py-1 rounded-surface flex items-center gap-1.5 transition-all ${
                  isAllSelected
                    ? 'bg-indigo-600 text-white '
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAllSelected ? 'All 3 Selected ✓' : 'Select All 3'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'home_rent' as CategoryId,
                    label: 'Home Rent',
                    icon: Home,
                    borderCol: 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
                  },
                  {
                    id: 'internet' as CategoryId,
                    label: 'Internet',
                    icon: Wifi,
                    borderCol: 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
                  },
                  {
                    id: 'work_rent' as CategoryId,
                    label: 'Work Rent',
                    icon: Briefcase,
                    borderCol: 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
                  },
                ] as const
              ).map((item) => {
                const isSelected = selectedCategories.includes(item.id);
                const catObj = categories[item.id] || categories.home_rent;
                const catSaved = catObj.currentAmount || 0;
                const catRem = Math.max(0, catObj.targetAmount - catSaved);
                const ItemIcon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`modal-select-${item.id}`}
                    onClick={() => handleToggleCategory(item.id)}
                    className={`p-3 rounded-surface border text-left flex flex-col justify-between transition-all relative group ${
                      isSelected
                        ? `${item.borderCol} ring-2 ring-indigo-500/30 `
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 opacity-60 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <ItemIcon className="w-5 h-5" />
                      <div
                        className={`w-5 h-5 rounded-surface flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white '
                            : 'bg-zinc-200 dark:bg-zinc-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                        <span>{item.label}</span>
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono-num font-semibold">
                        {formatUGXShort(catSaved)} / {formatUGXShort(catObj.targetAmount)}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-mono-num font-bold mt-0.5">
                        {catRem > 0 ? `${formatUGXShort(catRem)} left` : 'Completed'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-zinc-700 dark:text-zinc-300">
                {selectedCategories.length > 1
                  ? 'Deposit Amount (Per Account)'
                  : 'Deposit Amount (UGX)'}
              </label>
              {selectedCategories.length > 1 && (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-surface font-mono">
                  Applied to each of the {selectedCategories.length} selected
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                UGX
              </span>
              <input
                id="deposit-amount-input"
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-14 pr-4 py-3.5 rounded-surface bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-xl font-black font-mono-num text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                required
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              <span>Quick Amount Shortcuts</span>
              <span className="normal-case font-semibold text-indigo-600 dark:text-indigo-400">
                Tap to increment or set for all
              </span>
            </div>

            {/* Per-account increments */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth -mx-1 px-1">
              {QUICK_ADD_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickChip(amt)}
                  className="py-2.5 px-3.5 rounded-surface bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono-num transition-colors shrink-0 whitespace-nowrap active:scale-95 "
                >
                  +{formatUGX(amt)}
                </button>
              ))}
            </div>

            {/* Quick multi-account presets */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs font-bold text-zinc-400 uppercase shrink-0">
                Deposit on All:
              </span>
              {[
                { val: 5000, label: '5k on All (15k)' },
                { val: 10000, label: '10k on All (30k)' },
                { val: 20000, label: '20k on All (60k)' },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handlePresetAll(p.val)}
                  className="py-1.5 px-2.5 rounded-surface bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-900 shrink-0 transition-colors active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-surface bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 font-mono-num focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span>Note / Memo</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  selectedCategories.length > 1
                    ? 'e.g. Multi-account split deposit'
                    : 'e.g. Daily change, client cash'
                }
                className="w-full px-3 py-2.5 rounded-surface bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
              />
            </div>
          </div>

          {/* Quick Note Tags */}
          <div className="flex flex-wrap gap-1.5">
            {NOTE_PRESETS.slice(0, 4).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setNote(preset)}
                className="text-xs font-semibold px-2.5 py-1 rounded-surface bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Progress Impact Preview for All Selected Categories */}
          {numAmount > 0 && selectedCategories.length > 0 && (
            <div className="p-4 rounded-surface bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-indigo-100/80 dark:border-indigo-900/60">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    Total Deposit:{' '}
                    <strong className="text-indigo-700 dark:text-indigo-300 font-mono-num text-sm">
                      {formatUGX(totalDepositAmount)}
                    </strong>
                  </span>
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {selectedCategories.length} {selectedCategories.length === 1 ? 'account' : 'accounts'} ×{' '}
                  {formatUGX(numAmount)}
                </span>
              </div>

              {/* Breakdown per selected category */}
              <div className="space-y-2">
                {selectedCategories.map((catId) => {
                  const cat = categories[catId] || categories.home_rent;
                  const cur = cat.currentAmount || 0;
                  const proj = cur + numAmount;
                  const target = cat.targetAmount;
                  const willComplete = proj >= target && cur < target;

                  return (
                    <div
                      key={catId}
                      className="p-2.5 rounded-surface bg-white dark:bg-zinc-900 border border-indigo-100/60 dark:border-zinc-800 flex items-center justify-between text-xs gap-2"
                    >
                      <div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span>{cat.name}</span>
                          {willComplete && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-0.5">
                              <PartyPopper className="w-2.5 h-2.5" />
                              <span>Goal Reached!</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          Remaining after: {formatUGX(Math.max(0, target - proj))}
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold">
                        <div className="text-zinc-400 text-xs line-through">{formatUGX(cur)}</div>
                        <div className="text-indigo-600 dark:text-indigo-400 font-black">{formatUGX(proj)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          </div>

          {/* Sticky Footer: Action Buttons */}
          <div className="p-4 sm:px-6 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 shrink-0 flex items-center gap-3">
            <button
              type="button"
              id="cancel-add-modal-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-5 py-3.5 rounded-surface bg-zinc-200/80 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              id="confirm-save-deposit-btn"
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || selectedCategories.length === 0}
              className="flex-1 py-3.5 px-4 rounded-surface bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all  active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3] pointer-events-none" />
              <span>
                {isSubmitting
                  ? 'Recording...'
                  : selectedCategories.length > 1
                  ? `Deposit ${formatUGX(numAmount)} on ${selectedCategories.length} Accounts (${formatUGX(
                      totalDepositAmount
                    )})`
                  : `Deposit ${numAmount > 0 ? formatUGX(numAmount) : ''}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

