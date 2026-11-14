import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ + K', desc: 'Open Command Palette' },
    { key: 'D', desc: 'Quick Deposit / Savings' },
    { key: 'E', desc: 'Log New Expense' },
    { key: 'P', desc: 'Pay Office Debt' },
    { key: '1', desc: 'Go to Dashboard' },
    { key: '2', desc: 'Go to Home Rent' },
    { key: '3', desc: 'Go to Internet' },
    { key: '4', desc: 'Go to Work Rent' },
    { key: '5', desc: 'Go to Office Debt' },
    { key: '6', desc: 'Go to Expenses' },
    { key: '7', desc: 'Go to Ledger' },    { key: '?', desc: 'Show Keyboard Shortcuts' },
    { key: 'Esc', desc: 'Close open dialogs' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-surface p-6 shadow-floating border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-surface bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Desktop Shortcuts</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Speed up your budgeting workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-surface text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-surface bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/80"
            >
              <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                {sc.desc}
              </span>
              <kbd className="px-2.5 py-1 rounded-surface bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700  text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-surface bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs  transition-all active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
