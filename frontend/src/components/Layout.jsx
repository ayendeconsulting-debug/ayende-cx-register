import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  X,
  Store,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] },
    { name: 'POS Till', href: '/pos', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'] },
    { name: 'Transactions', href: '/transactions', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Store className="w-6 h-6 text-primary-600" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-800">Ayende-CX</h1>
                <p className="text-xs text-gray-500">POS System</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.name : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
