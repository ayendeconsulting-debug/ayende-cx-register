import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Palette,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  ArrowRight,
  Globe,
  FileText,
  ExternalLink,
  X
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const BusinessRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Business Info, 2: Owner Info, 3: Theme & Terms
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);

  // Terms state
  const [currentTerms, setCurrentTerms] = useState(null);
  const [setTermsLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    subdomain: '',
    businessEmail: '',
    businessPhone: '',

    // Owner Information
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: '',

    // Theme Settings
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',

    // Terms Acceptance
    termsAccepted: false
  });

  // Fetch current terms on component mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/terms/current`);
        setCurrentTerms(response.data.data);
      } catch (error) {
        console.error('Error fetching terms:', error);
        // Don't block registration if terms fetch fails, but log it
      } finally {
        setTermsLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');

    // Clear subdomain availability when subdomain changes
    if (name === 'subdomain') {
      setSubdomainAvailable(null);
    }
  };

  // Auto-generate subdomain from business name
  useEffect(() => {
    if (formData.businessName && !formData.subdomain) {
      const suggested = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);

      setFormData(prev => ({
        ...prev,
        subdomain: suggested
      }));
    }
  }, [formData.businessName, formData.subdomain]);

  // Check subdomain availability
  const checkSubdomain = async () => {
    if (!formData.subdomain) return;

    // Validate format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      setSubdomainAvailable({ available: false, message: 'Only lowercase letters, numbers, and hyphens allowed' });
      return;
    }

    setCheckingSubdomain(true);
    try {
      const url = `${API_BASE_URL}/businesses/check-subdomain/${formData.subdomain}`;
      const response = await axios.get(url);
      setSubdomainAvailable({
        available: response.data.data.available,
        message: response.data.message
      });
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable({ available: false, message: 'Error checking availability' });
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.businessName) {
      setError('Business name is required');
      return false;
    }
    if (!formData.subdomain) {
      setError('Subdomain is required');
      return false;
    }
    if (!subdomainAvailable || !subdomainAvailable.available) {
      setError('Please choose an available subdomain');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.ownerFirstName || !formData.ownerLastName) {
      setError('Owner name is required');
      return false;
    }
    if (!formData.ownerEmail) {
      setError('Owner email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.ownerEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.ownerPassword || formData.ownerPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.ownerPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy to register');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate terms acceptance
    if (!validateStep3()) {
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/businesses/register`, {
        businessName: formData.businessName,
        subdomain: formData.subdomain,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        ownerFirstName: formData.ownerFirstName,
        ownerLastName: formData.ownerLastName,
        ownerEmail: formData.ownerEmail,
        ownerPassword: formData.ownerPassword,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        // Include terms acceptance
        termsAccepted: formData.termsAccepted,
        termsVersionId: currentTerms?.id || null
      });

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Registration successful! Please login with your credentials.',
            username: `admin.${formData.subdomain}`
          }
        });
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  // Terms Modal Component
  const TermsModal = () => {
    if (!showTermsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentTerms?.title || 'Terms of Service and Privacy Policy'}
                </h2>
                <p className="text-sm text-gray-500">
                  Version {currentTerms?.version || '1.0.0'} • Effective {currentTerms?.effectiveDate ? new Date(currentTerms.effectiveDate).toLocaleDateString() : 'January 1, 2025'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

         {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms of Service</h3>
              
              <p className="text-gray-700 mb-4">
                Welcome to AyendeCX. These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement 
                between you (&quot;Subscriber,&quot; &quot;you,&quot; or &quot;your&quot;) and AyendeCX Inc, a Canadian corporation 
                (&quot;AyendeCX,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
              </p>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">1. Acceptance of Terms</h4>
              <p className="text-gray-700 mb-4">
                By clicking &quot;I Agree,&quot; creating an account, or using our services, you acknowledge that you 
                have read, understood, and agree to be bound by these Terms and our Privacy Policy.
              </p>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">2. Platform Services</h4>
              <p className="text-gray-700 mb-4">
                AyendeCX provides a point-of-sale (POS) and customer relationship management (CRM) platform 
                designed for businesses. Our services include transaction processing, customer management, 
                loyalty programs, inventory management, and reporting tools.
              </p>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">3. Data Ownership</h4>
              <p className="text-gray-700 mb-4">
                You retain all ownership rights to your data. We act as a Data Processor for your customer 
                information and process it only according to your instructions and as necessary to provide 
                our services.
              </p>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">4. Subscription and Payment</h4>
              <p className="text-gray-700 mb-4">
                Subscription fees are billed in advance. All payments are non-refundable except as required 
                by applicable law. We reserve the right to modify pricing with 30 days&apos; advance notice.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Privacy Policy</h3>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">1. Information We Collect</h4>
              <p className="text-gray-700 mb-4">
                We collect business registration information, user account details, transaction data, and 
                technical information necessary to provide our services.
              </p>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">2. How We Use Information</h4>
              <p className="text-gray-700 mb-4">
                We use collected information to operate the platform, provide customer support, improve our 
                services, and communicate important updates.
              </p>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">3. Data Security</h4>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures including encryption, access controls, and 
                regular security assessments to protect your data.
              </p>

              <h4 className="font-semibold text-gray-800 mt-6 mb-2">4. Data Retention</h4>
              <p className="text-gray-700 mb-4">
                We retain your data for the duration of your subscription plus 30 days for export purposes. 
                After termination, data is permanently deleted.
              </p>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Full Documents:</strong> The complete Terms of Service and Privacy Policy documents 
                  are available at{' '}
                  <a 
                    href="https://ayendecx.com/legal/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    ayendecx.com/legal/terms
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                By proceeding, you agree to these terms.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, termsAccepted: true }));
                    setShowTermsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  I Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your business has been registered successfully. Redirecting to login...
          </p>
          <div className="flex items-center justify-center">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Register Your Business</h1>
          <p className="text-gray-600">Join Ayende POS and start managing your business today</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              2
            </div>
            <div className={`w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold`}>
              3
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  Business Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your business name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain * <span className="text-gray-500 text-xs">(Your unique URL)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleChange}
                        onBlur={checkSubdomain}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="yourbusiness"
                        pattern="[a-z0-9\-]+"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {checkingSubdomain && <Loader className="w-5 h-5 animate-spin text-blue-600" />}
                        {!checkingSubdomain && subdomainAvailable?.available && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {!checkingSubdomain && subdomainAvailable && !subdomainAvailable.available && (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    <span className="text-gray-500">.ayendecx.com</span>
                  </div>
                  {subdomainAvailable && (
                    <p className={`mt-2 text-sm ${subdomainAvailable.available ? 'text-green-600' : 'text-red-600'}`}>
                      {subdomainAvailable.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Only lowercase letters, numbers, and hyphens allowed
                  </p>
                </div>

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
                      value={formData.businessEmail}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Owner Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Owner Information
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="ownerFirstName"
                      value={formData.ownerFirstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="ownerLastName"
                      value={formData.ownerLastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="ownerEmail"
                      value={formData.ownerEmail}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="ownerPassword"
                      value={formData.ownerPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Min. 8 characters"
                      minLength="8"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Theme Settings & Terms */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Palette className="w-6 h-6 text-blue-600" />
                  Customize Your Theme
                </h2>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
                  <div
                    className="h-32 rounded-lg shadow-lg flex items-center justify-center text-white text-xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.secondaryColor} 100%)`
                    }}
                  >
                    {formData.businessName || 'Your Business'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        className="w-16 h-12 border-2 border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="#667eea"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={handleChange}
                        className="w-16 h-12 border-2 border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="#764ba2"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Terms & Conditions
                  </h3>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      Please review and accept our Terms of Service and Privacy Policy before completing your registration.
                      {currentTerms && (
                        <span className="block mt-1 text-xs text-blue-600">
                          Version {currentTerms.version} • Effective {new Date(currentTerms.effectiveDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="termsAccepted" className="text-sm text-gray-700 cursor-pointer">
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Privacy Policy
                      </button>
                      . I understand that my business data and customer information will be processed 
                      in accordance with these agreements. *
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.termsAccepted}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Complete Registration
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal />
    </div>
  );
};

export default BusinessRegistration;