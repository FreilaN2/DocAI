import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './i18n';
import Landing from './pages/Landing';
import Editor from './pages/Editor';
import Auth from './pages/Auth';
import Upgrade from './pages/Upgrade';
import PaymentSuccess from './pages/PaymentSuccess';

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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/editor/:plan" element={<Editor />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/pago/exitoso" element={<PaymentSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;