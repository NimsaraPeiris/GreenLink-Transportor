import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  User, 
  HelpCircle, 
  Leaf, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Container', href: '/containers', icon: Package },
    { name: 'Register Vehicle', href: '/vehicles', icon: Truck },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/signin');
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-secondary-200 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className="flex items-center justify-between px-4 py-6">
        <div className="flex items-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <Menu className="h-6 w-6 text-gray-600" />
            ) : (
              <X className="h-6 w-6 text-gray-600" />
            )}
          </button>
          {!isCollapsed && (
            <>
              <Leaf className="h-8 w-8 text-primary-600 ml-2" />
              <span className="ml-2 text-xl font-semibold text-secondary-900">GreenLink</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 px-2 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) => 
              `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'} ${
                isCollapsed ? 'justify-center' : ''
              }`
            }
            title={isCollapsed ? item.name : ''}
          >
            <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && item.name}
          </NavLink>
        ))}
      </div>
      
      <div className="px-2 py-4 border-t border-secondary-200">
        <button 
          className={`nav-link nav-link-inactive w-full ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
          onClick={handleSignOut}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && 'Sign out'}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;