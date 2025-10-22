import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import { LogIn, Store } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    dispatch(loginStart());

    try {
      const response = await authService.login(username, password);

      if (response.success) {
        dispatch(loginSuccess(response.data));
        toast.success(`Welcome back, ${response.data.user.fullName}!`);
        navigate('/dashboard');
      } else {
        dispatch(loginFailure(response.message));
        toast.error(response.message || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <Store className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Ayende-CX</h1>
          <p className="text-gray-600">Payment Register System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">Demo Credentials:</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-semibold text-gray-700">Admin</p>
              <p className="text-gray-600">admin / admin123</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-semibold text-gray-700">Cashier</p>
              <p className="text-gray-600">cashier / cashier123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
