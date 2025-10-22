import Layout from '../components/Layout';
import { DollarSign, Package, Users, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-800">$0.00</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-800">0</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Growth</p>
              <p className="text-2xl font-bold text-gray-800">0%</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          <p className="text-gray-600">No recent activity</p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
