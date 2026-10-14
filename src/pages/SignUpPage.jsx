import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileCheck,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function SignUpPage() {
  useDocumentTitle('Create Citizen Account');
  const { signUp, isConfigured, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromDestination = location.state?.from?.pathname || '/applications';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Validations
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setFormError('Please choose a password.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }
    if (!acceptTerms) {
      setFormError('Please agree to the Terms of Service and Privacy Policy to create your account.');
      return;
    }

    setLoading(true);
    const result = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);

    if (result.success) {
      if (result.requiresEmailConfirmation) {
        setEmailVerificationSent(true);
      } else {
        navigate(fromDestination, { replace: true });
      }
    } else {
      setFormError(result.error || 'Failed to register account. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Civic Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-800 to-teal-800 text-white shadow-md mx-auto mb-2">
            <span className="font-extrabold text-2xl tracking-tight text-teal-300">स</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Save your scheme progress, manage application records, and get personalized citizen guidance.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Provider status badge */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Independent Civic-Tech Security</span>
            </div>
            <Badge variant={isConfigured ? 'teal' : 'amber'}>
              {isConfigured ? 'Supabase Auth' : 'Config Needed'}
            </Badge>
          </div>

          {/* Unconfigured Warning Banner */}
          {!isConfigured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Supabase Config Needed:</span> <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> are not detected in the environment. Please add them in your Vercel Project Settings.
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl p-3 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{formError}</div>
            </div>
          )}

          {/* Verification Sent Success Screen */}
          {emailVerificationSent ? (
            <div className="space-y-4 py-2">
              <div className="bg-teal-50 border border-teal-200 text-teal-900 rounded-xl p-4 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-teal-950">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  Account Created! Please Verify Your Email
                </div>
                <p className="text-teal-800 leading-relaxed">
                  We have sent a confirmation link to <strong className="font-semibold">{email}</strong>. Please check your inbox and click the verification link to activate your account.
                </p>
              </div>
              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms of Service & Privacy Policy acceptance */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="leading-relaxed">
                    I agree to the{' '}
                    <Link to="/about" target="_blank" className="text-teal-700 font-semibold hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and acknowledge the{' '}
                    <Link to="/about" target="_blank" className="text-teal-700 font-semibold hover:underline">
                      Civic Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch to Sign In */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="font-bold text-teal-700 hover:text-teal-900 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Trust & Privacy Notice */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            🛡️ Zero-PII Policy: We never request or store Aadhaar numbers, OTPs, or document images.
          </p>
        </div>
      </div>
    </div>
  );
}

