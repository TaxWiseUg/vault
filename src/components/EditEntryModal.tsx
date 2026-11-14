import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  Wifi,
  Briefcase,
  Calendar,
  Tag,
  Check,
  Trash2,
  Edit3,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { CategoryGoal, CategoryId, SavingsEntry } from '../types';
import { formatUGX, formatUGXShort, QUICK_ADD_AMOUNTS, NOTE_PRESETS } from '../lib/constants';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface EditEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SavingsEntry | null;
  categories: Record<CategoryId, CategoryGoal>;
  onUpdateEntry: (updatedEntry: SavingsEntry, oldEntry: SavingsEntry) => Promise<void>;
  onDeleteEntry: (entry: SavingsEntry) => Promise<void>;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
  isOpen,
  onClose,
  entry,
  categories,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  useLockBodyScroll(isOpen);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('home_rent');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && entry) {
      setSelectedCategory(entry.categoryId);
      setAmount(entry.amount.toString());
      setNote(entry.note || '');
      setDate(entry.date || new Date().toISOString().split('T')[0]);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, entry]);

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

  if (!isOpen || !entry) return null;

  const currentCategory = categories[selectedCategory] || categories.home_rent;
  const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
  const amountDifference = numAmount - entry.amount;

  const handleQuickChip = (val: number) => {
    setAmount((prev) => {
      const cur = parseInt(prev.replace(/[^0-9]/g, ''), 10) || 0;
      return (cur + val).toString();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const updated: SavingsEntry = {
        ...entry,
        categoryId: selectedCategory,
        amount: numAmount,
        date,
        note: note.trim() || 'Savings deposit',
      };

      await onUpdateEntry(updated, entry);
      onClose();
    } catch (err) {
      console.error('Failed to update entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteEntry(entry);
      onClose();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/60 dark:bg-black/70 p-0 sm:p-4 animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-entry-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-surface shadow-floating border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header - Always visible at top */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-surface bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Edit3 className="w-5 h-5 stroke-[2.5] pointer-events-none" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Edit Deposit Record</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Correct money amount, category, or note</p>
            </div>
          </div>

          <button
            type="button"
            id="close-edit-modal-btn"
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
          <div className="p-6 pt-4 overflow-y-auto space-y-5 flex-1">

        {/* Delete confirmation banner */}
        {showDeleteConfirm ? (
          <div className="p-4 rounded-surface bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Are you sure you want to remove this deposit of {formatUGX(entry.amount)}?</span>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400/80">
              This amount will be deducted from {categories[entry.categoryId]?.name || 'the goal'}.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-3 rounded-surface bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5  transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Deleting...' : 'Yes, Delete Record'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-4 rounded-surface bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
              Goal Category
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  { id: 'home_rent' as CategoryId, label: 'Home Rent', icon: Home, borderCol: 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400' },
                  { id: 'internet' as CategoryId, label: 'Internet', icon: Wifi, borderCol: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
                  { id: 'work_rent' as CategoryId, label: 'Work Rent', icon: Briefcase, borderCol: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
                ] as const
              ).map((item) => {
                const isSelected = selectedCategory === item.id;
                const ItemIcon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`edit-select-${item.id}`}
                    onClick={() => setSelectedCategory(item.id)}
                    className={`p-3 rounded-surface border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? `${item.borderCol} ring-2 ring-indigo-500/20 `
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <ItemIcon className="w-5 h-5" />
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">{item.label}</div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono-num font-semibold">
                        {formatUGXShort(categories[item.id]?.targetAmount || 0)}
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
              <label className="font-bold text-zinc-700 dark:text-zinc-300">Amount Saved (UGX)</label>
              {entry.amount !== numAmount && (
                <span className="text-xs font-bold font-mono-num text-indigo-600 dark:text-indigo-400">
                  {amountDifference > 0 ? `+${formatUGX(amountDifference)}` : `${formatUGX(amountDifference)}`}
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                UGX
              </span>
              <input
                id="edit-amount-input"
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-14 pr-4 py-3.5 rounded-surface bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-xl font-black font-mono-num text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
                required
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div>
            <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Adjust amount quickly
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth -mx-1 px-1">
              {QUICK_ADD_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickChip(amt)}
                  className="py-2 px-3 rounded-surface bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-mono-num transition-colors shrink-0 whitespace-nowrap active:scale-95"
                >
                  +{formatUGX(amt)}
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
                placeholder="e.g. Daily change, client cash"
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

          {/* Impact Comparison Preview */}
          <div className="p-3.5 rounded-surface bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span>Original record:</span>
              <span className="font-mono-num font-semibold text-zinc-700 dark:text-zinc-300">
                {categories[entry.categoryId]?.name} • {formatUGX(entry.amount)} ({entry.date})
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/70 dark:border-zinc-700/70 font-bold">
              <span className="text-zinc-700 dark:text-zinc-300">Updated to:</span>
              <span className="font-mono-num text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>{currentCategory.name}</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span>{formatUGX(numAmount)}</span>
              </span>
            </div>
          </div>

            </div>
          </div>

          {/* Sticky Footer: Action Buttons */}
          <div className="p-4 sm:px-6 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 shrink-0 flex items-center gap-3">
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3.5 rounded-surface bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                title="Delete this record"
              >
                <Trash2 className="w-4 h-4 pointer-events-none" />
              </button>
            )}

            <button
              type="button"
              id="cancel-edit-entry-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-3.5 rounded-surface bg-zinc-200/80 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>

            <button
              id="save-edited-entry-btn"
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="flex-1 py-3.5 px-4 rounded-surface bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all  active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3] pointer-events-none" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
