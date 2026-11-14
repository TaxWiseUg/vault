import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { History, LayoutDashboard, Plus, Receipt } from 'lucide-react';
import type { ActiveTab } from './CategoryTabs';
import type { CategoryId } from '../types';

interface FloatingNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenAdd: (categoryId?: CategoryId) => void;
  onOpenExpense: () => void;
  overlayOpen: boolean;
}

const items = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: '1' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, shortcut: '6' },
  { id: 'history', label: 'Ledger', icon: History, shortcut: '7' },
] as const;

export function FloatingNav({ activeTab, onChangeTab, onOpenAdd, onOpenExpense, overlayOpen }: FloatingNavProps) {
  const [hiddenOnScroll, setHiddenOnScroll] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const lastScrollY = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (window.innerWidth < 640) {
        if (currentY > lastScrollY.current + 2 && currentY > 48) setHiddenOnScroll(true);
        if (currentY < lastScrollY.current - 2) setHiddenOnScroll(false);
      } else {
        setHiddenOnScroll(false);
      }
      lastScrollY.current = currentY;
    };

    const updateKeyboardState = () => {
      const activeElement = document.activeElement;
      const editingText = activeElement instanceof HTMLElement && (
        activeElement.matches('input, textarea, select') || activeElement.isContentEditable
      );
      const viewport = window.visualViewport;
      setKeyboardUp(Boolean(editingText && viewport && viewport.height < window.innerHeight - 120));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    window.addEventListener('focusin', updateKeyboardState);
    window.addEventListener('focusout', updateKeyboardState);
    window.visualViewport?.addEventListener('resize', updateKeyboardState);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('focusin', updateKeyboardState);
      window.removeEventListener('focusout', updateKeyboardState);
      window.visualViewport?.removeEventListener('resize', updateKeyboardState);
    };
  }, []);

  const hidden = overlayOpen || keyboardUp || hiddenOnScroll;
  const handleAdd = () => {
    if (activeTab === 'expenses') {
      onOpenExpense();
      return;
    }
    const categoryId = activeTab === 'home_rent' || activeTab === 'internet' || activeTab === 'work_rent'
      ? activeTab
      : undefined;
    onOpenAdd(categoryId);
  };

  return (
    <motion.nav
      aria-label="Primary navigation"
      className="floating-nav-shell"
      initial={false}
      animate={{ y: hidden ? 88 : 0, opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
      aria-hidden={hidden}
      inert={hidden}
    >
      {items.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            aria-keyshortcuts={item.shortcut}
            title={`${item.label} · ${item.shortcut}`}
            onClick={() => onChangeTab(item.id)}
            className="floating-nav-item"
          >
            <span className="floating-nav-icon">
              {active && <motion.span layoutId="floating-nav-active" className="floating-nav-active" transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }} />}
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <span className="hidden sm:inline">{item.label}</span>
            {active && <span className="sm:hidden text-xs">{item.label}</span>}
          </button>
        );
      })}

      <button
        id="central-floating-add-btn"
        type="button"
        aria-label={activeTab === 'expenses' ? 'Add expense' : 'Add savings entry'}
        aria-keyshortcuts={activeTab === 'expenses' ? 'E' : 'D'}
        title={activeTab === 'expenses' ? 'Add expense · E' : 'Add savings entry · D'}
        onClick={handleAdd}
        className="floating-nav-add"
      >
        <Plus aria-hidden="true" size={20} strokeWidth={2} />
      </button>

      {items.slice(2).map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            aria-keyshortcuts={item.shortcut}
            title={`${item.label} · ${item.shortcut}`}
            onClick={() => onChangeTab(item.id)}
            className="floating-nav-item"
          >
            <span className="floating-nav-icon">
              {active && <motion.span layoutId="floating-nav-active" className="floating-nav-active" transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }} />}
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <span className="hidden sm:inline">{item.label}</span>
            {active && <span className="sm:hidden text-xs">{item.label}</span>}
          </button>
        );
      })}
    </motion.nav>
  );
}
