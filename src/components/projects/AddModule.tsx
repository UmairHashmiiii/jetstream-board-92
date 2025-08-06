import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface User {
  auth_id: string;
  name: string;
  role_name?: string;
}

interface AddModuleProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddModule: React.FC<AddModuleProps> = ({ projectId, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'not-started',
    assigned_to: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          auth_id,
          name,
          role:roles(name)
        `)
        .order('name');

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        auth_id: user.auth_id,
        name: user.name,
        role_name: user.role?.name
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Module name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const moduleData = {
        project_id: projectId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        assigned_to: formData.assigned_to || null
      };

      const { error } = await supabase
        .from('project_modules')
        .insert([moduleData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module created successfully"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating module:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create module",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'done', label: 'Done' }
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="cyber-card w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Add Module</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Module Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter module name"
              className="cyber-input"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the module requirements..."
              className="cyber-input min-h-20"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="cyber-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Assign To
            </Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
            >
              <SelectTrigger className="cyber-input">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.auth_id} value={user.auth_id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{user.name}</span>
                      {user.role_name && (
                        <span className="text-xs text-muted-foreground ml-2 uppercase">
                          {user.role_name}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 btn-glow"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Module'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddModule;