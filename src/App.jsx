import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Route-level code splitting with React.lazy
const HomePage = lazy(() => import('./pages/HomePage'));
const DiscoverSchemesPage = lazy(() => import('./pages/DiscoverSchemesPage'));
const CheckEligibilityPage = lazy(() => import('./pages/CheckEligibilityPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="schemes" element={<DiscoverSchemesPage />} />
              <Route path="eligibility" element={<CheckEligibilityPage />} />
              <Route path="assistant" element={<AIAssistantPage />} />
              <Route
                path="applications"
                element={
                  <ProtectedRoute>
                    <MyApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="about" element={<AboutPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignUpPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
