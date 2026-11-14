import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Home,
  Wifi,
  Briefcase,
  Landmark,
  Receipt,
  History,
  Plus,
  ArrowRight,
  Settings,
  X,
  Keyboard,
} from 'lucide-react';
import { ActiveTab } from './CategoryTabs';
import { CategoryId } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenDeposit: (catId?: CategoryId) => void;
  onOpenExpense: () => void;
  onOpenDebt: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenDeposit,
  onOpenExpense,
  onOpenDebt,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'quick-deposit',
      title: 'Deposit / Save Money',
      subtitle: 'Log deposits to Home Rent, Internet, Work Rent',
      icon: Plus,
      category: 'Actions',
      action: () => {
        onClose();
        onOpenDeposit();
      },
    },
    {
      id: 'quick-expense',
      title: 'Log Daily Expense',
      subtitle: 'Record grocery, fuel, meals, or utilities spent',
      icon: Receipt,
      category: 'Actions',
      action: () => {
        onClose();
        onOpenExpense();
      },
    },
    {
      id: 'quick-debt',
      title: 'Pay Office Debt',
      subtitle: 'Record installment toward 720k UGX office loan',
      icon: Landmark,
      category: 'Actions',
      action: () => {
        onClose();
        onOpenDebt();
      },
    },
    {
      id: 'nav-overview',
      title: 'Go to Dashboard',
      subtitle: 'View overall budget completion, countdown & streaks',
      icon: LayoutDashboard,
      category: 'Navigation',
      action: () => {
        onClose();
        onSelectTab('overview');
      },
    },
    {
      id: 'nav-home',
      title: 'Home Rent Savings',
      subtitle: 'View and log rent deposits',
      icon: Home,
      category: 'Navigation',
      action: () => {
        onClose();
        onSelectTab('home_rent');
      },
    },
    {
      id: 'nav-internet',
      title: 'Internet & WiFi',
      subtitle: 'Monthly connectivity target and logs',
      icon: Wifi,
      category: 'Navigation',
      action: () => {
        onClose();
        onSelectTab('internet');
      },
    },
    {
      id: 'nav-work',
      title: 'Work Rent & Office Space',
      subtitle: 'Monthly commercial rent savings',
      icon: Briefcase,
      category: 'Navigation',
      action: () => {
        onClose();
        onSelectTab('work_rent');
      },
    },
    {
      id: 'nav-debt-view',
      title: 'Office Debt Desk (720,000 UGX)',
      subtitle: 'Full amortization schedule and repayments',
      icon: Landmark,
      category: 'Navigation',
      action: () => {
        onClose();
        onSelectTab('debt');
      },
    },
    {
      id: 'nav-ledger',
      title: 'Savings Ledger & Export',
      subtitle: 'Audit log of all historical deposits',
      icon: History,
      category: 'Navigation',
      action: () => {
        onClose();
        onSelectTab('history');
      },
    },
    {
      id: 'nav-settings',
      title: 'App Settings & Multi-Device Sync',
      subtitle: 'Account management, local backups & cloud sync',
      icon: Settings,
      category: 'Preferences',
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard shortcuts',
      subtitle: 'View navigation and action keys',
      icon: Keyboard,
      category: 'Preferences',
      action: () => {
        onClose();
        onOpenShortcuts();
      },
    },
  ];

  const filtered = actions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-zinc-950/60 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-surface shadow-floating border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white overflow-hidden transition-colors">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0 ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page... (e.g. Deposit, Debt, Rent)"
            className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 text-sm font-medium"
          />
          <kbd className="hidden sm:inline px-2 py-0.5 rounded-surface bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-mono font-bold">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-surface text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
              <p className="text-sm font-semibold">No commands matching "{query}"</p>
              <p className="text-xs mt-1">Try typing "deposit", "debt", "rent", or "expense".</p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-3 rounded-surface hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-surface bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded-surface bg-zinc-50 dark:bg-zinc-950 shrink-0 group-hover:text-indigo-500 transition-colors">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
          <span>Use keyboard hotkeys <kbd className="font-mono text-xs px-1 bg-white dark:bg-zinc-800 border rounded">D</kbd> for Deposit, <kbd className="font-mono text-xs px-1 bg-white dark:bg-zinc-800 border rounded">E</kbd> for Expense</span>
          <span>Vault Desktop</span>
        </div>
      </div>
    </div>
  );
};
