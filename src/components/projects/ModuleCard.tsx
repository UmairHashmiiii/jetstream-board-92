import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Module {
  id: string;
  name: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  assignee_name?: string;
  created_at: string;
}

interface ModuleCardProps {
  module: Module;
  onStatusUpdate: (moduleId: string, newStatus: string) => void;
  onDelete: (moduleId: string) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onStatusUpdate, onDelete }) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'not-started':
        return {
          color: 'bg-muted text-muted-foreground',
          label: 'Not Started'
        };
      case 'in-progress':
        return {
          color: 'bg-warning/20 text-warning border-warning/30',
          label: 'In Progress'
        };
      case 'blocked':
        return {
          color: 'bg-destructive/20 text-destructive border-destructive/30',
          label: 'Blocked'
        };
      case 'done':
        return {
          color: 'bg-success/20 text-success border-success/30',
          label: 'Done'
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground',
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(module.status);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    await onStatusUpdate(module.id, newStatus);
    setIsUpdatingStatus(false);
  };

  const statusOptions = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'done', label: 'Done' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cyber-card p-6 space-y-4 hover:border-primary/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {module.name}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(module.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem className="text-muted-foreground hover:text-foreground">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(module.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {module.description && (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {module.description}
        </p>
      )}

      {/* Status */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Status
        </label>
        <Select
          value={module.status}
          onValueChange={handleStatusChange}
          disabled={isUpdatingStatus}
        >
          <SelectTrigger className="h-8 text-sm">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig.color.split(' ')[0]}`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getStatusConfig(option.value).color.split(' ')[0]}`} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="w-4 h-4 mr-2" />
          {module.assignee_name || 'Unassigned'}
        </div>
        <Badge className={statusConfig.color} variant="outline">
          {statusConfig.label}
        </Badge>
      </div>
    </motion.div>
  );
};

export default ModuleCard;