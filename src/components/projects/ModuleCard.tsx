import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MODULE_STATUSES, getStatusConfig } from '@/utils/statusHelpers';
import StatusBadge from '@/components/ui/StatusBadge';

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

  const statusConfig = getStatusConfig(module.status, 'module');

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    await onStatusUpdate(module.id, newStatus);
    setIsUpdatingStatus(false);
  };


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
              <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig.bgColor.split(' ')[0]}`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {MODULE_STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${option.bgColor.split(' ')[0]}`} />
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
        <StatusBadge status={module.status} type="module" />
      </div>
    </motion.div>
  );
};

export default ModuleCard;