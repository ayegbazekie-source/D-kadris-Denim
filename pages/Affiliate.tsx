import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Affiliate, Order } from '../types';

const AffiliatePage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState<Affiliate | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    referrerCode: '',
    policyAccepted: false
  });
  const [showPolicy, setShowPolicy] = useState(false);

  // Load current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('dkadris_current_affiliate');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const affiliates = storage.getAffiliates();
      if (affiliates[parsed.email]) setUser(affiliates[parsed.email]);
    }
  }, []);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const affiliates = storage.getAffiliates();
    if (!affiliates[formData.email]) {
      setError("No partner account found with this email address.");
    } else {
      setSuccess("Reset instructions have been sent to your registered email address. Please check your inbox (and spam) to proceed.");
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const affiliates = storage.getAffiliates();

    if (isLogin) {
      if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }

      const existing = affiliates[formData.email];
      if (existing && existing.password === formData.password) {
        setUser(existing);
        localStorage.setItem('dkadris_current_affiliate', JSON.stringify({ email: existing.email }));
      } else {
        setError("Authentication failed: Unrecognized email or incorrect password. Please check your credentials and try again.");
      }
    } else {
      // Signup validation
      if (formData.name.trim().length < 3) {
        setError("Please enter your full legal name (minimum 3 characters).");
        setLoading(false);
        return;
      }
      if (!validateEmail(formData.email)) {
        setError("A valid email address is required for partner notifications.");
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError("Security Requirement: Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }
      if (!formData.policyAccepted) {
        setError("Mandatory Step: You must review and accept the Affiliate Partnership Policy to continue.");
        setLoading(false);
        return;
      }
      if (affiliates[formData.email]) {
        setError("Account Conflict: An affiliate account with this email already exists. Try logging in instead.");
        setLoading(false);
        return;
      }

      const newCode = formData.name.toLowerCase().split(' ')[0] + Math.floor(Math.random() * 1000);
      const newAffiliate: Affiliate = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        code: newCode,
        referrerCode: formData.referrerCode,
        referredAffiliates: [],
        orders: [],
        commission: 0
      };

      if (formData.referrerCode) {
        const foundReferrer = Object.values(affiliates).find(a => a.code === formData.referrerCode);
        if (foundReferrer) {
          foundReferrer.referredAffiliates.push({ 
            name: formData.name, 
            email: formData.email, 
            bonusEligible: true 
          });
          affiliates[foundReferrer.email] = foundReferrer;
        }
      }

      affiliates[formData.email] = newAffiliate;
      storage.setAffiliates(affiliates);
      setUser(newAffiliate);
      localStorage.setItem('dkadris_current_affiliate', JSON.stringify({ email: newAffiliate.email }));
    }

    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dkadris_current_affiliate');
    setError(null);
    setSuccess(null);
  };

  const getReferralLink = () => {
    if (!user) return '';
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/catalog?ref=${user.code}`;
  };

  const copyToClipboard = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (user) {
    const orders: Order[] = storage.getOrders().filter(o => o.referrerCode === user.code);

    // --- NEW REFERRAL EARNINGS LOGIC ---
    let firstTimeOrders: Record<string, Order> = {};
    let totalEarnings = 0;
    let totalRecurrentEarnings = 0;

    orders.forEach(order => {
      if (!firstTimeOrders[order.customerEmail]) {
        totalEarnings += order.total * 0.10; // 10% for first purchase
        firstTimeOrders[order.customerEmail] = order;
      } else {
        totalRecurrentEarnings += order.total * 0.05; // 5% for repeat purchase
      }
    });
    // --- END NEW LOGIC ---

    return (
      <div className="min-h-screen pt-24 pb-20 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          {/* Header & Logout */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-navy font-belina">Welcome, {user.name}</h1>
              <p className="text-navy/40 font-bold uppercase tracking-widest text-xs mt-1">Affiliate Partner Dashboard</p>
            </div>
            <button onClick={logout} className="bg-white text-burntOrange border-2 border-burntOrange/10 px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-burntOrange hover:text-white transition-all">
              Logout
            </button>
          </div>

          {/* Referral link */}
          <div className="bg-navy p-8 md:p-12 rounded-[2.5rem] shadow-2xl mb-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gold mb-2">Your Unique Referral Link</h2>
                <p className="text-white/60 text-sm mb-6">Share this link with your audience. First-time purchases earn 10%, repeated purchases earn 5%.</p>
                <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-white/10 p-2 rounded-2xl border border-white/20">
                  <input 
                    readOnly
                    value={getReferralLink()}
                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 font-mono text-sm text-gold select-all"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${copied ? 'bg-green-500 text-white' : 'bg-gold text-navy hover:bg-white'}`}
                  >
                    {copied ? (
                      <><span>✓</span> Copied</>
                    ) : (
                      <><span>📋</span> Copy Link</>
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-gold text-navy p-8 rounded-3xl text-center min-w-[200px] shadow-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Your Code</p>
                 <span className="text-4xl font-black block tracking-tighter">{user.code}</span>
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'First-Time Earnings', value: `₦${totalEarnings.toLocaleString()}`, icon: '💰' },
              { label: 'Recurrent Earnings', value: `₦${totalRecurrentEarnings.toLocaleString()}`, icon: '🔄' },
              { label: 'Total Referrals', value: user.referredAffiliates.length, icon: '🤝' },
              { label: 'Bonus Eligible', value: user.referredAffiliates.filter(r => r.bonusEligible).length, icon: '✨' }
            ].map((metric, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] shadow-xl text-center border-b-4 border-copper flex flex-col items-center group hover:-translate-y-1 transition-transform">
                <span className="text-4xl mb-3">{metric.icon}</span>
                <p className="text-navy/60 font-bold text-[10px] uppercase mb-2 tracking-widest">{metric.label}</p>
                <span className="text-3xl font-black text-navy">{metric.value}</span>
              </div>
            ))}
          </div>

          {/* Orders Table & Sub-Affiliates Table remain unchanged */}
          {/* ...existing orders and sub-affiliates table code... */}

        </div>
      </div>
    );
  }

  // --- Login / Signup / Reset Form remains unchanged ---
  return (
    // ...existing form JSX...
  );
};

export default AffiliatePage;
