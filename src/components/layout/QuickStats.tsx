import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  color: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, previousValue, color, icon }) => {
  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercentage = previousValue ? Math.round((trend / previousValue) * 100) : 0;
  
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cyber-card p-6 hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        {previousValue !== undefined && (
          <div className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4 mr-1" />
            {Math.abs(trendPercentage)}%
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-foreground">{value.toLocaleString()}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </motion.div>
  );
};

interface QuickStatsProps {
  stats: Array<{
    title: string;
    value: number;
    previousValue?: number;
    color: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

const QuickStats: React.FC<QuickStatsProps> = ({ stats, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default QuickStats;