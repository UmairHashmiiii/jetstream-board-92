// Centralized status management for consistency across the app

export interface StatusConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

export const PROJECT_STATUSES: StatusConfig[] = [
  {
    value: 'not_started',
    label: 'Not Started',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    color: 'text-warning',
    bgColor: 'bg-warning/20 border-warning/30'
  },
  {
    value: 'blocked',
    label: 'Blocked',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20 border-destructive/30'
  },
  {
    value: 'done',
    label: 'Completed',
    color: 'text-success',
    bgColor: 'bg-success/20 border-success/30'
  }
];

export const MODULE_STATUSES: StatusConfig[] = [
  {
    value: 'not-started',
    label: 'Not Started',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    color: 'text-warning',
    bgColor: 'bg-warning/20 border-warning/30'
  },
  {
    value: 'blocked',
    label: 'Blocked',
    color: 'text-destructive',
    bgColor: 'bg-destructive/20 border-destructive/30'
  },
  {
    value: 'done',
    label: 'Completed',
    color: 'text-success',
    bgColor: 'bg-success/20 border-success/30'
  }
];

export function getStatusConfig(status: string, type: 'project' | 'module' = 'project'): StatusConfig {
  const statuses = type === 'project' ? PROJECT_STATUSES : MODULE_STATUSES;
  return statuses.find(s => s.value === status) || statuses[0];
}

export function normalizeStatus(status: string, targetType: 'project' | 'module'): string {
  // Convert between project and module status formats
  const statusMap: Record<string, Record<string, string>> = {
    'project_to_module': {
      'not_started': 'not-started',
      'in_progress': 'in-progress',
      'blocked': 'blocked',
      'done': 'done'
    },
    'module_to_project': {
      'not-started': 'not_started',
      'in-progress': 'in_progress',
      'blocked': 'blocked',
      'done': 'done'
    }
  };

  const key = targetType === 'module' ? 'project_to_module' : 'module_to_project';
  return statusMap[key][status] || status;
}