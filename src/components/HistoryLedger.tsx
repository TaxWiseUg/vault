import React, { useState } from 'react';
import {
  Briefcase,
  Download,
  History,
  Home,
  Layers,
  Search,
  Trash2,
  Wifi,
  X,
  Edit3,
} from 'lucide-react';
import type { CategoryGoal, CategoryId, SavingsEntry } from '../types';
import type { DebtPaymentEntry } from '../types';
import { formatUGX } from '../lib/constants';

interface HistoryLedgerProps {
  entries: SavingsEntry[];
  categories: Record<CategoryId, CategoryGoal>;
  onEditEntry: (entry: SavingsEntry) => void;
  onDeleteEntry: (entry: SavingsEntry) => void;
  debtPayments?: DebtPaymentEntry[];
}

export const HistoryLedger: React.FC<HistoryLedgerProps> = ({ entries, categories, onEditEntry, onDeleteEntry, debtPayments = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState<CategoryId | 'office_debt' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    if (selectedFilter === 'office_debt' || (selectedFilter !== 'all' && entry.categoryId !== selectedFilter)) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return Boolean(
      entry.note?.toLowerCase().includes(query) ||
      entry.date?.toLowerCase().includes(query) ||
      entry.amount.toString().includes(query)
    );
  });
  const filteredPayments = debtPayments.filter((payment) => selectedFilter === 'office_debt' && (!searchQuery || `${payment.date} ${payment.note || ''} ${payment.amount}`.toLowerCase().includes(searchQuery.toLowerCase())));
  const totalSavedInFilter = selectedFilter === 'office_debt' ? filteredPayments.reduce((sum, payment) => sum + payment.amount, 0) : filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const clearFilters = () => {
    setSelectedFilter('all');
    setSearchQuery('');
  };

  const exportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['ID', 'Date', 'Category', 'Amount (UGX)', 'Note', 'Created Timestamp'];
    const rows = entries.map((entry) => [
      entry.id,
      entry.date,
      categories[entry.categoryId]?.name || entry.categoryId,
      entry.amount,
      `"${(entry.note || '').replace(/"/g, '""')}"`,
      new Date(entry.createdAt).toISOString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Vault_Savings_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filters = [
    { id: 'all' as const, label: 'All goals', icon: Layers },
    { id: 'home_rent' as const, label: 'Home Rent', icon: Home },
    { id: 'internet' as const, label: 'Internet', icon: Wifi },
    { id: 'work_rent' as const, label: 'Work Rent', icon: Briefcase },
    { id: 'office_debt' as const, label: 'Office Debt', icon: History },
  ];

  return (
    <div id="history-ledger-view" className="w-full space-y-5 px-4 pb-8 sm:px-6">
      <section aria-labelledby="ledger-title" className="space-y-4 rounded-surface border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-surface bg-muted text-foreground">
              <History aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h2 id="ledger-title" className="text-xl font-semibold tracking-tight">Savings ledger</h2>
              <p className="mt-1 text-sm text-muted-foreground">A searchable record of every savings deposit.</p>
            </div>
          </div>
          <button
            id="export-csv-btn"
            type="button"
            onClick={exportCSV}
            disabled={entries.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-surface border border-border px-3 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Export all records as CSV"
          >
            <Download aria-hidden="true" size={16} strokeWidth={1.8} /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="group" aria-label="Filter history">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const selected = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedFilter(filter.id)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-surface border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                <Icon aria-hidden="true" size={16} strokeWidth={1.8} /> {filter.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-1.5">
            <label htmlFor="ledger-search" className="text-sm font-medium">Search deposits</label>
            <div className="relative">
              <Search aria-hidden="true" size={16} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 -tranzinc-y-1/2 text-muted-foreground" />
              <input
                id="ledger-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search note, amount, or date"
                className="min-h-11 w-full rounded-surface border border-input bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="flex min-h-11 items-center justify-between gap-5 rounded-surface border border-border bg-muted/40 px-3 text-sm sm:mt-6">
            <span className="text-muted-foreground">Filtered total</span>
            <strong className="font-mono-num tabular-nums">{formatUGX(totalSavedInFilter)}</strong>
          </div>
        </div>
      </section>

      <section aria-labelledby="ledger-records-title" className="space-y-3 rounded-surface border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 id="ledger-records-title" className="text-base font-semibold">Records</h3>
          <span className="font-mono-num tabular-nums text-sm text-muted-foreground">{selectedFilter === 'office_debt' ? filteredPayments.length : filteredEntries.length}</span>
        </div>

        {selectedFilter === 'office_debt' ? (
          filteredPayments.length ? <ul className="divide-y divide-border">{filteredPayments.map((payment) => <li key={payment.id} className="flex items-center justify-between py-3 text-sm"><span>{payment.date}{payment.note ? ` · ${payment.note}` : ''}</span><strong>−{formatUGX(payment.amount)}</strong></li>)}</ul> : <p className="text-sm text-muted-foreground">No office debt payments recorded.</p>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-surface border border-dashed border-border bg-muted/40 p-4">
            <p className="text-sm font-medium">{entries.length === 0 ? 'No deposits recorded yet.' : 'No deposits match these filters.'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {entries.length === 0 ? 'New savings entries will appear here.' : 'Clear the search and goal filter to see all entries.'}
            </p>
            {(searchQuery || selectedFilter !== 'all') && (
              <button type="button" onClick={clearFilters} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-surface border border-border bg-card px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X aria-hidden="true" size={16} strokeWidth={1.8} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredEntries.map((entry) => {
              const category = categories[entry.categoryId] || categories.home_rent;
              const deleting = confirmDeleteId === entry.id;
              const Icon = entry.categoryId === 'home_rent' ? Home : entry.categoryId === 'internet' ? Wifi : Briefcase;
              return (
                <li key={entry.id} id={`ledger-entry-${entry.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Icon aria-hidden="true" size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold">{category.name}</span>
                        <span className="font-mono-num tabular-nums text-xs text-muted-foreground">{entry.date}</span>
                      </div>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{entry.note || 'Savings deposit'}</p>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                    <span className="font-mono-num tabular-nums text-sm font-semibold">+{formatUGX(entry.amount)}</span>
                    {deleting ? (
                      <div className="flex items-center gap-2" role="group" aria-label="Confirm deletion">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteEntry(entry);
                            setConfirmDeleteId(null);
                          }}
                          className="min-h-11 rounded-surface bg-destructive px-3 text-sm font-semibold text-white hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(null)} className="min-h-11 rounded-surface border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => onEditEntry(entry)} aria-label="Edit deposit" title="Edit deposit" className="inline-flex size-11 items-center justify-center rounded-surface text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <Edit3 aria-hidden="true" size={16} strokeWidth={1.8} />
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(entry.id)} aria-label="Delete deposit" title="Delete deposit" className="inline-flex size-11 items-center justify-center rounded-surface text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
