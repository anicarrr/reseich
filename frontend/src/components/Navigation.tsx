'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Search, Store, MessageSquare, User } from 'lucide-react';
import { useDemoMode } from '@/lib/hooks/useDemoMode';
import { cn } from '@/lib/utils';
import { WalletConnect } from './chat/WalletConnect';
import Image from 'next/image';

const navigation = [
  { name: 'Home', href: '/', icon: Home, description: 'Research Library' },
  { name: 'Chat', href: '/chat', icon: MessageSquare, description: 'AI Research Assistant' },
  { name: 'Research', href: '/research', icon: Search, description: 'Conduct New Research' },
  { name: 'Explore', href: '/explore', icon: Store, description: 'Buy & Sell Research' },
  { name: 'Account', href: '/account', icon: User, description: 'User Management' }
];

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isDemoMode: demoMode } = useDemoMode();

  return (
    <nav className="sticky-header bg-white/5 backdrop-blur-ultra border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/icon.png" alt="ReSeich Logo" width={24} height={24} />
                <span className="text-xl font-bold text-white">ReSeich</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300',
                      isActive
                        ? 'border-[#e9407a] text-white'
                        : 'border-transparent text-gray-300 hover:border-[#e9407a]/50 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Wallet connection and user menu */}
          <div className="flex items-center space-x-4">
            {/* Demo mode indicator */}
            {demoMode && (
              <div className="hidden sm:flex items-center px-3 py-1 bg-[#ff8a00]/20 text-[#ff8a00] text-xs font-medium rounded-full border border-[#ff8a00]/30 backdrop-blur-sm">
                Demo Mode
              </div>
            )}

            {/* Wallet connection */}
            <WalletConnect />

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#e9407a] transition-all duration-300"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white/5 backdrop-blur-ultra border-t border-white/10">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-all duration-300',
                    isActive
                      ? 'bg-[#e9407a]/10 border-[#e9407a] text-white'
                      : 'border-transparent text-gray-300 hover:bg-white/5 hover:border-[#e9407a]/50 hover:text-white'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-400">{item.description}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile demo mode indicator */}
          {demoMode && (
            <div className="pt-4 pb-3 border-t border-white/10">
              <div className="px-4 py-2 bg-[#ff8a00]/10 text-[#ff8a00] text-sm font-medium rounded-md border border-[#ff8a00]/20">
                Demo Mode Active
                <div className="text-xs text-[#ff8a00]/80 mt-1">Limited features available</div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
