'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Dropdown, { DropdownItem } from '@/components/Dropdown';
import { NotificationBell } from '@/components/NotificationBell';
import authUtils from '@/utils/auth';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Complaints', href: '/complaints', icon: ClipboardDocumentListIcon },
  { name: 'Work Orders', href: '/work-orders', icon: WrenchScrewdriverIcon },
  { name: 'Approvals', href: '/approvals', icon: CheckCircleIcon },
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Handle hydration to prevent SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="h-full flex">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full glass rounded-r-3xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 glass border-r border-white/20">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 glass">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:block sticky top-0 z-10 glass border-b border-white/20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold gradient-text">
                {navigation.find(item => item.href === pathname)?.name || 'Admin Portal'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <Dropdown
                trigger={
                  <div className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 rounded-xl px-3 py-2 transition-all duration-200">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-glow">
                      <span className="text-sm font-bold text-white">
                        {isHydrated ? authUtils.getUserInitials(user || undefined) : 'A'}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-gray-800">
                        {isHydrated ? authUtils.getUserDisplayName(user || undefined) : 'Admin'}
                      </span>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                  </div>
                }
              >
                <DropdownItem onClick={handleLogout}>
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  function SidebarContent() {
    return (
      <>
        {/* Header */}
        <div className="flex items-center h-20 flex-shrink-0 px-6 bg-gradient-to-r from-blue-600 to-purple-700">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-white">MargWatch</h1>
              <p className="text-sm text-blue-100 font-medium">Admin Portal</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'sidebar-link-active'
                      : 'sidebar-link-inactive'
                  } group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                    } mr-4 flex-shrink-0 h-6 w-6 transition-colors duration-200`}
                  />
                  {item.name}
                </a>
              );
            })}
          </nav>
          
          {/* User info */}
          <div className="flex-shrink-0 border-t border-white/20 p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-glow">
                <span className="text-sm font-bold text-white">
                  {isHydrated ? authUtils.getUserInitials(user || undefined) : 'A'}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-800">
                  {isHydrated ? authUtils.getUserDisplayName(user || undefined) : 'Admin'}
                </p>
                <p className="text-xs font-medium text-gray-500">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
