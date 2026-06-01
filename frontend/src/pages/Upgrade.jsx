import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

// Constantes del módulo
const SUBSCRIPTION_PLANS = [
  { months: 1, price: 5, label: '1 Mes', pricePerMonth: '5.00', saving: null },
  { months: 3, price: 14, label: '3 Meses', pricePerMonth: '4.67', saving: '7%' },
  { months: 6, price: 25, label: '6 Meses', pricePerMonth: '4.17', saving: '17%' },
  { months: 12, price: 45, label: '12 Meses', pricePerMonth: '3.75', saving: '25%', popular: true },
];

const TOKEN_PACKS = [
  { id: 1, name: 'Starter Pack', price: 2, tokens: 100, icon: 'token', color: 'from-slate-400 to-slate-500' },
  { id: 2, name: 'Standard Pack', price: 5, tokens: 300, icon: 'diamond', color: 'from-blue-500 to-indigo-600' },
  { id: 3, name: 'Power Pack', price: 7, tokens: 500, icon: 'bolt', color: 'from-orange-500 to-red-600', popular: true },
];

// Componente memoizado para características de planes
const PlanFeatures = React.memo(({ features }) => (
  <ul className="space-y-2 mb-6 flex-grow">
    {features.map((feature, index) => (
      <li key={index} className="flex items-center gap-2 text-xs text-on-surface">
        <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span>
        {feature}
      </li>
    ))}
  </ul>
));

PlanFeatures.displayName = 'PlanFeatures';

// Componente memoizado para el spinner de carga
const LoadingSpinner = React.memo(() => (
  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Componente memoizado para tarjeta de plan
const SubscriptionCard = React.memo(({ plan, loading, onPurchase, t }) => (
  <div 
    className={`relative bg-white dark:bg-surface rounded-card border-2 p-6 flex flex-col shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg
      ${plan.popular ? 'border-primary-container shadow-xl shadow-orange-100 dark:shadow-orange-900/20' : 'border-slate-200 dark:border-outline-variant/30'}`}
  >
    {plan.popular && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-container text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
        {t('upgrade.best_value')}
      </div>
    )}
    {plan.saving && (
      <span className="self-start mb-3 bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full">
        -{plan.saving}
      </span>
    )}
    <div className="text-sm font-bold text-slate-500 dark:text-on-surface-variant mb-1">
      {plan.months} {plan.months === 1 ? t('upgrade.month') : t('upgrade.months')}
    </div>
    <div className="text-4xl font-black text-on-surface mb-1">${plan.price}</div>
    <div className="text-xs text-slate-400 dark:text-on-surface-variant/70 font-bold mb-4">
      ${plan.pricePerMonth}{t('upgrade.per_month')}
    </div>

    <PlanFeatures features={[t('upgrade.feat_tokens'), t('upgrade.feat_ai'), t('upgrade.feat_watermark')]} />

    <button
      onClick={() => onPurchase('subscription', plan)}
      disabled={loading === `sub-${plan.months}`}
      className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 transform duration-150
        ${plan.popular
          ? 'bg-primary-container text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/20 hover:opacity-90'
          : 'bg-surface-variant/20 dark:bg-surface-variant text-on-surface border border-outline/10 dark:border-outline-variant/30 hover:bg-surface-variant/30 dark:hover:bg-surface-container-high'}
        ${loading === `sub-${plan.months}` ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading === `sub-${plan.months}` ? (
        <LoadingSpinner />
      ) : (
        <><span className="material-symbols-outlined text-sm">credit_card</span> {t('upgrade.btn_subscribe')}</>
      )}
    </button>
  </div>
));

SubscriptionCard.displayName = 'SubscriptionCard';

// Componente memoizado para tarjeta de pack de tokens
const TokenPackCard = React.memo(({ pack, loading, onPurchase, t }) => (
  <div 
    className={`relative bg-white dark:bg-surface rounded-card border-2 p-8 flex flex-col items-center text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg
      ${pack.popular ? 'border-primary-container shadow-xl shadow-orange-100 dark:shadow-orange-900/20' : 'border-slate-200 dark:border-outline-variant/30'}`}
  >
    {pack.popular && (
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-container text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
        {t('upgrade.most_popular')}
      </div>
    )}
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pack.color} flex items-center justify-center mb-4 shadow-lg`}>
      <span className="material-symbols-outlined text-white text-3xl">{pack.icon}</span>
    </div>
    <h3 className="text-xl font-black text-on-surface mb-1">{pack.name}</h3>
    <div className="text-4xl font-black text-on-surface my-3">${pack.price}</div>
    <div className="text-sm font-bold text-primary-container mb-6">+{pack.tokens} tokens DocAI</div>

    <button
      onClick={() => onPurchase('pack', pack)}
      disabled={loading === `pack-${pack.id}`}
      className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 transform duration-150
        ${pack.popular
          ? 'bg-primary-container text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/20 hover:opacity-90'
          : 'bg-slate-50 dark:bg-surface-variant text-on-surface border border-slate-200 dark:border-outline-variant/30 hover:bg-slate-100 dark:hover:bg-surface-container-high'}
        ${loading === `pack-${pack.id}` ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading === `pack-${pack.id}` ? (
        <LoadingSpinner />
      ) : (
        <><span className="material-symbols-outlined text-sm">shopping_cart</span> {t('upgrade.btn_buy')}</>
      )}
    </button>
  </div>
));

TokenPackCard.displayName = 'TokenPackCard';

// Componente memoizado para el modal de pago
const PaymentModal = React.memo(({ 
  isOpen, 
  onClose, 
  paymentType, 
  item, 
  binanceFlow, 
  setBinanceFlow, 
  binanceOrderId, 
  setBinanceOrderId, 
  binanceLoading, 
  onPayPal, 
  onVerifyBinance, 
  t 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn">
        {/* Header del modal */}
        <div className="flex justify-between items-center p-5 border-b border-outline/10 dark:border-outline-variant/20">
          <h3 className="text-xl font-bold text-on-surface">
            {paymentType === 'subscription' ? t('upgrade.pay_sub') : t('upgrade.pay_pack')}
          </h3>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6">
          {binanceFlow === 'select' ? (
            <div className="space-y-4">
              <p className="text-on-surface-variant text-sm mb-4">
                {t('upgrade.select_method')} <strong>${item.price}</strong>.
              </p>
              
              {/* Botón PayPal */}
              <button 
                onClick={onPayPal} 
                className="w-full py-4 rounded-xl font-bold bg-[#003087] text-white flex items-center justify-center gap-3 hover:bg-[#002266] transition-colors active:scale-[0.98] transform duration-150"
              >
                <span className="material-symbols-outlined">payments</span>
                {t('upgrade.pay_paypal')}
              </button>
              
              {/* Separador */}
              <div className="relative py-3 flex items-center">
                <div className="flex-grow border-t border-outline/20"></div>
                <span className="flex-shrink-0 mx-4 text-on-surface-variant text-xs uppercase tracking-widest font-bold">
                  {t('upgrade.or_crypto')}
                </span>
                <div className="flex-grow border-t border-outline/20"></div>
              </div>

              {/* Botón Binance */}
              <button 
                onClick={() => setBinanceFlow('qr')} 
                className="w-full py-4 rounded-xl font-bold bg-[#FCD535] text-[#1E2329] flex items-center justify-center gap-3 hover:bg-[#F3BA2F] transition-colors active:scale-[0.98] transform duration-150"
              >
                <img src="https://cryptologos.cc/logos/bnb-bnb-logo.png" className="w-5 h-5" alt="BNB" />
                {t('upgrade.pay_binance')}
              </button>
            </div>
          ) : (
            /* Flujo Binance QR */
            <div className="flex flex-col items-center">
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-500 text-xs font-bold px-3 py-2 rounded-lg mb-4 text-center">
                {t('upgrade.binance_instr_1')} <strong>{item.price} USDT</strong>.
              </div>
              
              <img 
                src="/binance.png" 
                alt="Binance QR" 
                className="w-48 h-48 rounded-xl shadow-md border-4 border-white mb-6"
                loading="lazy"
              />
              
              <div className="w-full">
                <label className="block text-sm font-bold text-on-surface mb-2">
                  {t('upgrade.order_id_label')}
                </label>
                <input 
                  type="text" 
                  value={binanceOrderId}
                  onChange={e => setBinanceOrderId(e.target.value)}
                  placeholder="Ej. 1234567890"
                  className="w-full px-4 py-3 rounded-xl border border-outline/30 bg-surface focus:outline-none focus:ring-2 focus:ring-primary mb-4 transition-all"
                />
                
                <button 
                  onClick={onVerifyBinance}
                  disabled={binanceLoading}
                  className="w-full py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-container hover:text-on-primary-container transition-all flex justify-center items-center gap-2 active:scale-[0.98] transform duration-150 disabled:opacity-70"
                >
                  {binanceLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('upgrade.verify_payment')
                  )}
                </button>
                <button 
                  onClick={() => setBinanceFlow('select')} 
                  className="w-full py-3 mt-2 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {t('upgrade.go_back')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PaymentModal.displayName = 'PaymentModal';

export default function Upgrade() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(null);
  const [selectedTab, setSelectedTab] = useState('subscription');
  const [userInfo, setUserInfo] = useState(null);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, type: null, item: null });
  const [binanceFlow, setBinanceFlow] = useState('select');
  const [binanceOrderId, setBinanceOrderId] = useState('');
  const [binanceLoading, setBinanceLoading] = useState(false);

  // Cargar usuario
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUserInfo(JSON.parse(stored));
      } catch (e) {
        // Error al parsear
      }
    }
  }, []);

  // Helpers
  const getToken = useCallback(() => localStorage.getItem('token'), []);

  // Handlers optimizados
  const openPaymentModal = useCallback((type, item) => {
    if (!getToken()) {
      navigate('/login');
      return;
    }
    setPaymentModal({ isOpen: true, type, item });
    setBinanceFlow('select');
    setBinanceOrderId('');
  }, [getToken, navigate]);

  const closePaymentModal = useCallback(() => {
    setPaymentModal({ isOpen: false, type: null, item: null });
  }, []);

  const handleSubscribe = useCallback(async (months) => {
    if (!getToken()) {
      navigate('/login');
      return;
    }
    setLoading(`sub-${months}`);
    try {
      const resp = await api.post('/pago/suscripcion', { months });
      localStorage.setItem('pending_purchase', JSON.stringify({ type: 'subscription', months }));
      window.location.href = resp.data.approval_url;
    } catch (err) {
      console.error("Error de suscripción:", err);
      toast.error(err.response?.data?.detail || 'Error al crear el pago');
      setLoading(null);
    }
  }, [getToken, navigate]);

  const handleBuyPack = useCallback(async (packId) => {
    setLoading(`pack-${packId}`);
    try {
      const resp = await api.post('/pago/pack-tokens', { pack_id: packId });
      localStorage.setItem('pending_purchase', JSON.stringify({ type: 'pack', pack_id: packId }));
      window.location.href = resp.data.approval_url;
    } catch (err) {
      console.error("Error del pack:", err);
      toast.error(err.response?.data?.detail || 'Error al crear el pago');
      setLoading(null);
    }
  }, []);

  const handlePayPal = useCallback(() => {
    if (paymentModal.type === 'subscription') {
      handleSubscribe(paymentModal.item.months);
    } else {
      handleBuyPack(paymentModal.item.id);
    }
  }, [paymentModal, handleSubscribe, handleBuyPack]);

  const handleVerifyBinance = useCallback(async () => {
    if (!binanceOrderId.trim()) {
      toast.error('Ingresa el ID de Orden de Binance Pay');
      return;
    }
    setBinanceLoading(true);
    try {
      const itemId = paymentModal.type === 'subscription' 
        ? paymentModal.item.months 
        : paymentModal.item.id;
      
      const resp = await api.post('/pago/verify-binance', {
        order_id: binanceOrderId.trim(),
        type: paymentModal.type,
        item_id: itemId
      });

      // Actualizar plan localmente
      if (paymentModal.type === 'subscription') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            userObj.plan = 'pro';
            localStorage.setItem('user', JSON.stringify(userObj));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {
            // Error al parsear
          }
        }
      }

      toast.success(resp.data.message || 'Pago verificado exitosamente');
      closePaymentModal();
      navigate('/pago/exitoso?binance=true');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'No se pudo verificar el pago en Binance');
    } finally {
      setBinanceLoading(false);
    }
  }, [binanceOrderId, paymentModal, closePaymentModal, navigate]);

  // Valores memoizados
  const showTabSwitcher = useMemo(() => !userInfo || userInfo.plan === 'pro', [userInfo]);

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />

      {/* Fondos estáticos */}
      <div className="fixed inset-0 z-[-1] pointer-events-none hidden md:block">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-100 dark:bg-orange-900/10 rounded-full blur-[140px] opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-amber-50 dark:bg-amber-900/5 rounded-full blur-[120px] opacity-60" />
      </div>

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-primary-container text-[11px] font-black uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            DocAI Pro
          </span>
          <h1 className="text-5xl font-black tracking-tight text-on-surface mb-4">
            {t('upgrade.title')}
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
            {t('upgrade.subtitle')}
          </p>
        </div>

        {/* Tab Switcher */}
        {showTabSwitcher && (
          <div className="flex justify-center mb-10 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex bg-slate-100 dark:bg-surface-variant p-1 rounded-2xl border border-slate-200 dark:border-outline-variant/30">
              <button
                onClick={() => setSelectedTab('subscription')}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 transform duration-150 ${
                  selectedTab === 'subscription' 
                    ? 'bg-white dark:bg-surface text-on-surface shadow-sm' 
                    : 'text-slate-500 dark:text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t('upgrade.tab_subs')}
              </button>
              <button
                onClick={() => setSelectedTab('packs')}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 transform duration-150 ${
                  selectedTab === 'packs' 
                    ? 'bg-white dark:bg-surface text-on-surface shadow-sm' 
                    : 'text-slate-500 dark:text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t('upgrade.tab_packs')}
              </button>
            </div>
          </div>
        )}

        {/* Planes de Suscripción */}
        {selectedTab === 'subscription' && (
          <div className="animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <SubscriptionCard
                  key={plan.months}
                  plan={plan}
                  loading={loading}
                  onPurchase={openPaymentModal}
                  t={t}
                />
              ))}
            </div>

            {/* Badges de seguridad */}
            <div className="flex flex-col items-center mt-4 space-y-2 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-bold">
                <span className="material-symbols-outlined text-sm">lock</span>
                {t('upgrade.secure_paypal')}
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-bold">
                <img 
                  src="https://cryptologos.cc/logos/bnb-bnb-logo.png" 
                  className="w-3.5 h-3.5 grayscale opacity-70" 
                  alt="BNB" 
                />
                {t('upgrade.secure_binance')}
              </div>
            </div>
          </div>
        )}

        {/* Packs de Tokens */}
        {selectedTab === 'packs' && (
          <div className="animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">info</span>
              <p className="text-sm text-amber-800 dark:text-amber-500 font-medium">
                {t('upgrade.token_alert_1')}<strong>{t('upgrade.token_alert_strong')}</strong>{t('upgrade.token_alert_2')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TOKEN_PACKS.map((pack) => (
                <TokenPackCard
                  key={pack.id}
                  pack={pack}
                  loading={loading}
                  onPurchase={openPaymentModal}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        paymentType={paymentModal.type}
        item={paymentModal.item}
        binanceFlow={binanceFlow}
        setBinanceFlow={setBinanceFlow}
        binanceOrderId={binanceOrderId}
        setBinanceOrderId={setBinanceOrderId}
        binanceLoading={binanceLoading}
        onPayPal={handlePayPal}
        onVerifyBinance={handleVerifyBinance}
        t={t}
      />
    </div>
  );
}