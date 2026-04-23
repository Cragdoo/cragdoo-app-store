import { type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { Theme } from "../hooks/useTheme";

interface LayoutProps {
  title: string;
  theme: Theme;
  onToggleTheme: () => void;
  children: ReactNode;
  headerContent?: ReactNode;
}

export default function Layout({ title, theme, onToggleTheme, children, headerContent }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} theme={theme} onToggleTheme={onToggleTheme}>
          {headerContent}
        </Header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
