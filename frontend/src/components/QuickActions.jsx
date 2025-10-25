import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Receipt,
  BarChart3,
  Mail,
  Home
} from 'lucide-react';

const QuickActions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  // Define all possible actions
  const allActions = [
    {
      path: '/dashboard',
      icon: BarChart3,
      label: 'Dashboard',
      color: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      path: '/pos',
      icon: ShoppingCart,
      label: 'New Sale',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      path: '/products',
      icon: Package,
      label: 'Products',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      path: '/customers',
      icon: Users,
      label: 'Customers',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      path: '/transactions',
      icon: Receipt,
      label: 'Transactions',
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  // Add Team Invitations for admins
  if (isAdmin) {
    allActions.push({
      path: '/team/invitations',
      icon: Mail,
      label: 'Team Invitations',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    });
  }

  // Filter out current page and show 4 most relevant actions
  const getRelevantActions = () => {
    const currentPath = location.pathname;
    
    // Always include Dashboard if not on Dashboard
    const actions = allActions.filter(action => action.path !== currentPath);
    
    // Prioritize Dashboard if not on it
    if (currentPath !== '/dashboard') {
      const dashboardAction = actions.find(a => a.path === '/dashboard');
      const otherActions = actions.filter(a => a.path !== '/dashboard');
      
      // Return Dashboard + 3 other actions
      return [dashboardAction, ...otherActions.slice(0, 3)];
    }
    
    // On Dashboard, show the 4 main actions (excluding Dashboard)
    return actions.slice(0, 4);
  };

  const relevantActions = getRelevantActions();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Quick Actions</h3>
        {location.pathname !== '/dashboard' && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Home className="w-3 h-3" />
            Use sidebar to return to Dashboard
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {relevantActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`flex items-center justify-center gap-3 p-4 text-white rounded-lg transition-colors shadow-lg ${action.color}`}
            >
              <Icon className="w-6 h-6" />
              <span className="font-semibold">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;