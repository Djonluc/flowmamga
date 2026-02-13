import type { ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { useSettingsStore } from '../stores/useSettingsStore';
import clsx from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { theme } = useSettingsStore();

  return (
    <div className={clsx(
      "h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300",
      theme === 'dark' ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-900'
    )}>
      <TitleBar />
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};
