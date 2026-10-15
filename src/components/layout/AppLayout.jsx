import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import DisclaimerBanner from '../common/DisclaimerBanner';
import PageLoader from '../common/PageLoader';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#E5E8E1] text-[#445363] antialiased">
      {/* Top Civic Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Navbar */}
      <Navbar />

      {/* Page Content Viewport */}
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Trust & Civic Footer */}
      <Footer />
    </div>
  );
}

