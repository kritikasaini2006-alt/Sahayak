import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckSquare,
  FolderCheck,
  Info,
  Menu,
  X,
  Landmark,
  User,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();

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

  const navLinks = [
    { to: '/', label: 'Home', icon: Landmark, end: true },
    { to: '/schemes', label: 'Discover Schemes', icon: Compass },
    { to: '/eligibility', label: 'Check Eligibility', icon: CheckSquare },
    { to: '/assistant', label: 'AI Assistant', icon: Sparkles, highlight: true },
    { to: '/applications', label: 'My Applications', icon: FolderCheck },
    { to: '/about', label: 'About', icon: Info },
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Civic Branding */}
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1 shrink-0"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-navy-800 via-navy-900 to-teal-800 flex items-center justify-center text-white shadow-md shadow-navy-900/10 group-hover:scale-[1.03] transition-transform">
              <span className="font-extrabold text-lg tracking-tight text-teal-300">स</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg md:text-xl text-navy-900 tracking-tight">
                  Sahayak<span className="text-teal-600">.AI</span>
                </span>
                <span className="bg-teal-100/80 text-teal-800 font-semibold text-[10px] uppercase px-1.5 py-0.5 rounded tracking-wider">
                  Civic-Tech
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Citizen Welfare Schemes Assistant
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on lg and larger) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-2.5 xl:px-3.5 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                      isActive
                        ? item.highlight
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-navy-50 text-navy-900 font-semibold'
                        : item.highlight
                        ? 'text-teal-700 bg-teal-50/80 hover:bg-teal-100 font-medium'
                        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Action Buttons for md: and up screens */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {isAuthenticated ? (
              /* Authenticated User Menu */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/80 hover:bg-white text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
                  aria-expanded={profileDropdownOpen}
                  aria-label="User profile menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-navy-800 text-teal-300 flex items-center justify-center font-bold text-xs shadow-xs">
                    {userInitial}
                  </div>
                  <span className="text-xs font-semibold text-navy-900 max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        Signed In As
                      </p>
                      <p className="text-sm font-bold text-navy-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/applications"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-navy-900 transition-colors"
                      >
                        <FolderCheck className="w-4 h-4 text-teal-600" />
                        <span>My Applications & Schemes</span>
                      </Link>
                      <Link
                        to="/eligibility"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-navy-900 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4 text-teal-600" />
                        <span>My Citizen Profile</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated Buttons (Visible on md and larger) */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-navy-900 hover:bg-slate-100/80 rounded-lg transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Bar (< md screens) */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <div className="w-8 h-8 rounded-lg bg-navy-800 text-teal-300 flex items-center justify-center font-bold text-xs shadow-xs">
                {userInitial}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fadeIn">
          {/* User profile info banner if logged in on mobile */}
          {isAuthenticated && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-navy-800 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitial}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-navy-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs font-semibold shrink-0"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
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
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-navy-800 text-white font-semibold'
                        : item.highlight
                        ? 'text-teal-700 bg-teal-50 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 text-current shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Auth Buttons (if logged out) */}
          {!isAuthenticated && (
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Free Account</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
