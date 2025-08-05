import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role_name?: string;
}

interface AddProjectProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddProject: React.FC<AddProjectProps> = ({ onClose, onSuccess }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    stack: '',
    sprint: '',
    notes: '',
    status: 'not_started' as const
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role:roles(name)
        `)
        .order('name');

      if (error) throw error;
      
      const usersWithRole = data?.map(user => ({
        ...user,
        role_name: (user.role as any)?.name
      })) || [];

      setUsers(usersWithRole);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          title: formData.title,
          stack: formData.stack,
          sprint: formData.sprint,
          notes: formData.notes,
          status: formData.status,
          created_by: profile!.id
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add project members
      if (selectedMembers.length > 0 && project) {
        const memberInserts = selectedMembers.map(userId => ({
          project_id: project.id,
          user_id: userId,
          role_in_project: 'member'
        }));

        const { error: membersError } = await supabase
          .from('project_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      toast({
        title: "Success!",
        description: "Project created successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectedUserNames = users
    .filter(user => selectedMembers.includes(user.id))
    .map(user => user.name);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Create New Project</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="cyber-input"
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stack" className="text-foreground">Technology Stack</Label>
                <Input
                  id="stack"
                  value={formData.stack}
                  onChange={(e) => handleInputChange('stack', e.target.value)}
                  className="cyber-input"
                  placeholder="e.g., React, Node.js, MongoDB"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint" className="text-foreground">Sprint</Label>
                <Input
                  id="sprint"
                  value={formData.sprint}
                  onChange={(e) => handleInputChange('sprint', e.target.value)}
                  className="cyber-input"
                  placeholder="e.g., Sprint 1, Q1 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-foreground">Initial Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                  <SelectTrigger className="cyber-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground">Project Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="cyber-input min-h-[100px]"
                placeholder="Project description, requirements, or additional notes..."
              />
            </div>

            {/* Team Member Selection */}
            <div className="space-y-4">
              <Label className="text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members
              </Label>
              
              {selectedUserNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUserNames.map(name => (
                    <Badge key={name} variant="secondary" className="bg-primary/20 text-primary">
                      {name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-border/50 rounded-lg p-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all
                      ${selectedMembers.includes(user.id)
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                      }
                    `}
                    onClick={() => toggleMember(user.id)}
                  >
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{user.role_name}</p>
                    </div>
                    {selectedMembers.includes(user.id) && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Plus className="w-3 h-3 text-primary-foreground rotate-45" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 btn-glow"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddProject;