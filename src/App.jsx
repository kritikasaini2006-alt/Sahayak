import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import DiscoverSchemesPage from './pages/DiscoverSchemesPage';
import CheckEligibilityPage from './pages/CheckEligibilityPage';
import AIAssistantPage from './pages/AIAssistantPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
