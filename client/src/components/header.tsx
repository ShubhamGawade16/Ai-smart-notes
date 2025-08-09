import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Menu, 
  X, 
  Home, 
  LogOut, 
  Settings,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { Moon, Sun } from "lucide-react";
import { useAuth } from '@/hooks/use-supabase-auth';

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { logout } = useAuth();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'AI Features', path: '/advanced-features', icon: Sparkles },
    { label: 'Task Refiner', path: '/task-refiner', icon: MessageCircle },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <span className="text-sm sm:text-base font-bold text-white">P</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Planify
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center space-x-1 lg:space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-2 lg:px-3 h-8 text-sm"
                  >
                    <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    <span className="hidden lg:inline text-sm">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="px-2 h-8 w-8"
              onClick={() => {
                const theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }}
            >
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            
            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="hidden md:flex items-center space-x-1 h-8 px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-sm">Exit Demo</span>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start space-x-2"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              
              <Button
                variant="outline"
                className="w-full justify-start space-x-2 mt-4"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span>Exit Demo</span>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}