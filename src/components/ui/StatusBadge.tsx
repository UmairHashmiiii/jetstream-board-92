import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusConfig } from '@/utils/statusHelpers';

interface StatusBadgeProps {
  status: string;
  type?: 'project' | 'module';
  variant?: 'default' | 'outline';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type = 'project', 
  variant = 'outline',
  className = '' 
}) => {
  const config = getStatusConfig(status, type);
  
  return (
    <Badge 
      variant={variant}
      className={`${config.bgColor} ${config.color} ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${config.bgColor.split(' ')[0]}`} />
        {config.label}
      </div>
    </Badge>
  );
};

export default StatusBadge;