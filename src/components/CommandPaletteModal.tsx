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
  Sparkles,
  Plus,
  ArrowRight,
  Settings,
  X,
  CreditCard,
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
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenDeposit,
  onOpenExpense,
  onOpenDebt,
  onOpenSettings,
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
      id: 'nav-ai',
      title: 'AI Financial Coach (Gemini)',
      subtitle: 'Smart insights and budgeting advice',
      icon: Sparkles,
      category: 'Navigation',
      action: () => {
        onClose();
        onSelectTab('ai');
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
  ];

  const filtered = actions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white overflow-hidden transition-colors">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page... (e.g. Deposit, Debt, Rent)"
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium"
          />
          <kbd className="hidden sm:inline px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-mono font-bold">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
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
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-950 shrink-0 group-hover:text-indigo-500 transition-colors">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Use keyboard hotkeys <kbd className="font-mono text-[10px] px-1 bg-white dark:bg-slate-800 border rounded">D</kbd> for Deposit, <kbd className="font-mono text-[10px] px-1 bg-white dark:bg-slate-800 border rounded">E</kbd> for Expense</span>
          <span>Vault Desktop</span>
        </div>
      </div>
    </div>
  );
};
