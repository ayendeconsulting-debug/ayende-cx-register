import { useState, useEffect } from 'react';
import { 
  Building2, 
  Palette, 
  Save,
  Loader,
  AlertCircle,
  CheckCircle,
  Mail,
  Phone,
  Globe,
  MapPin,
  Receipt,
  Percent,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const BusinessSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general'); // general, theme, tax

  const [settings, setSettings] = useState({
    businessName: '',
    subdomain: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZipCode: '',
    businessCountry: '',
    businessWebsite: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    logoUrl: '',
    taxEnabled: true,
    taxRate: 0,
    taxLabel: 'Tax',
    taxNumber: '',
    receiptHeader: '',
    receiptFooter: '',
    currency: '$',
    currencyCode: 'USD',
  });

  const [themeForm, setThemeForm] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    logoUrl: '',
  });

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/business-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data.data;
      setSettings(data);
      setThemeForm({
        primaryColor: data.primaryColor || '#3B82F6',
        secondaryColor: data.secondaryColor || '#10B981',
        logoUrl: data.logoUrl || '',
      });
      setError('');
    } catch (error) {
      console.error('Error fetching business settings:', error);
      setError(error.response?.data?.message || 'Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (e) => {
    const { name, value } = e.target;
    setThemeForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleThemeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `${API_BASE_URL}/business-settings/theme`,
        themeForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSettings(prev => ({
        ...prev,
        ...response.data.data,
      }));

      setSuccessMessage('Theme updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating theme:', error);
      setError(error.response?.data?.message || 'Failed to update theme');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const updateData = {
        businessName: settings.businessName,
        businessEmail: settings.businessEmail,
        businessPhone: settings.businessPhone,
        businessAddress: settings.businessAddress,
        businessCity: settings.businessCity,
        businessState: settings.businessState,
        businessZipCode: settings.businessZipCode,
        businessCountry: settings.businessCountry,
        businessWebsite: settings.businessWebsite,
        receiptHeader: settings.receiptHeader,
        receiptFooter: settings.receiptFooter,
      };

      await axios.patch(
        `${API_BASE_URL}/business-settings/info`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage('Business information updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating business info:', error);
      setError(error.response?.data?.message || 'Failed to update business information');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const updateData = {
        taxEnabled: settings.taxEnabled,
        taxRate: parseFloat(settings.taxRate),
        taxLabel: settings.taxLabel,
        taxNumber: settings.taxNumber,
      };

      await axios.patch(
        `${API_BASE_URL}/business-settings/tax`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage('Tax settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating tax settings:', error);
      setError(error.response?.data?.message || 'Failed to update tax settings');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
              <p className="text-gray-600">Manage your business information and preferences</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              General Info
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'theme'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Palette className="w-4 h-4 inline-block mr-2" />
              Theme
            </button>
            <button
              onClick={() => setActiveTab('tax')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'tax'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Percent className="w-4 h-4 inline-block mr-2" />
              Tax Settings
            </button>
          </div>
        </div>

        {/* General Info Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleInfoSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Business Information</h2>
            
            <div className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={settings.businessName}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Subdomain (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={settings.subdomain || 'N/A'}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <span className="text-gray-500">.ayendecx.com</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Subdomain cannot be changed</p>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="businessEmail"
                      value={settings.businessEmail || ''}
                      onChange={handleInfoChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="businessPhone"
                      value={settings.businessPhone || ''}
                      onChange={handleInfoChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="businessAddress"
                    value={settings.businessAddress || ''}
                    onChange={handleInfoChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="businessCity"
                    value={settings.businessCity || ''}
                    onChange={handleInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="businessState"
                    value={settings.businessState || ''}
                    onChange={handleInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip/Postal Code
                  </label>
                  <input
                    type="text"
                    name="businessZipCode"
                    value={settings.businessZipCode || ''}
                    onChange={handleInfoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="businessCountry"
                  value={settings.businessCountry || ''}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="businessWebsite"
                    value={settings.businessWebsite || ''}
                    onChange={handleInfoChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Receipt Settings */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Receipt Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt Header
                    </label>
                    <textarea
                      name="receiptHeader"
                      value={settings.receiptHeader || ''}
                      onChange={handleInfoChange}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Thank you for your business!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt Footer
                    </label>
                    <textarea
                      name="receiptFooter"
                      value={settings.receiptFooter || ''}
                      onChange={handleInfoChange}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please come again!"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Theme Tab */}
        {activeTab === 'theme' && (
          <form onSubmit={handleThemeSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Customize Your Theme</h2>
            
            {/* Live Preview */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Live Preview
              </label>
              <div
                className="h-48 rounded-xl shadow-lg flex items-center justify-center text-white text-2xl font-bold transition-all"
                style={{
                  background: `linear-gradient(135deg, ${themeForm.primaryColor} 0%, ${themeForm.secondaryColor} 100%)`
                }}
              >
                {settings.businessName}
              </div>
            </div>

            <div className="space-y-6">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="primaryColor"
                    value={themeForm.primaryColor}
                    onChange={handleThemeChange}
                    className="w-20 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={themeForm.primaryColor}
                    onChange={handleThemeChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#3B82F6"
                    pattern="^#[A-Fa-f0-9]{6}$"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Used for buttons, links, and primary elements</p>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={themeForm.secondaryColor}
                    onChange={handleThemeChange}
                    className="w-20 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={themeForm.secondaryColor}
                    onChange={handleThemeChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#10B981"
                    pattern="^#[A-Fa-f0-9]{6}$"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Used for accents and secondary elements</p>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  name="logoUrl"
                  value={themeForm.logoUrl}
                  onChange={handleThemeChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
                <p className="mt-1 text-xs text-gray-500">Link to your business logo image</p>
              </div>

              {/* Color Presets */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Ocean Blue', primary: '#0284c7', secondary: '#06b6d4' },
                    { name: 'Forest Green', primary: '#059669', secondary: '#10b981' },
                    { name: 'Royal Purple', primary: '#7c3aed', secondary: '#a855f7' },
                    { name: 'Sunset Orange', primary: '#ea580c', secondary: '#fb923c' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setThemeForm({
                        ...themeForm,
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                      })}
                      className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <div
                        className="h-12 rounded-md mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                        }}
                      />
                      <p className="text-xs font-medium text-gray-700 text-center">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Theme
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tax Settings Tab */}
        {activeTab === 'tax' && (
          <form onSubmit={handleTaxSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tax Configuration</h2>
            
            <div className="space-y-6">
              {/* Tax Enabled */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Tax</p>
                  <p className="text-sm text-gray-600">Apply tax to transactions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.taxEnabled}
                    onChange={(e) => setSettings({ ...settings, taxEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    name="taxRate"
                    value={settings.taxRate}
                    onChange={handleInfoChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.0000"
                    min="0"
                    max="1"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter as decimal (e.g., 0.13 for 13%)</p>
              </div>

              {/* Tax Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Label
                </label>
                <input
                  type="text"
                  name="taxLabel"
                  value={settings.taxLabel}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tax, VAT, GST, etc."
                />
                <p className="mt-1 text-xs text-gray-500">How tax appears on receipts</p>
              </div>

              {/* Tax Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Number / VAT Number
                </label>
                <input
                  type="text"
                  name="taxNumber"
                  value={settings.taxNumber || ''}
                  onChange={handleInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your tax registration number"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Tax Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BusinessSettings;