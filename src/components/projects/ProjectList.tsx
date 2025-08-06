import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Users, Calendar, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Project {
  id: string;
  title: string;
  stack: string | null;
  sprint: string | null;
  notes?: string | null;
  status: 'not_started' | 'in_progress' | 'blocked' | 'done';
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: { name: string };
  member_count?: number;
}

interface ProjectListProps {
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onViewProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onAddProject, onEditProject, onViewProject }) => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sprintFilter, setSprintFilter] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
    
    // Real-time subscription
    const subscription = supabase
      .channel('projects-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:users!projects_created_by_fkey(name),
          project_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const projectsWithCounts = data?.map(project => ({
        ...project,
        member_count: project.project_members?.length || 0
      })) || [];

      setProjects(projectsWithCounts as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.stack?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesSprint = sprintFilter === 'all' || project.sprint === sprintFilter;
    
    return matchesSearch && matchesStatus && matchesSprint;
  });

  const uniqueSprints = [...new Set(projects.map(p => p.sprint).filter(Boolean))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-muted text-muted-foreground';
      case 'in_progress': return 'bg-warning/20 text-warning border-warning/30';
      case 'blocked': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'done': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 cyber-input"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] cyber-input">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sprintFilter} onValueChange={setSprintFilter}>
            <SelectTrigger className="w-[140px] cyber-input">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sprints</SelectItem>
              {uniqueSprints.map(sprint => (
                <SelectItem key={sprint} value={sprint}>{sprint}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(profile?.role_name === 'admin' || profile?.role_name === 'pm') && (
            <Button onClick={onAddProject} className="btn-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          )}
        </div>
      </div>

      {/* Project Grid */}
      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="cyber-card p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
              onClick={() => onViewProject(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <Badge className={`mt-2 ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {(profile?.role_name === 'admin' || profile?.role_name === 'pm') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project);
                      }}>
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onViewProject(project);
                      }}>
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Code className="w-4 h-4" />
                  <span>{project.stack}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{project.sprint || 'No sprint assigned'}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{project.member_count} team members</span>
                </div>

                {project.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
                    {project.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created by {project.creator?.name}</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || sprintFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first project to get started'
            }
          </p>
          {(profile?.role_name === 'admin' || profile?.role_name === 'pm') && !searchTerm && (
            <Button onClick={onAddProject} className="mt-4 btn-glow">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ProjectList;