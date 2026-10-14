import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Compass, Sparkles, CheckSquare, FolderCheck, Info, Menu, X, Landmark } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home', icon: Landmark, end: true },
    { to: '/schemes', label: 'Discover Schemes', icon: Compass },
    { to: '/eligibility', label: 'Check Eligibility', icon: CheckSquare },
    { to: '/assistant', label: 'AI Assistant', icon: Sparkles, highlight: true },
    { to: '/applications', label: 'My Applications', icon: FolderCheck },
    { to: '/about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Civic Branding */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1">
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
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

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <NavLink
              to="/assistant"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </NavLink>

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
        <div id="mobile-menu" className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1 shadow-lg">
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
      )}
    </header>
  );
}

