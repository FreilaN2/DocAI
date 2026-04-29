import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const hasCaptured = useRef(false);

  useEffect(() => {
    if (hasCaptured.current) return;
    hasCaptured.current = true;

    // PayPal usa 'token' como el identificador de la orden aprobada
    const orderId = searchParams.get('token'); 
    
    if (!orderId) {
      setStatus('error');
      setMessage('No se encontró el ID de la orden.');
      return;
    }

    const pendingStr = localStorage.getItem('pending_purchase');
    if (!pendingStr) {
      setStatus('error');
      setMessage('No se encontró información de la compra pendiente.');
      return;
    }

    const pending = JSON.parse(pendingStr);

    const confirm = async () => {
      const token = localStorage.getItem('token');
      const endpoint = pending.type === 'pack'
        ? 'http://127.0.0.1:8000/pago/confirmar-pack'
        : 'http://127.0.0.1:8000/pago/confirmar-suscripcion';

      const payload = { order_id: orderId };
      if (pending.type === 'pack') payload.pack_id = pending.pack_id;
      if (pending.type === 'subscription') payload.months = pending.months;

      try {
        const resp = await axios.post(endpoint, payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStatus('success');
        setMessage(resp.data.message || '¡Pago confirmado!');
        toast.success('¡Pago procesado con éxito! 🎉');
        localStorage.removeItem('pending_purchase');

        // Actualizar plan localmente en el navegador
        if (pending.type === 'subscription') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr);
              userObj.plan = 'pro';
              localStorage.setItem('user', JSON.stringify(userObj));
              // Forzar actualización de la Navbar si es necesario
              window.dispatchEvent(new Event('storage'));
            } catch (e) {
              // Ignorar
            }
          }
        }
      } catch (err) {
        // Ignorar el error si ya fue capturado (doble petición en React StrictMode)
        if (err.response?.data?.detail?.includes('ORDER_ALREADY_CAPTURED')) {
          setStatus('success');
          setMessage('¡Pago confirmado!');
          toast.success('¡Pago procesado con éxito! 🎉');
          localStorage.removeItem('pending_purchase');

          // Actualizar plan localmente en el navegador
          if (pending.type === 'subscription') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const userObj = JSON.parse(userStr);
                userObj.plan = 'pro';
                localStorage.setItem('user', JSON.stringify(userObj));
                window.dispatchEvent(new Event('storage'));
              } catch (e) {
                // Ignorar
              }
            }
          }
        } else {
          setStatus('error');
          setMessage(err.response?.data?.detail || 'Error al confirmar el pago.');
          toast.error('No se pudo confirmar el pago.');
        }
      }
    };

    confirm();
  }, [searchParams]);

  return (
    <div className="bg-background min-h-screen text-on-background">
      <Navbar />
      <main className="pt-32 pb-24 px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-xl rounded-card border border-slate-200 dark:border-outline-variant/30 p-10 shadow-2xl text-center"
        >
          {status === 'loading' && (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-16 h-16 border-4 border-orange-200 border-t-primary-container rounded-full mx-auto mb-6" />
              <h2 className="text-2xl font-black text-on-surface mb-2">{t('payment.processing')}</h2>
              <p className="text-on-surface-variant text-sm">{t('payment.wait')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-4xl">check_circle</span>
              </motion.div>
              <h2 className="text-3xl font-black text-on-surface mb-3">{t('payment.success_title')}</h2>
              <p className="text-on-surface-variant text-sm mb-8">{message}</p>
              <Link to="/editor/pro"
                className="inline-block bg-primary-container text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-orange-200 dark:shadow-orange-900/20 hover:opacity-90 transition-all no-underline"
              >
                {t('payment.go_pro')}
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
              </div>
              <h2 className="text-3xl font-black text-on-surface mb-3">{t('payment.error_title')}</h2>
              <p className="text-red-500 text-sm font-bold mb-8">{message}</p>
              <Link to="/upgrade"
                className="inline-block bg-slate-100 dark:bg-surface-variant text-on-surface font-black px-8 py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-surface-container-high transition-all no-underline"
              >
                {t('payment.back_upgrade')}
              </Link>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
