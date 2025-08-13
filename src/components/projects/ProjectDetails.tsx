import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, Calendar, Target, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { getStatusConfig } from '@/utils/statusHelpers';
import AddModule from './AddModule';
import ModuleCard from './ModuleCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

interface Project {
  id: string;
  title: string;
  stack: string | null;
  status: string;
  sprint: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  project_id: string;
  created_at: string;
  assignee_name?: string;
}

interface ProjectDetailsProps {
  projectId: string;
  onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId, onBack }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  
  const {
    data: modules,
    loading: modulesLoading,
    refreshData: refreshModules,
    setData: setModules
  } = useRealTimeData<Module>('project_modules', [], { column: 'project_id', value: projectId });

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load modules with real-time updates
      await refreshModules();
    } catch (error: any) {
      console.error('Error fetching project details:', error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('project_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      setModules(modules.filter(m => m.id !== moduleId));
      toast({
        title: "Success",
        description: "Module deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive"
      });
    }
  };

  const handleUpdateModuleStatus = async (moduleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('project_modules')
        .update({ status: newStatus })
        .eq('id', moduleId);

      if (error) throw error;

      setModules(modules.map(m => 
        m.id === moduleId ? { ...m, status: newStatus } : m
      ));

      toast({
        title: "Success",
        description: "Module status updated"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update module status",
        variant: "destructive"
      });
    }
  };

  // Optimized status statistics calculation
  const getModuleStats = () => {
    const total = modules.length;
    const stats = modules.reduce((acc, module) => {
      acc[module.status] = (acc[module.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      notStarted: stats['not-started'] || 0,
      inProgress: stats['in-progress'] || 0,
      blocked: stats['blocked'] || 0,
      done: stats['done'] || 0
    };
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="cyber-card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Project Not Found</h3>
        <p className="text-muted-foreground">The requested project could not be found.</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const stats = getModuleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <StatusBadge status={project.status} type="project" />
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{project.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {project.stack && (
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  {project.stack}
                </div>
              )}
              {project.sprint && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Sprint {project.sprint}
                </div>
              )}
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {stats.total} modules
              </div>
            </div>
          </div>

          {project.notes && (
            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
              <h3 className="text-sm font-medium text-foreground mb-2">Project Notes</h3>
              <p className="text-muted-foreground">{project.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Module Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="cyber-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{stats.notStarted}</div>
          <div className="text-sm text-muted-foreground">Not Started</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-2xl font-bold text-destructive">{stats.blocked}</div>
          <div className="text-sm text-muted-foreground">Blocked</div>
        </div>
        <div className="cyber-card p-4 text-center">
          <div className="text-2xl font-bold text-success">{stats.done}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Project Modules</h2>
          <Button onClick={() => setShowAddModule(true)} className="btn-glow">
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>

        {modulesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="cyber-card p-6 loading-shimmer h-48" />
            ))}
          </div>
        ) : modules.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onStatusUpdate={handleUpdateModuleStatus}
                onDelete={handleDeleteModule}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState
            icon={Target}
            title="No Modules Yet"
            description="Start by adding your first module to organize your project work"
            actionLabel="Add First Module"
            onAction={() => setShowAddModule(true)}
          />
        )}
      </div>

      {/* Add Module Modal */}
      {showAddModule && (
        <AddModule
          projectId={projectId}
          onClose={() => setShowAddModule(false)}
          onSuccess={() => {
            setShowAddModule(false);
            refreshModules();
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetails;