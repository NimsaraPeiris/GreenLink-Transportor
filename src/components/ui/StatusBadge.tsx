import React from 'react';

type StatusType = 
  | 'active'
  | 'inactive'
  | 'warning'
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span className={`status-badge ${status} ${className}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;