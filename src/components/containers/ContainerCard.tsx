import React from 'react';
import { Thermometer, Battery, Droplets, ShoppingCart } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { Container } from '../../types';

interface ContainerCardProps {
  container: Container;
  onClick?: () => void;
  onPurchase?: () => void;
}

const ContainerCard: React.FC<ContainerCardProps> = ({ container, onClick, onPurchase }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card hover className="cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium">{container.name}</h3>
        <StatusBadge status={container.status} />
      </div>
      
      <div className="mt-4 space-y-3">
        <div className="flex items-center text-sm">
          <Thermometer className="mr-2 h-4 w-4 text-secondary-500" />
          <span className="text-secondary-700">{container.temperature}°C</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Droplets className="mr-2 h-4 w-4 text-secondary-500" />
          <span className="text-secondary-700">{container.humidity}%</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-secondary-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-secondary-500">Battery Level</span>
            <div className="flex items-center">
              <Battery className="h-4 w-4 mr-1 text-primary-600" />
              <span className="text-sm font-medium text-secondary-700">
                {container.battery_level}%
              </span>
            </div>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<ShoppingCart className="h-4 w-4" />}
            onClick={() => {
              onPurchase?.();
            }}
          >
            Purchase
          </Button>
        </div>
        <div className="mt-1 text-xs text-secondary-500">
          Last updated: {formatDate(container.last_updated)}
        </div>
      </div>
    </Card>
  );
};

export default ContainerCard;