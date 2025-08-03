import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Clock, User, Package, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string;
  entity_id: string;
  entity_type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications when component mounts and set up real-time updates
  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
      
      // Set up periodic refresh as fallback (every 30 seconds)
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      
      return () => {
        // Cleanup subscription and interval on unmount
        supabase.removeAllChannels();
        clearInterval(interval);
      };
    }
  }, [user]);

  // Also fetch when dropdown opens to ensure latest data
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Get current user's ID from the users table
  const getCurrentUserId = async () => {
    if (!user?.email) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();
    
    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
    
    return data?.id;
  };

  // Set up real-time subscription for notifications
  const setupRealtimeSubscription = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return;

    // Subscribe to changes in the notifications table
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          console.log('Notification change detected:', payload);
          
          // Check if this notification is relevant to the current user
          if (payload.new) {
            const notification = payload.new as Notification;
            const isUserNotification = 
              (notification.entity_type === 'user' || notification.entity_type === 'u') && 
              notification.entity_id === userId;
            
            if (isUserNotification) {
              // Refresh notifications when there's a relevant change
              fetchNotifications();
            }
          } else if (payload.old) {
            // Handle updates/deletes - refresh to be safe
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return channel;
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setLoading(false);
        return;
      }

      // Get notifications for this user based on existing database structure
      // This will show:
      // 1. Notifications where entity_type is 'user' or 'u' and entity_id matches current user
      // 2. Or all notifications (you can modify this logic based on your needs)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`and(entity_type.eq.user,entity_id.eq.${userId}),and(entity_type.eq.u,entity_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      const unread = data?.filter(notif => !notif.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .or(`and(entity_type.eq.user,entity_id.eq.${userId}),and(entity_type.eq.u,entity_id.eq.${userId})`)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_created':
      case 'user_updated':
        return <User className="h-4 w-4" />;
      case 'order_created':
      case 'order_updated':
      case 'order_deleted':
        return <Package className="h-4 w-4" />;
      case 'container_updated':
        return <Truck className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user_created':
        return 'text-green-600 bg-green-50';
      case 'order_created':
        return 'text-blue-600 bg-blue-50';
      case 'order_deleted':
        return 'text-red-600 bg-red-50';
      case 'container_updated':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-secondary-500 hover:text-secondary-700 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full min-w-[1.25rem] text-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-100">
            <h3 className="text-lg font-semibold text-secondary-900">Notifications</h3>
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Mark all read
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-secondary-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-secondary-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-secondary-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-secondary-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-secondary-50 transition-colors ${
                      !notification.is_read ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-secondary-900 mb-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-secondary-500">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary-600 hover:text-primary-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
