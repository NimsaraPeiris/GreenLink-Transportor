import React from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from '../notifications/NotificationDropdown';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { user } = useAuth();
  
  // Get user's email or 'User' as fallback
  const userEmail = user?.email || 'User';

  return (
    <header className="bg-white border-b border-secondary-200 py-4 px-4 flex justify-between items-center">
      <div className="flex items-center">
        <button 
          className="lg:hidden mr-4 text-secondary-500 hover:text-secondary-700"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-secondary-700">
            Welcome, {userEmail}
          </h2>
        </div>
      </div>

      <div className="flex items-center">
        <NotificationDropdown />
      </div>
    </header>
  );
};

export default Header;