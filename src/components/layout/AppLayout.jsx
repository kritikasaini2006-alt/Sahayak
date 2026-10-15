import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import DisclaimerBanner from '../common/DisclaimerBanner';
import PageLoader from '../common/PageLoader';

export default function AppLayout() {
  const location = useLocation();
  const isAssistantPage = location.pathname === '/assistant';

  return (
    <div
      className={`flex flex-col bg-[#E5E8E1] text-[#445363] antialiased ${
        isAssistantPage ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Civic Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Navbar */}
      <Navbar />

      {/* Page Content Viewport */}
      <main className={`flex-1 flex flex-col ${isAssistantPage ? 'min-h-0 overflow-hidden' : ''}`}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Trust & Civic Footer (omitted on full-viewport chat assistant to prevent document-level scrolling) */}
      {!isAssistantPage && <Footer />}
    </div>
  );
}

