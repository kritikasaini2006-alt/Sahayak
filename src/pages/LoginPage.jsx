import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function LoginPage() {
  useDocumentTitle('Sign In');
  const { login, resetPassword, isConfigured, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const fromDestination = location.state?.from?.pathname || '/applications';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Forgot password sub-state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate(fromDestination, { replace: true });
    } else {
      setFormError(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address to receive password reset instructions.');
      return;
    }

    setResetLoading(true);
    const result = await resetPassword(email.trim());
    setResetLoading(false);

    if (result.success) {
      setResetSent(true);
    } else {
      setFormError(result.error || 'Could not send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Civic Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-800 to-teal-800 text-white shadow-md mx-auto mb-2">
            <span className="font-extrabold text-2xl tracking-tight text-teal-300">स</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            {isForgotMode ? 'Reset Your Password' : 'Sign in to Sahayak AI'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {isForgotMode
              ? 'Enter your registered email address and we will send you instructions to reset your password.'
              : 'Access your saved schemes, personalized eligibility records, and application checklists.'}
          </p>
        </div>

        {/* Redirect notice if redirected from protected route */}
        {location.state?.from && !isForgotMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Authentication Required:</span> Please log in to view your applications dashboard and user workspace.
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          {/* Provider status badge */}
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Civic-Tech Secure Auth</span>
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

          {/* Reset Sent Confirmation */}
          {resetSent ? (
            <div className="bg-teal-50 border border-teal-200 text-teal-800 rounded-xl p-4 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Password Reset Instructions Sent
              </div>
              <p className="text-teal-700 leading-relaxed">
                If an account exists with <strong className="font-semibold">{email}</strong>, you will receive an email with instructions to securely reset your password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false);
                  setResetSent(false);
                }}
                className="mt-3 inline-block font-semibold text-teal-900 hover:underline"
              >
                Return to Login
              </button>
            </div>
          ) : isForgotMode ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
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

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotMode(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-navy-900"
                >
                  Back to Sign In
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={resetLoading}
                  icon={resetLoading ? Loader2 : KeyRound}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          ) : (
            /* Standard Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setFormError(null);
                    }}
                    className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch to Sign Up */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link
              to="/signup"
              state={{ from: location.state?.from }}
              className="font-bold text-teal-700 hover:text-teal-900 hover:underline"
            >
              Sign Up for Free
            </Link>
          </div>
        </div>

        {/* Security / Privacy reassurance banner */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            🔒 Sahayak AI never requests your Aadhaar number, OTP, or bank passwords.
          </p>
          <p>
            All account authentication is handled through secure encrypted protocols.
          </p>
        </div>
      </div>
    </div>
  );
}

