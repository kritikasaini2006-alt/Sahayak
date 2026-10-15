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
import { useTranslation } from '../context/LanguageContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function SignUpPage() {
  const { t, language } = useTranslation();
  useDocumentTitle(t('auth.signupTitle'));
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
    <div className="py-6 sm:py-10 px-4 flex flex-col items-center justify-start flex-1">
      <div className="w-full max-w-[460px] space-y-4">
        {/* Civic Logo & Heading */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-navy-800 to-teal-800 text-white shadow-md mx-auto mb-1">
            <span className="font-extrabold text-xl tracking-tight text-teal-300">स</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            {t('auth.signupTitle')}
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {t('auth.signupSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 sm:p-6 space-y-3.5">
          {/* Provider status badge */}
          <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="font-medium">{t('auth.securityBadge')}</span>
            </div>
            <Badge variant={isConfigured ? 'teal' : 'amber'}>
              {isConfigured ? 'Supabase Auth' : t('auth.configNeededTitle')}
            </Badge>
          </div>

          {/* Unconfigured Warning Banner */}
          {!isConfigured && (
            <div className="bg-amber-50/90 border border-amber-200 text-amber-900 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed space-y-1">
                <p className="font-bold">{t('auth.configNeededTitle')}</p>
                <p className="text-slate-600 text-[11px]">
                  {t('auth.configNeededDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start gap-2 animate-fadeIn">
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
                  {language === 'hi' ? 'खाता बन गया! कृपया अपना ईमेल सत्यापित करें' : 'Account Created! Please Verify Your Email'}
                </div>
                <p className="text-teal-800 leading-relaxed">
                  {language === 'hi'
                    ? `हमने ${email} पर एक सत्यापन लिंक भेजा है। कृपया अपने इनबॉक्स की जांच करें और अपने खाते को सक्रिय करने के लिए लिंक पर क्लिक करें।`
                    : `We have sent a confirmation link to ${email}. Please check your inbox and click the verification link to activate your account.`}
                </p>
              </div>
              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              {/* Full Name */}
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.fullNameLabel')} <span className="text-rose-500">*</span>
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
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.emailLabel')} <span className="text-rose-500">*</span>
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
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.passwordLabel')} <span className="text-rose-500">*</span>
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
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
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
                <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('auth.confirmPasswordLabel')} <span className="text-rose-500">*</span>
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
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
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
              <div className="pt-0.5">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="leading-relaxed">
                    {t('auth.termsLabel')}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'hi' ? 'खाता बन रहा है...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.signupBtn')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch to Sign In */}
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              state={{ from: location.state?.from }}
              className="font-bold text-teal-700 hover:text-teal-900 hover:underline ml-1"
            >
              {t('auth.loginBtn')}
            </Link>
          </div>
        </div>

        {/* Trust & Privacy Notice */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>
            {t('auth.zeroPiiPolicy')}
          </p>
        </div>
      </div>
    </div>
  );
}

