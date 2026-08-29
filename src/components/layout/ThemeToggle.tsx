import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, Theme } from '../../lib/theme';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'menu-item';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'icon',
  className = ''
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-[#5D3FD3] dark:text-purple-300 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Light Theme"
          aria-label="Switch to Light Theme"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-[#5D3FD3] dark:text-purple-300 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Dark Theme"
          aria-label="Switch to Dark Theme"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-[#5D3FD3] dark:text-purple-300 shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="System Sync"
          aria-label="Sync with System Theme"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>System</span>
        </button>
      </div>
    );
  }

  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${className}`}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
      >
        <span className="flex items-center gap-2">
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#5D3FD3]" />
          )}
          <span>{resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </span>
        <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
          {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  // Default: Icon button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#5D3FD3] dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-200 cursor-pointer group shadow-2xs ${className}`}
      title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};
