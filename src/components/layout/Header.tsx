import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { profile } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="cyber-card p-6 mb-6 border-b border-primary/20"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <div className="live-indicator w-3 h-3 bg-primary rounded-full"></div>
          </div>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, modules..."
              className="pl-10 w-64 cyber-input"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></span>
          </Button>

          {/* System Status */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-success/20 border border-success/30">
            <Activity className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">All Systems Operational</span>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                {profile?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground">{profile?.name}</p>
              <p className="text-xs text-muted-foreground uppercase">{profile?.role_name}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;