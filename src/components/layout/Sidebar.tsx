import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dev', 'pm', 'cto', 'lead', 'designer'] },
    { id: 'projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'dev', 'pm', 'cto', 'lead'] },
    { id: 'members', label: 'Team', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'cto'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(profile?.role_name || '')
  );

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="cyber-card h-screen w-64 p-6 flex flex-col border-r-2 border-primary/20"
    >
      {/* Logo */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            JeuxBoard
          </h1>
          <p className="text-xs text-muted-foreground">v2025.1</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
        {filteredMenuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate(item.id)}
            className={`
              w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left
              transition-all duration-300 group relative overflow-hidden
              ${currentPage === item.id 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }
            `}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">{item.label}</span>
            
            {currentPage === item.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full"
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/50 pt-4 space-y-3">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold">
              {profile?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.name}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {profile?.role_name}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
};

export default Sidebar;