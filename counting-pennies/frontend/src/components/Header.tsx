import { Sun, Moon, Bell } from "lucide-react";
import type { Theme } from "../hooks/useTheme";

interface HeaderProps {
  title: string;
  theme: Theme;
  onToggleTheme: () => void;
  children?: React.ReactNode;
}

export default function Header({ title, theme, onToggleTheme, children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
