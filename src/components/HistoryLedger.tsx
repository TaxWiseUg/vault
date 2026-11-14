import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Calendar,
  Home,
  Wifi,
  Briefcase,
  FileSpreadsheet,
  Layers,
  Edit3,
} from 'lucide-react';
import { CategoryGoal, CategoryId, SavingsEntry } from '../types';
import { formatUGX } from '../lib/constants';

interface HistoryLedgerProps {
  entries: SavingsEntry[];
  categories: Record<CategoryId, CategoryGoal>;
  onEditEntry: (entry: SavingsEntry) => void;
  onDeleteEntry: (entry: SavingsEntry) => void;
}

export const HistoryLedger: React.FC<HistoryLedgerProps> = ({
  entries,
  categories,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    if (selectedFilter !== 'all' && entry.categoryId !== selectedFilter) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNote = entry.note?.toLowerCase().includes(q);
      const matchDate = entry.date?.toLowerCase().includes(q);
      const matchAmount = entry.amount.toString().includes(q);
      return matchNote || matchDate || matchAmount;
    }
    return true;
  });

  const totalSavedInFilter = filteredEntries.reduce((sum, e) => sum + e.amount, 0);

  const exportCSV = () => {
    if (entries.length === 0) return;

    const headers = ['ID', 'Date', 'Category', 'Amount (UGX)', 'Note', 'Created Timestamp'];
    const rows = entries.map((e) => [
      e.id,
      e.date,
      categories[e.categoryId]?.name || e.categoryId,
      e.amount,
      `"${(e.note || '').replace(/"/g, '""')}"`,
      new Date(e.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vault_Savings_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="history-ledger-view" className="space-y-6 px-4 sm:px-6 pb-28 max-w-4xl mx-auto">
      {/* Header & Export */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800/80 space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Savings Ledger</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Complete historical record of all deposits</p>
            </div>
          </div>

          <button
            id="export-csv-btn"
            onClick={exportCSV}
            disabled={entries.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all"
            title="Export CSV file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {(
              [
                { id: 'all', label: 'All Goals', icon: Layers },
                { id: 'home_rent', label: 'Home Rent', icon: Home },
                { id: 'internet', label: 'Internet', icon: Wifi },
                { id: 'work_rent', label: 'Work Rent', icon: Briefcase },
              ] as const
            ).map((item) => {
              const isSelected = selectedFilter === item.id;
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedFilter(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ItemIcon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by note, amount, or date..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-center px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Filtered Total:</span>
            <span className="font-mono-num font-black text-slate-900 dark:text-white sm:ml-2">
              {formatUGX(totalSavedInFilter)}
            </span>
          </div>
        </div>
      </div>

      {/* Entries List Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Records ({filteredEntries.length})
          </h3>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <History className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No savings records found</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {searchQuery ? 'Try clearing your search term' : 'Recorded deposits will appear here in chronological order.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEntries.map((entry) => {
              const cat = categories[entry.categoryId] || categories.home_rent;
              const isDeleting = confirmDeleteId === entry.id;
              const isHome = entry.categoryId === 'home_rent';
              const isInternet = entry.categoryId === 'internet';
              const CatIcon = isHome ? Home : isInternet ? Wifi : Briefcase;

              return (
                <div
                  key={entry.id}
                  id={`ledger-entry-${entry.id}`}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                        isHome
                          ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400'
                          : isInternet
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <CatIcon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono-num">• {entry.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {entry.note || 'Saving deposit'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-right">
                      <div className="font-mono-num font-black text-sm text-slate-900 dark:text-white">
                        +{formatUGX(entry.amount)}
                      </div>
                    </div>

                    {isDeleting ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onDeleteEntry(entry);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white shadow-sm"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          title="Edit deposit amount or details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(entry.id)}
                          className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
