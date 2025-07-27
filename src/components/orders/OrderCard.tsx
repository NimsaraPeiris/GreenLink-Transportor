import React, { useState } from 'react';
import { ShoppingBag, Calendar, MapPin, Trash2, Edit3, Eye, CreditCard } from 'lucide-react'; // Replaced DollarSign with CreditCard
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import { Order } from '../../types';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase'; // Import supabase client

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  onOrderDeleted: (orderId: number) => void; // Callback to refresh list
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick, onOrderDeleted }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setShowDetails(!showDetails);
  };

  const handleDeleteOrder = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent card click event
    if (window.confirm(`Are you sure you want to delete order #${order.id}?`)) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .match({ id: order.id });

        if (error) {
          throw error;
        }
        
        alert(`Order #${order.id} deleted successfully.`);
        onOrderDeleted(order.id); // Notify parent component
      } catch (error: any) {
        console.error('Error deleting order:', error);
        alert(`Failed to delete order: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditOrder = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    console.log(`Edit order ${order.id}`);
    // This is a dummy button as per requirements
    alert(`Edit button clicked for order #${order.id} (dummy)`);
  };

  return (
    <Card className="cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium">Order #{order.id}</h3>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center text-sm">
          <ShoppingBag className="mr-2 h-4 w-4 text-secondary-500" />
          <span className="text-secondary-700">
            {order.containers?.name || `Container ID: ${order.container_id}`}
          </span>
        </div>

        {order.containers?.location && (
          <div className="flex items-center text-sm">
            <MapPin className="mr-2 h-4 w-4 text-secondary-500" />
            <span className="text-secondary-700">{order.containers.location}</span>
          </div>
        )}

        <div className="flex items-center text-sm">
          <CreditCard className="mr-2 h-4 w-4 text-secondary-500" /> {/* Using CreditCard as a generic currency icon */}
          <span className="text-secondary-700">Rs. {order.price}</span>
        </div>

        <div className="flex items-center text-sm">
          <Calendar className="mr-2 h-4 w-4 text-secondary-500" />
          <span className="text-secondary-700">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <div className="flex items-center text-sm">
          <span className="ml-6 text-secondary-500">Payment: {order.payment_status}</span>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-secondary-200 space-y-2">
            <h4 className="text-sm font-medium text-secondary-800">Additional Details:</h4>
            <div className="flex items-center text-xs">
              <Calendar className="mr-2 h-3 w-3 text-secondary-500" />
              <span className="text-secondary-600">Full Date & Time: {formatDateTime(order.created_at)}</span>
            </div>
            {/* Add more details here as needed */}
            <div className="flex items-center text-xs">
              <span className="text-secondary-600">Order Notes: {order.notes || 'N/A'}</span>
            </div>
             <div className="flex items-center text-xs">
              <span className="text-secondary-600">Last Updated: {order.updated_at ? formatDateTime(order.updated_at) : 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-secondary-200 flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={handleToggleDetails}>
          <Eye className="mr-1 h-4 w-4" />
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleEditOrder} className="text-secondary-700">
          <Edit3 className="mr-1 h-4 w-4" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDeleteOrder} disabled={isDeleting}>
          {isDeleting ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Trash2 className="mr-1 h-4 w-4" />
          )}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Card>
  );
};

export default OrderCard;
