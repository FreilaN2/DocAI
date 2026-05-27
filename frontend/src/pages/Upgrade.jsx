import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const SUBSCRIPTION_PLANS = [
  { months: 1, price: 12, label: '1 Mes', pricePerMonth: 12, saving: null },
  { months: 3, price: 33, label: '3 Meses', pricePerMonth: 11, saving: '8%' },
  { months: 6, price: 60, label: '6 Meses', pricePerMonth: 10, saving: '17%' },
  { months: 12, price: 108, label: '12 Meses', pricePerMonth: 9, saving: '25%', popular: true },
];

const TOKEN_PACKS = [
  { id: 1, name: 'Starter Pack', price: 3, tokens: 200, icon: 'token', color: 'from-slate-400 to-slate-500' },
  { id: 2, name: 'Standard Pack', price: 6, tokens: 500, icon: 'diamond', color: 'from-blue-500 to-indigo-600' },
  { id: 3, name: 'Power Pack', price: 10, tokens: 1000, icon: 'bolt', color: 'from-orange-500 to-red-600', popular: true },
];

export default function Upgrade() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [selectedTab, setSelectedTab] = useState('subscription'); // 'subscription' | 'packs'
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) navigate('/login');
    else setUserInfo(JSON.parse(stored));
  }, [navigate]);

  const getToken = () => localStorage.getItem('token');

  const handleSubscribe = async (months) => {
    if (!getToken()) { navigate('/login'); return; }
    setLoading(`sub-${months}`);
    try {
      const resp = await axios.post('http://127.0.0.1:8000/pago/suscripcion',
        { months },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      localStorage.setItem('pending_purchase', JSON.stringify({ type: 'subscription', months }));
      window.location.href = resp.data.approval_url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear el pago');
    } finally {
      setLoading(null);
    }
  };

  const handleBuyPack = async (packId) => {
    if (!getToken()) { navigate('/login'); return; }
    setLoading(`pack-${packId}`);
    try {
      const resp = await axios.post('http://127.0.0.1:8000/pago/pack-tokens',
        { pack_id: packId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      localStorage.setItem('pending_purchase', JSON.stringify({ type: 'pack', pack_id: packId }));
      window.location.href = resp.data.approval_url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear el pago');
    } finally {
      setLoading(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="bg-background min-h-screen text-on-background relative overflow-x-hidden">
      <Navbar />

      {/* Ambient blobs */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[140px] opacity-70" />
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 14, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-amber-50 rounded-full blur-[120px] opacity-80" />
      </div>

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-primary-container text-[11px] font-black uppercase tracking-widest mb-4">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            DocAI Pro
          </span>
          <h1 className="text-5xl font-black tracking-tight text-on-surface mb-4">
            Potencia tu investigación
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
            Análisis con IA avanzada. Resultados en segundos. Sin complicaciones.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mb-10">
          <div className="inline-flex bg-slate-100 dark:bg-surface-variant p-1 rounded-2xl border border-slate-200 dark:border-outline-variant/30">
            <button
              onClick={() => setSelectedTab('subscription')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedTab === 'subscription' ? 'bg-white dark:bg-surface text-on-surface shadow-sm' : 'text-slate-500 dark:text-on-surface-variant'}`}
            >
              Suscripciones
            </button>
            <button
              onClick={() => setSelectedTab('packs')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedTab === 'packs' ? 'bg-white dark:bg-surface text-on-surface shadow-sm' : 'text-slate-500 dark:text-on-surface-variant'}`}
            >
              Paquetes de Tokens
            </button>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        {selectedTab === 'subscription' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <motion.div key={plan.months} variants={itemVariants} whileHover={{ y: -6 }}
                  className={`relative bg-white dark:bg-surface rounded-card border-2 p-6 flex flex-col shadow-sm transition-all
                    ${plan.popular ? 'border-primary-container shadow-xl shadow-orange-100 dark:shadow-orange-900/20' : 'border-slate-200 dark:border-outline-variant/30'}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-container text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
                      ⚡ MEJOR VALOR
                    </div>
                  )}
                  {plan.saving && (
                    <span className="self-start mb-3 bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full">
                      -{plan.saving}
                    </span>
                  )}
                  <div className="text-sm font-bold text-slate-500 dark:text-on-surface-variant mb-1">{plan.label}</div>
                  <div className="text-4xl font-black text-on-surface mb-1">${plan.price}</div>
                  <div className="text-xs text-slate-400 dark:text-on-surface-variant/70 font-bold mb-4">${plan.pricePerMonth}/mes</div>

                  <ul className="space-y-2 mb-6 flex-grow">
                    <li className="flex items-center gap-2 text-xs text-on-surface">
                      <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span>
                      500 tokens/mes
                    </li>
                    <li className="flex items-center gap-2 text-xs text-on-surface">
                      <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span>
                      Análisis IA ilimitado
                    </li>
                    <li className="flex items-center gap-2 text-xs text-on-surface">
                      <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span>
                      Sin marca de agua
                    </li>
                  </ul>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSubscribe(plan.months)}
                    disabled={loading === `sub-${plan.months}`}
                    className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2
                      ${plan.popular
                        ? 'bg-primary-container text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/20 hover:opacity-90'
                        : 'bg-surface-variant/20 dark:bg-surface-variant text-on-surface border border-outline/10 dark:border-outline-variant/30 hover:bg-surface-variant/30 dark:hover:bg-surface-container-high'}`}
                  >
                    {loading === `sub-${plan.months}` ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <><span className="material-symbols-outlined text-sm">credit_card</span> Suscribirme</>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* PayPal badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-bold">
                <span className="material-symbols-outlined text-sm">lock</span>
                Pago seguro vía PayPal · Cancela cuando quieras
              </div>
            </div>
          </motion.div>
        )}

        {/* Token Packs */}
        {selectedTab === 'packs' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-4 mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">info</span>
              <p className="text-sm text-amber-800 dark:text-amber-500 font-medium">
                Los tokens extra <strong>no caducan</strong> y se acumulan. Úsalos cuando los necesites.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TOKEN_PACKS.map((pack) => (
                <motion.div key={pack.id} variants={itemVariants} whileHover={{ y: -6 }}
                  className={`relative bg-white dark:bg-surface rounded-card border-2 p-8 flex flex-col items-center text-center shadow-sm transition-all
                    ${pack.popular ? 'border-primary-container shadow-xl shadow-orange-100 dark:shadow-orange-900/20' : 'border-slate-200 dark:border-outline-variant/30'}`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-container text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
                      🔥 MÁS POPULAR
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pack.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-3xl">{pack.icon}</span>
                  </div>
                  <h3 className="text-xl font-black text-on-surface mb-1">{pack.name}</h3>
                  <div className="text-4xl font-black text-on-surface my-3">${pack.price}</div>
                  <div className="text-sm font-bold text-primary-container mb-6">+{pack.tokens} tokens DocAI</div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={loading === `pack-${pack.id}`}
                    className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2
                      ${pack.popular
                        ? 'bg-primary-container text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/20 hover:opacity-90'
                        : 'bg-slate-50 dark:bg-surface-variant text-on-surface border border-slate-200 dark:border-outline-variant/30 hover:bg-slate-100 dark:hover:bg-surface-container-high'}`}
                  >
                    {loading === `pack-${pack.id}` ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <><span className="material-symbols-outlined text-sm">shopping_cart</span> Comprar</>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
