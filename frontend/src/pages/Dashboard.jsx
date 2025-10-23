import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Package,
  AlertTriangle,
  Receipt,
  Calendar,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Activity,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import transactionService from '../services/transactionService';
import productService from '../services/productService';
import customerService from '../services/customerService';
import ShiftControl from '../components/ShiftControl';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today'); // today, week, month, year
  const [dashboardData, setDashboardData] = useState({
    salesMetrics: {
      todaySales: 0,
      weekSales: 0,
      monthSales: 0,
      todayTransactions: 0,
      weekTransactions: 0,
      monthTransactions: 0,
      averageTransaction: 0,
      yesterdaySales: 0,
      lastWeekSales: 0,
      lastMonthSales: 0
    },
    recentTransactions: [],
    topProducts: [],
    lowStockProducts: [],
    customerStats: {
      total: 0,
      newThisMonth: 0,
      activeCustomers: 0
    },
    salesTrend: [],
    paymentMethodBreakdown: []
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

      // Fetch all data in parallel
      const [
        allTransactions,
        allProducts,
        allCustomers
      ] = await Promise.all([
        transactionService.getAllTransactions({ limit: 1000 }),
        productService.getAllProducts(),
        customerService.getAllCustomers()
      ]);

      const transactions = allTransactions.data || [];
      const products = allProducts.data || [];
      const customers = allCustomers.data || [];

      // Filter completed transactions only
      const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');

      // Calculate sales metrics
      const todayTxns = completedTransactions.filter(t => new Date(t.createdAt) >= today);
      const weekTxns = completedTransactions.filter(t => new Date(t.createdAt) >= weekAgo);
      const monthTxns = completedTransactions.filter(t => new Date(t.createdAt) >= monthAgo);

      const todaySales = todayTxns.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const weekSales = weekTxns.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const monthSales = monthTxns.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

      // Calculate previous period metrics for growth comparison
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(monthAgo.getFullYear(), monthAgo.getMonth() - 1, 1);
      const lastMonthEnd = new Date(monthAgo.getTime() - 1);

      const yesterdayTxns = completedTransactions.filter(t => {
        const txnDate = new Date(t.createdAt);
        return txnDate >= yesterday && txnDate < today;
      });
      const lastWeekTxns = completedTransactions.filter(t => {
        const txnDate = new Date(t.createdAt);
        return txnDate >= twoWeeksAgo && txnDate < weekAgo;
      });
      const lastMonthTxns = completedTransactions.filter(t => {
        const txnDate = new Date(t.createdAt);
        return txnDate >= twoMonthsAgo && txnDate < monthAgo;
      });

      const yesterdaySales = yesterdayTxns.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const lastWeekSales = lastWeekTxns.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const lastMonthSales = lastMonthTxns.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

      // Calculate payment method breakdown
      const paymentMethods = {};
      completedTransactions.forEach(txn => {
        const method = txn.paymentDetails?.[0]?.paymentMethod || 'CASH';
        if (!paymentMethods[method]) {
          paymentMethods[method] = {
            method,
            count: 0,
            total: 0
          };
        }
        paymentMethods[method].count += 1;
        paymentMethods[method].total += parseFloat(txn.total || 0);
      });

      const totalRevenue = completedTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
      const paymentMethodBreakdown = Object.values(paymentMethods)
        .map(pm => ({
          ...pm,
          percentage: totalRevenue > 0 ? (pm.total / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

      // Calculate average transaction
      const avgTransaction = completedTransactions.length > 0
        ? completedTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0) / completedTransactions.length
        : 0;

      // Get recent transactions (last 5)
      const recentTransactions = [...completedTransactions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Calculate top products by quantity sold
      const productSales = {};
      completedTransactions.forEach(txn => {
        txn.items?.forEach(item => {
          const productId = item.productId || item.product?.id;
          const productName = item.productName || item.product?.name || 'Unknown';
          
          if (!productSales[productId]) {
            productSales[productId] = {
              id: productId,
              name: productName,
              quantitySold: 0,
              revenue: 0
            };
          }
          
          productSales[productId].quantitySold += item.quantity || 0;
          productSales[productId].revenue += parseFloat(item.total || 0);
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);

      // Get low stock products
      const lowStockProducts = products
        .filter(p => p.stockQuantity <= p.lowStockAlert && p.isActive)
        .sort((a, b) => a.stockQuantity - b.stockQuantity)
        .slice(0, 5);

      // Customer statistics
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const newCustomersThisMonth = customers.filter(c => 
        new Date(c.createdAt) >= monthStart
      ).length;

      const activeCustomers = customers.filter(c => 
        c.lastVisit && new Date(c.lastVisit) >= monthAgo
      ).length;

      // Generate sales trend for last 7 days
      const salesTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        
        const dayTxns = completedTransactions.filter(t => {
          const txnDate = new Date(t.createdAt);
          return txnDate >= date && txnDate < nextDate;
        });

        const daySales = dayTxns.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
        
        salesTrend.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: daySales,
          transactions: dayTxns.length
        });
      }

      setDashboardData({
        salesMetrics: {
          todaySales,
          weekSales,
          monthSales,
          todayTransactions: todayTxns.length,
          weekTransactions: weekTxns.length,
          monthTransactions: monthTxns.length,
          averageTransaction: avgTransaction,
          yesterdaySales,
          lastWeekSales,
          lastMonthSales
        },
        recentTransactions,
        topProducts,
        lowStockProducts,
        customerStats: {
          total: customers.length,
          newThisMonth: newCustomersThisMonth,
          activeCustomers
        },
        salesTrend,
        paymentMethodBreakdown
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateGrowth = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'CASH': 'Cash',
      'CARD': 'Card',
      'MOBILE_MONEY': 'Mobile Money',
      'BANK_TRANSFER': 'Bank Transfer'
    };
    return labels[method] || method;
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'CASH': 'bg-green-500',
      'CARD': 'bg-blue-500',
      'MOBILE_MONEY': 'bg-purple-500',
      'BANK_TRANSFER': 'bg-orange-500'
    };
    return colors[method] || 'bg-gray-500';
  };

  const getMetricByRange = () => {
    switch(dateRange) {
      case 'today':
        return {
          sales: dashboardData.salesMetrics.todaySales,
          transactions: dashboardData.salesMetrics.todayTransactions,
          label: 'Today',
          previousSales: dashboardData.salesMetrics.yesterdaySales,
          previousLabel: 'vs Yesterday'
        };
      case 'week':
        return {
          sales: dashboardData.salesMetrics.weekSales,
          transactions: dashboardData.salesMetrics.weekTransactions,
          label: 'This Week',
          previousSales: dashboardData.salesMetrics.lastWeekSales,
          previousLabel: 'vs Last Week'
        };
      case 'month':
        return {
          sales: dashboardData.salesMetrics.monthSales,
          transactions: dashboardData.salesMetrics.monthTransactions,
          label: 'This Month',
          previousSales: dashboardData.salesMetrics.lastMonthSales,
          previousLabel: 'vs Last Month'
        };
      default:
        return {
          sales: dashboardData.salesMetrics.todaySales,
          transactions: dashboardData.salesMetrics.todayTransactions,
          label: 'Today',
          previousSales: dashboardData.salesMetrics.yesterdaySales,
          previousLabel: 'vs Yesterday'
        };
    }
  };

  const currentMetric = getMetricByRange();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Calculate max value for chart scaling
  const maxSales = Math.max(...dashboardData.salesTrend.map(d => d.sales), 1);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse text-green-500" />
            Auto-refresh every 5 min
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setDateRange('today')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            dateRange === 'today'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setDateRange('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            dateRange === 'week'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setDateRange('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            dateRange === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          This Month
        </button>
      </div>

      {/* Shift Control */}
      <div className="mb-6">
        <ShiftControl />
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Sales Card */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">{currentMetric.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {formatCurrency(currentMetric.sales)}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Sales</p>
            {currentMetric.previousSales !== undefined && (
              <span className={`text-xs font-medium flex items-center gap-1 ${
                calculateGrowth(currentMetric.sales, currentMetric.previousSales) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {calculateGrowth(currentMetric.sales, currentMetric.previousSales) >= 0 ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {Math.abs(calculateGrowth(currentMetric.sales, currentMetric.previousSales)).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Transactions Card */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">{currentMetric.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {currentMetric.transactions}
          </div>
          <p className="text-sm text-gray-600">Transactions</p>
        </div>

        {/* Average Transaction */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Average</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {formatCurrency(dashboardData.salesMetrics.averageTransaction)}
          </div>
          <p className="text-sm text-gray-600">Per Transaction</p>
        </div>

        {/* Customers Card */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              {dashboardData.customerStats.newThisMonth}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-800 mb-1">
            {dashboardData.customerStats.total}
          </div>
          <p className="text-sm text-gray-600">Total Customers</p>
        </div>
      </div>

      {/* Sales Trend Chart and Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sales Trend (Last 7 Days)
            </h2>
            <button
              onClick={fetchDashboardData}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-3">
            {dashboardData.salesTrend.map((day, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 w-16">{day.date}</span>
                  <span className="text-gray-600">{day.transactions} txn</span>
                  <span className="font-semibold text-gray-800 w-20 text-right">
                    {formatCurrency(day.sales)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(day.sales / maxSales) * 100}%` }}
                    >
                      {day.sales > 0 && (
                        <span className="text-xs font-medium text-white">
                          ${day.sales.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Low Stock Alerts
          </h2>
          
          {dashboardData.lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-600">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      product.stockQuantity === 0 
                        ? 'text-red-600' 
                        : 'text-orange-600'
                    }`}>
                      {product.stockQuantity}
                    </div>
                    <p className="text-xs text-gray-600">in stock</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/products')}
                className="w-full mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
              >
                Manage Inventory
              </button>
            </div>
          )}
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Payment Methods
          </h2>
          
          {dashboardData.paymentMethodBreakdown.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No payment data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.paymentMethodBreakdown.map((payment) => (
                <div key={payment.method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPaymentMethodColor(payment.method)}`}></div>
                      <span className="font-medium text-gray-700">
                        {getPaymentMethodLabel(payment.method)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{payment.count} txn</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(payment.total)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getPaymentMethodColor(payment.method)}`}
                        style={{ width: `${payment.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-12 text-right">
                      {payment.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            Top Selling Products
          </h2>
          
          {dashboardData.topProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-600">
                      {product.quantitySold} units sold
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              Recent Transactions
            </h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          
          {dashboardData.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No transactions yet</p>
              <button
                onClick={() => navigate('/pos')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Start Selling
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/transactions')}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {transaction.transactionNumber}
                    </p>
                    <p className="text-xs text-gray-600">
                      {transaction.customer 
                        ? `${transaction.customer.firstName} ${transaction.customer.lastName}`
                        : 'Walk-in'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(transaction.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">
                      {formatCurrency(transaction.total)}
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      {transaction.items?.length || 0} items
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-semibold">New Sale</span>
        </button>
        
        <button
          onClick={() => navigate('/products')}
          className="flex items-center justify-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
        >
          <Package className="w-6 h-6" />
          <span className="font-semibold">Manage Products</span>
        </button>
        
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center justify-center gap-3 p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
        >
          <Users className="w-6 h-6" />
          <span className="font-semibold">View Customers</span>
        </button>
        
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
        >
          <Receipt className="w-6 h-6" />
          <span className="font-semibold">View Transactions</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;