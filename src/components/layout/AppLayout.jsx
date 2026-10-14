import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import DisclaimerBanner from '../common/DisclaimerBanner';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
      {/* Top Civic Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Navbar */}
      <Navbar />

      {/* Page Content Viewport */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Trust & Civic Footer */}
      <Footer />
    </div>
  );
}

