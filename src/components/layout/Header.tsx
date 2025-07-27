import React, { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [notifications] = useState(3); // Restoring placeholder notification count
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
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            className="pl-10 pr-3 py-2 w-64 rounded-md border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Search..."
            type="search"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Bell className="h-6 w-6 text-secondary-500 hover:text-secondary-700 cursor-pointer" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full">
              {notifications}
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          <img
            className="h-8 w-8 rounded-full object-cover"
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`}
            alt="User profile"
          />
          <span className="ml-2 text-sm font-medium text-secondary-700 hidden sm:block">
            {userEmail}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;