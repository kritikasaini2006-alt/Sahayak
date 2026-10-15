import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Bot,
  CheckSquare,
  FolderCheck,
  Info,
  Menu,
  X,
  Landmark,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  // Close menus when route/pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation: Close mobile menu & profile dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Landmark, end: true },
    { to: '/schemes', label: t('nav.discoverSchemes'), icon: Compass },
    { to: '/eligibility', label: t('nav.checkEligibility'), icon: CheckSquare },
    { to: '/assistant', label: t('nav.aiAssistant'), icon: Bot, highlight: true },
    { to: '/applications', label: t('nav.myApplications'), icon: FolderCheck },
    { to: '/about', label: t('nav.about'), icon: Info },
  ];

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Citizen';

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#445363] border-b border-[#384452] shadow-sm backdrop-blur-md">
      {/* Full width responsive container (replaces restrictive max-w-7xl mx-auto to eliminate excessive left blank space) */}
      <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[68px] gap-2 lg:gap-4">
          {/* Logo & Civic Branding (Left Section) */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EDD575] rounded-xl py-1 pr-1 shrink-0"
            aria-label={t('brand.name')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#454F2A] flex items-center justify-center text-[#FAF8F1] shadow-sm group-hover:scale-[1.03] transition-transform shrink-0">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#EDD575]">स</span>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base sm:text-lg text-[#FAF8F1] tracking-tight whitespace-nowrap">
                  {t('brand.name')}<span className="text-[#EDD575]">{t('brand.domain')}</span>
                </span>
                <span className="bg-[#EDD575]/20 border border-[#EDD575]/50 text-[#EDD575] font-bold text-[9px] sm:text-[10px] uppercase px-1.5 py-0.5 rounded tracking-wide shrink-0">
                  {t('brand.badge')}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#E5E8E1]/80 font-medium leading-none mt-1 hidden sm:block lg:hidden xl:block whitespace-nowrap">
                {t('brand.subtitle')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Flexible Central Section) */}
          <nav
            className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2 px-2 xl:px-4 min-w-0"
            aria-label={t('nav.toggleMenu')}
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EDD575] ${
                      isActive
                        ? item.highlight
                          ? 'bg-[#454F2A] text-white font-semibold shadow-xs'
                          : 'bg-[#384452] text-[#FAF8F1] font-semibold shadow-2xs'
                        : item.highlight
                        ? 'text-[#EDD575] bg-[#384452]/70 hover:bg-[#454F2A] hover:text-[#FAF8F1] font-medium border border-[#EDD575]/40'
                        : 'text-[#E5E8E1] hover:text-white hover:bg-[#384452]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Right Actions (Grouped on Right) */}
          <div className="hidden lg:flex items-center justify-end gap-2 xl:gap-2.5 shrink-0">
            {/* Language Selector Desktop */}
            <LanguageSelector variant="desktop" />

            {isAuthenticated ? (
              /* Authenticated User Menu */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="h-9 inline-flex items-center gap-2 pl-2 pr-2.5 xl:pr-3 rounded-lg border border-[#384452] hover:border-[#EDD575]/60 bg-[#34404e] hover:bg-[#384452] text-[#FAF8F1] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EDD575] whitespace-nowrap shadow-2xs"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User profile menu"
                >
                  <div className="w-6 h-6 rounded-md bg-[#454F2A] text-[#EDD575] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {userInitial}
                  </div>
                  <span className="text-xs font-semibold text-[#FAF8F1] max-w-[110px] xl:max-w-[140px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#E5E8E1] transition-transform ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#FAF8F1] rounded-2xl shadow-xl border border-[#445363]/20 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-[#445363]/10">
                      <p className="text-[10px] text-[#445363]/60 uppercase tracking-wider font-bold">
                        {t('nav.signedInAs')}
                      </p>
                      <p className="text-sm font-bold text-[#445363] truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-[#445363]/70 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/applications"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#445363] hover:bg-[#E5E8E1] transition-colors"
                      >
                        <FolderCheck className="w-4 h-4 text-[#454F2A] shrink-0" />
                        <span>{t('nav.myApplicationsSchemes')}</span>
                      </Link>
                      <Link
                        to="/eligibility"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#445363] hover:bg-[#E5E8E1] transition-colors"
                      >
                        <CheckSquare className="w-4 h-4 text-[#454F2A] shrink-0" />
                        <span>{t('nav.myCitizenProfile')}</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#445363]/10">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>{t('nav.signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated Buttons (lg and up) */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="h-9 inline-flex items-center justify-center px-3 xl:px-3.5 text-xs font-semibold text-[#FAF8F1] hover:text-white hover:bg-[#384452] hover:bg-slate-100 border border-[#FAF8F1]/30 hover:border-[#FAF8F1]/60 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EDD575] whitespace-nowrap"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 xl:px-4 bg-[#454F2A] bg-teal-600 hover:bg-[#384022] active:bg-[#2c331b] text-white rounded-lg text-xs font-semibold shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EDD575] focus-visible:ring-offset-1 whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('nav.signup')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Tablet & Mobile Right Bar (< lg screens) */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Language Selector Tablet */}
            <div className="hidden sm:inline-flex">
              <LanguageSelector variant="desktop" />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg bg-[#454F2A] text-[#EDD575] flex items-center justify-center font-bold text-xs shadow-xs"
                  title={displayName}
                >
                  {userInitial}
                </div>
              </div>
            ) : (
              /* Tablet actions: visible on sm/md (640px - 1023px, e.g. 768px tablet), hidden on mobile (< 640px, e.g. 320px, 390px) */
              <div className="hidden sm:inline-flex items-center gap-2">
                <Link
                  to="/login"
                  className="h-8 inline-flex items-center px-3 text-xs font-semibold rounded-lg text-[#FAF8F1] hover:bg-[#384452] border border-[#FAF8F1]/30 whitespace-nowrap"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="h-8 inline-flex items-center gap-1.5 px-3 bg-[#454F2A] hover:bg-[#384022] text-white rounded-lg text-xs font-semibold shadow-xs whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('nav.signup')}</span>
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#FAF8F1] hover:text-white hover:bg-[#384452] border border-[#384452] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EDD575] transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label={t('nav.toggleMenu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#FAF8F1]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t border-[#384452] bg-[#FAF8F1] px-4 pt-3 pb-6 space-y-4 shadow-lg animate-fadeIn"
        >
          {/* Prominent Language Selector in Mobile Drawer */}
          <LanguageSelector variant="mobile" />

          {/* User profile info banner if logged in on mobile */}
          {isAuthenticated && (
            <div className="bg-[#E5E8E1] border border-[#445363]/20 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[#454F2A] text-[#EDD575] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {userInitial}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-[#445363] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#445363]/70 truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors text-xs font-semibold shrink-0"
                title={t('nav.signOut')}
                aria-label={t('nav.signOut')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('nav.signOut')}</span>
              </button>
            </div>
          )}

          {/* Navigation Links List */}
          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#445363] text-white font-semibold shadow-xs'
                        : item.highlight
                        ? 'text-[#454F2A] bg-[#E5E8E1] border border-[#454F2A]/30 font-semibold'
                        : 'text-[#445363] hover:bg-[#E5E8E1]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-current shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Auth Actions (if logged out) */}
          {!isAuthenticated && (
            <div className="pt-3 border-t border-[#445363]/15 flex flex-col gap-2">
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-10 flex items-center justify-center gap-2 bg-[#454F2A] hover:bg-[#384022] active:bg-[#2c331b] text-white rounded-xl text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>{t('nav.createAccount')}</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-10 flex items-center justify-center gap-2 bg-[#E5E8E1] hover:bg-[#d8dcd3] text-[#445363] rounded-xl text-sm font-semibold transition-colors border border-[#445363]/20 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>{t('nav.login')}</span>
              </Link>
            </div>
          )}

          {/* Sub-footer trust note */}
          <div className="pt-2 text-center text-[11px] text-[#445363]/70">
            <span>🛡️ {t('footer.independentBadge')}</span>
          </div>
        </div>
      )}
    </header>
  );
}
