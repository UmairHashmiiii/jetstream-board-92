import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import ProjectList from '@/components/projects/ProjectList';
import ProjectDetails from '@/components/projects/ProjectDetails';
import TeamManagement from '@/components/team/TeamManagement';
import Settings from '@/components/settings/Settings';
import AddProject from '@/components/projects/AddProject';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AppLayoutProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ currentPage, setCurrentPage }) => {
  const { profile } = useAuth();
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'projects': return 'Projects';
      case 'project-details': return 'Project Details';
      case 'team': return 'Team Management';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Real-time project insights and analytics';
      case 'projects': return 'Manage your development projects and sprints';
      case 'project-details': return 'Detailed project view and module management';
      case 'team': return 'Organize your development team';
      case 'settings': return 'Configure system preferences';
      default: return '';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigateToProjects={() => setCurrentPage('projects')} />;
      
      case 'projects':
        return (
          <ProjectList
            onAddProject={() => setShowAddProject(true)}
            onEditProject={(project) => {
              setSelectedProjectId(project.id);
              setCurrentPage('project-details');
            }}
            onViewProject={(project) => {
              setSelectedProjectId(project.id);
              setCurrentPage('project-details');
            }}
          />
        );
      
      case 'project-details':
        return selectedProjectId ? (
          <ProjectDetails 
            projectId={selectedProjectId}
            onBack={() => {
              setCurrentPage('projects');
              setSelectedProjectId(null);
            }}
          />
        ) : (
          <div className="cyber-card p-8 text-center">
            <p className="text-muted-foreground">No project selected</p>
          </div>
        );
      
      case 'team':
        return <TeamManagement />;
      
      case 'settings':
        return <Settings />;
      
      default:
        return <Dashboard onNavigateToProjects={() => setCurrentPage('projects')} />;
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
              setShowAddProject(false);
              setCurrentPage('projects');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;