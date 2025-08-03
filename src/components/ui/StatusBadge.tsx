import React from 'react';

type StatusType = 
  | 'active'
  | 'inactive'
  | 'warning'
  | 'pending' 
  | 'confirmed'
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'completed'
  | 'cancelled'
  | 'assigned'
  | 'available';

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