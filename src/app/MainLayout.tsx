import { useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/header';
import { useApp } from '@/contexts/app-context';
import '@/app/styles/layout.css';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useApp();

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
