import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Filter, MoreHorizontal, Mail, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AddTeamMember from './AddTeamMember';

interface TeamMember {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role_name: string;
  created_at: string;
  project_count?: number;
  active_modules?: number;
}

const TeamManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (profile?.role_name === 'admin') {
      fetchTeamMembers();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      // Get all users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get project counts for each user
      const { data: projectCounts, error: projectError } = await supabase
        .from('projects')
        .select('created_by')
        .then(async ({ data, error }) => {
          if (error) throw error;
          
          const counts: Record<string, number> = {};
          data?.forEach(project => {
            counts[project.created_by] = (counts[project.created_by] || 0) + 1;
          });
          
          return counts;
        });

      // Get active module counts for each user
      const { data: moduleCounts, error: moduleError } = await supabase
        .from('project_modules')
        .select('assigned_to')
        .neq('status', 'done')
        .then(async ({ data, error }) => {
          if (error) throw error;
          
          const counts: Record<string, number> = {};
          data?.forEach(module => {
            if (module.assigned_to) {
              counts[module.assigned_to] = (counts[module.assigned_to] || 0) + 1;
            }
          });
          
          return counts;
        });

      const formattedMembers: TeamMember[] = usersData.map(user => ({
        id: user.id,
        auth_id: user.auth_id,
        name: user.name,
        email: user.email,
        role_name: user.role?.name || 'unknown',
        created_at: user.created_at,
        project_count: projectCounts[user.auth_id] || 0,
        active_modules: moduleCounts[user.auth_id] || 0
      }));

      setMembers(formattedMembers);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
      toast({
        title: "Success",
        description: "Team member removed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'cto':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'pm':
        return 'bg-info/20 text-info border-info/30';
      case 'lead':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'dev':
        return 'bg-success/20 text-success border-success/30';
      case 'designer':
        return 'bg-accent/20 text-accent border-accent/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role_name === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const uniqueRoles = [...new Set(members.map(m => m.role_name))];

  if (profile?.role_name !== 'admin') {
    return (
      <div className="cyber-card p-8 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to manage team members. Only administrators can access this feature.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          </div>
          <Button onClick={() => setShowAddMember(true)} className="btn-glow">
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 cyber-input"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="cyber-input w-40"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cyber-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{members.length}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card className="cyber-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {members.filter(m => m.role_name === 'admin').length}
            </div>
            <div className="text-sm text-muted-foreground">Admins</div>
          </CardContent>
        </Card>
        <Card className="cyber-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {members.filter(m => m.role_name === 'dev').length}
            </div>
            <div className="text-sm text-muted-foreground">Developers</div>
          </CardContent>
        </Card>
        <Card className="cyber-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">
              {members.reduce((sum, m) => sum + (m.active_modules || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Active Modules</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="cyber-card h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge className={getRoleColor(member.role_name)} variant="outline">
                      {member.role_name.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Projects Created</span>
                    <span className="text-sm font-medium text-foreground">{member.project_count}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Modules</span>
                    <span className="text-sm font-medium text-foreground">{member.active_modules}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="cyber-card p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Members Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedRole !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start by adding your first team member'
            }
          </p>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddTeamMember
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            setShowAddMember(false);
            fetchTeamMembers();
          }}
        />
      )}
    </div>
  );
};

export default TeamManagement;