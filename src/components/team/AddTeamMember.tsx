import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface AddTeamMemberProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddTeamMember: React.FC<AddTeamMemberProps> = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: ''
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.role_id) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            role_id: formData.role_id,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            name: formData.name.trim(),
            email: formData.email.trim(),
            role_id: formData.role_id,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }
      }

      toast({
        title: "Success",
        description: `Team member ${formData.name} has been added successfully`
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'text-destructive';
      case 'cto':
        return 'text-primary';
      case 'pm':
        return 'text-info';
      case 'lead':
        return 'text-warning';
      case 'dev':
        return 'text-success';
      case 'designer':
        return 'text-accent';
      default:
        return 'text-muted-foreground';
    }
  };

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
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Add Team Member</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Full Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className="cyber-input"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email Address*</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              className="cyber-input"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password*</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password (min. 6 characters)"
              className="cyber-input"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Role*
            </Label>
            <Select
              value={formData.role_id}
              onValueChange={(value) => setFormData({ ...formData, role_id: value })}
            >
              <SelectTrigger className="cyber-input">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className={getRoleColor(role.name)}>
                        {role.name.toUpperCase()}
                      </span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {role.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/20 p-3 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> The new team member will receive an email to verify their account. 
              They can then sign in using the provided credentials.
            </p>
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
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Member'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTeamMember;