import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BriefcaseBusiness, House, Landmark, LayoutDashboard, Wifi } from 'lucide-react';
import type { ActiveTab } from './CategoryTabs';

interface FloatingNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  overlayOpen: boolean;
}

const items = [
  { id: 'overview', label: 'Dash', icon: LayoutDashboard, shortcut: '1' },
  { id: 'debt', label: 'Office', icon: Landmark, shortcut: '2' },
  { id: 'home_rent', label: 'Home', icon: House, shortcut: '3' },
  { id: 'work_rent', label: 'Work', icon: BriefcaseBusiness, shortcut: '4' },
  { id: 'internet', label: 'WiFi', icon: Wifi, shortcut: '5' },
] as const;

export function FloatingNav({ activeTab, onChangeTab, overlayOpen }: FloatingNavProps) {
  const [keyboardUp, setKeyboardUp] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const updateKeyboardState = () => {
      const activeElement = document.activeElement;
      const editingText = activeElement instanceof HTMLElement && (
        activeElement.matches('input, textarea, select') || activeElement.isContentEditable
      );
      const viewport = window.visualViewport;
      setKeyboardUp(Boolean(editingText && viewport && viewport.height < window.innerHeight - 120));
    };

    window.addEventListener('focusin', updateKeyboardState);
    window.addEventListener('focusout', updateKeyboardState);
    window.visualViewport?.addEventListener('resize', updateKeyboardState);
    return () => {
      window.removeEventListener('focusin', updateKeyboardState);
      window.removeEventListener('focusout', updateKeyboardState);
      window.visualViewport?.removeEventListener('resize', updateKeyboardState);
    };
  }, []);

  const hidden = overlayOpen || keyboardUp;

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
      {items.map((item) => {
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
          </button>
        );
      })}
    </motion.nav>
  );
}
