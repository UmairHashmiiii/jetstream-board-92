import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import ProjectList from '@/components/projects/ProjectList';
import AddProject from '@/components/projects/AddProject';
import SignIn from '@/components/auth/SignIn';
import SignUp from '@/components/auth/SignUp';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const JeuxBoard: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAuth, setShowAuth] = useState<'signin' | 'signup'>('signin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto animate-cyber-glow">
            <div className="w-8 h-8 border-2 border-primary-foreground rounded-full animate-spin border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-bold text-foreground">Initializing JeuxBoard...</h2>
          <p className="text-muted-foreground">Loading your workspace</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <AnimatePresence mode="wait">
        {showAuth === 'signin' ? (
          <SignIn 
            key="signin"
            onSwitchToSignUp={() => setShowAuth('signup')} 
          />
        ) : (
          <SignUp 
            key="signup"
            onSwitchToSignIn={() => setShowAuth('signin')} 
          />
        )}
      </AnimatePresence>
    );
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'projects': return 'Projects';
      case 'members': return 'Team Management';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Real-time project insights and analytics';
      case 'projects': return 'Manage your development projects and sprints';
      case 'members': return 'Organize your development team';
      case 'settings': return 'Configure system preferences';
      default: return '';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return (
          <ProjectList
            onAddProject={() => setShowAddProject(true)}
            onEditProject={(project) => {
              // TODO: Implement edit project
              console.log('Edit project:', project);
            }}
            onViewProject={(project) => {
              // TODO: Implement view project details
              console.log('View project:', project);
            }}
          />
        );
      case 'members':
        return (
          <div className="cyber-card p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4">Team Management</h3>
            <p className="text-muted-foreground">Team management features coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="cyber-card p-8 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4">Settings</h3>
            <p className="text-muted-foreground">Settings panel coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={getPageTitle()} 
          subtitle={getPageSubtitle()} 
        />
        
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddProject && (
          <AddProject
            onClose={() => setShowAddProject(false)}
            onSuccess={() => {
              // Refresh projects list or navigate to projects page
              setCurrentPage('projects');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default JeuxBoard;