import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './components/sidebar';
import Header from './components/header';
import { useApp } from '../contexts/app-context';
import './styles/layout.css';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useApp();

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-6 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
