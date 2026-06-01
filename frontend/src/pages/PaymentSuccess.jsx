import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

// Constantes de estilos
const LOADING_SPINNER_CLASSES = "w-16 h-16 border-4 border-orange-200 border-t-primary-container rounded-full mx-auto mb-6 animate-spin";
const STATUS_ICON_CONTAINER = "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const hasCaptured = useRef(false);

  // Función para actualizar el plan del usuario localmente
  const updateLocalUserPlan = useCallback(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        userObj.plan = 'pro';
        localStorage.setItem('user', JSON.stringify(userObj));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        // Ignorar error de parse
      }
    }
  }, []);

  useEffect(() => {
    // Evitar ejecución doble en StrictMode
    if (hasCaptured.current) return;
    hasCaptured.current = true;

    // Caso: Pago con Binance
    if (searchParams.get('binance') === 'true') {
      setStatus('success');
      setMessage(t('payment.binance_success'));
      return;
    }

    // PayPal usa 'token' como identificador de la orden
    const orderId = searchParams.get('token');
    
    if (!orderId) {
      setStatus('error');
      setMessage(t('payment.order_id_not_found'));
      return;
    }

    const pendingStr = localStorage.getItem('pending_purchase');
    if (!pendingStr) {
      setStatus('error');
      setMessage('No se encontró información de la compra pendiente.');
      return;
    }

    let pending;
    try {
      pending = JSON.parse(pendingStr);
    } catch (e) {
      setStatus('error');
      setMessage('Información de compra inválida.');
      return;
    }

    const confirmPayment = async () => {
      const endpoint = pending.type === 'pack'
        ? '/pago/confirmar-pack'
        : '/pago/confirmar-suscripcion';

      const payload = { order_id: orderId };
      if (pending.type === 'pack') payload.pack_id = pending.pack_id;
      if (pending.type === 'subscription') payload.months = pending.months;

      try {
        const resp = await api.post(endpoint, payload);
        setStatus('success');
        setMessage(resp.data.message || '¡Pago confirmado!');
        toast.success('¡Pago procesado con éxito! 🎉');
        localStorage.removeItem('pending_purchase');

        if (pending.type === 'subscription') {
          updateLocalUserPlan();
        }
      } catch (err) {
        // Manejar el caso de orden ya capturada (doble petición en StrictMode)
        const errorDetail = err.response?.data?.detail;
        if (errorDetail?.includes('ORDER_ALREADY_CAPTURED')) {
          setStatus('success');
          setMessage('¡Pago confirmado!');
          toast.success('¡Pago procesado con éxito! 🎉');
          localStorage.removeItem('pending_purchase');

          if (pending.type === 'subscription') {
            updateLocalUserPlan();
          }
        } else {
          setStatus('error');
          setMessage(errorDetail || 'Error al confirmar el pago.');
          toast.error('No se pudo confirmar el pago.');
        }
      }
    };

    confirmPayment();
  }, [searchParams, t, updateLocalUserPlan]);

  // Renderizar el contenido según el estado
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <div className={LOADING_SPINNER_CLASSES} />
            <h2 className="text-2xl font-black text-on-surface mb-2">
              {t('payment.processing')}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {t('payment.wait')}
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className={`${STATUS_ICON_CONTAINER} bg-green-100 dark:bg-green-900/20 animate-scaleIn`}>
              <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-4xl">
                check_circle
              </span>
            </div>
            <h2 className="text-3xl font-black text-on-surface mb-3">
              {t('payment.success_title')}
            </h2>
            <p className="text-on-surface-variant text-sm mb-8">{message}</p>
            <Link 
              to="/editor/pro"
              className="inline-block bg-primary-container text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-orange-200 dark:shadow-orange-900/20 hover:opacity-90 transition-all no-underline active:scale-95 transform duration-150"
            >
              {t('payment.go_pro')}
            </Link>
          </>
        );

      case 'error':
        return (
          <>
            <div className={`${STATUS_ICON_CONTAINER} bg-red-100 dark:bg-red-900/20`}>
              <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
            </div>
            <h2 className="text-3xl font-black text-on-surface mb-3">
              {t('payment.error_title')}
            </h2>
            <p className="text-red-500 text-sm font-bold mb-8">{message}</p>
            <Link 
              to="/upgrade"
              className="inline-block bg-slate-100 dark:bg-surface-variant text-on-surface font-black px-8 py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-surface-container-high transition-all no-underline active:scale-95 transform duration-150"
            >
              {t('payment.back_upgrade')}
            </Link>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-background min-h-screen text-on-background">
      <Navbar />
      <main className="pt-32 pb-24 px-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white/80 dark:bg-[#1a1512]/80 backdrop-blur-xl rounded-card border border-slate-200 dark:border-outline-variant/30 p-10 shadow-2xl text-center animate-fadeIn">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}