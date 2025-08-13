import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  FolderKanban, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DashboardProps {
  onNavigateToProjects?: () => void;
}

interface DashboardStats {
  totalProjects: number;
  totalModules: number;
  activeMembers: number;
  completedModules: number;
  modulesByStatus: { name: string; value: number; color: string }[];
  sprintProgress: { sprint: string; completed: number; total: number }[];
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToProjects }) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const modulesSubscription = supabase
      .channel('modules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_modules' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      projectsSubscription.unsubscribe();
      modulesSubscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*');

      // Fetch modules
      const { data: modules } = await supabase
        .from('project_modules')
        .select('*');

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('*');

      const totalProjects = projects?.length || 0;
      const totalModules = modules?.length || 0;
      const activeMembers = users?.length || 0;
      const completedModules = modules?.filter(m => m.status === 'done').length || 0;

      // Calculate modules by status - using consistent status values
      const statusCounts = modules?.reduce((acc, module) => {
        acc[module.status] = (acc[module.status] || 0) + 1;
        return acc;
      }, {
        'not-started': 0,
        'in-progress': 0,
        'blocked': 0,
        'done': 0
      } as Record<string, number>) || {
        'not-started': 0,
        'in-progress': 0,
        'blocked': 0,
        'done': 0
      };

      const modulesByStatus = [
        { name: 'Not Started', value: statusCounts.not_started, color: 'hsl(var(--muted))' },
        { name: 'In Progress', value: statusCounts.in_progress, color: 'hsl(var(--warning))' },
        { name: 'Blocked', value: statusCounts.blocked, color: 'hsl(var(--destructive))' },
        { name: 'Completed', value: statusCounts.done, color: 'hsl(var(--success))' },
      ];

      // Get projects for sprint progress (modules don't have sprint field)
      const sprintGroups = projects?.reduce((acc: any, project) => {
        const sprint = project.sprint || 'Unassigned';
        if (!acc[sprint]) {
          acc[sprint] = { completed: 0, total: 0 };
        }
        acc[sprint].total++;
        if (project.status === 'done') {
          acc[sprint].completed++;
        }
        return acc;
      }, {});

      const sprintProgress = Object.entries(sprintGroups || {}).map(([sprint, data]: [string, any]) => ({
        sprint,
        completed: data.completed,
        total: data.total
      }));

      setStats({
        totalProjects,
        totalModules,
        activeMembers,
        completedModules,
        modulesByStatus,
        sprintProgress
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const completionRate = stats ? (stats.completedModules / stats.totalModules) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="cyber-card p-6 bg-gradient-primary/10 border-primary/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.name}!
            </h2>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your projects today
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{completionRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'text-primary' },
          { title: 'Active Modules', value: stats?.totalModules || 0, icon: Activity, color: 'text-warning' },
          { title: 'Team Members', value: stats?.activeMembers || 0, icon: Users, color: 'text-info' },
          { title: 'Completed', value: stats?.completedModules || 0, icon: CheckCircle, color: 'text-success' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="cyber-card p-6 hover:border-primary/50 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Status Pie Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="cyber-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Module Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.modulesByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.modulesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {stats?.modulesByStatus.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sprint Progress Bar Chart */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="cyber-card p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Sprint Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.sprintProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="sprint" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completed" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="cyber-card p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-6">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-success/20 border border-success/30">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-success">Database</p>
              <p className="text-sm text-muted-foreground">Operational</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-success/20 border border-success/30">
            <Activity className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-success">Real-time Sync</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-primary/20 border border-primary/30">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-primary">Performance</p>
              <p className="text-sm text-muted-foreground">Optimized</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;