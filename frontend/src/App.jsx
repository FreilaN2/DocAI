import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './i18n';

// Lazy load de páginas - solo se cargan cuando se necesitan
const Landing = lazy(() => import('./pages/Landing'));
const Editor = lazy(() => import('./pages/Editor'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const Support = lazy(() => import('./pages/Support'));
const Tools = lazy(() => import('./pages/Tools'));

// Componente de carga mientras se cargan las páginas
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-container"></div>
  </div>
);

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: '12px', background: '#1e1e1e', color: '#fff' },
          success: { iconTheme: { primary: '#ff6b00', secondary: '#fff' } }
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/editor/:plan" element={<Editor />} />
          <Route path="/login" element={
            <GoogleOAuthProvider clientId="TU_CLIENT_ID">
              <Auth />
            </GoogleOAuthProvider>
          } />
          <Route path="/register" element={
            <GoogleOAuthProvider clientId="TU_CLIENT_ID">
              <Auth />
            </GoogleOAuthProvider>
          } />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/support" element={<Support />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/pago/exitoso" element={<PaymentSuccess />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;