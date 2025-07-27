import React from 'react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  className = '' 
}) => {
  return (
    <Card className={`stats-card ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-secondary-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-secondary-900">{value}</p>
          
          {change && (
            <div className="mt-1 flex items-center text-xs">
              <span className={`font-medium ${change.isPositive ? 'text-success-600' : 'text-error-600'}`}>
                {change.isPositive ? '↑' : '↓'} {change.value}
              </span>
              <span className="ml-1 text-secondary-500">from last month</span>
            </div>
          )}
        </div>
        
        <div className="p-2 rounded-full bg-primary-50">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;