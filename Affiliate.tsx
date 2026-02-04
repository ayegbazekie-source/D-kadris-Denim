
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Affiliate } from '../types';

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
    const orders = storage.getOrders().filter(o => o.referrerCode === user.code);
    const earnings = orders.reduce((sum, o) => sum + (o.total * 0.1), 0);

    return (
      <div className="min-h-screen pt-24 pb-20 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold text-navy font-belina">Welcome, {user.name}</h1>
              <p className="text-navy/40 font-bold uppercase tracking-widest text-xs mt-1">Affiliate Partner Dashboard</p>
            </div>
            <button onClick={logout} className="bg-white text-burntOrange border-2 border-burntOrange/10 px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-burntOrange hover:text-white transition-all">
              Logout
            </button>
          </div>

          <div className="bg-navy p-8 md:p-12 rounded-[2.5rem] shadow-2xl mb-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gold mb-2">Your Unique Referral Link</h2>
                <p className="text-white/60 text-sm mb-6">Share this link with your audience. Every purchase made through it earns you a 10% commission.</p>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Earnings', value: `₦${earnings.toLocaleString()}`, icon: '💰' },
              { label: 'Referrals', value: user.referredAffiliates.length, icon: '🤝' },
              { label: 'Orders', value: orders.length, icon: '📦' },
              { label: 'Bonus Eligible', value: user.referredAffiliates.filter(r => r.bonusEligible).length, icon: '✨' }
            ].map((metric, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] shadow-xl text-center border-b-4 border-copper flex flex-col items-center group hover:-translate-y-1 transition-transform">
                <span className="text-4xl mb-3">{metric.icon}</span>
                <p className="text-navy/60 font-bold text-[10px] uppercase mb-2 tracking-widest">{metric.label}</p>
                <span className="text-3xl font-black text-navy">{metric.value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden p-8 border border-navy/5">
              <h3 className="text-2xl font-bold text-navy mb-6 flex items-center font-belina">
                <span className="mr-3">🛒</span> Customer Orders
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-cream text-navy/40 uppercase text-[10px] font-black tracking-widest">
                      <th className="py-4 px-2">Product</th>
                      <th className="py-4 px-2">Earnings</th>
                      <th className="py-4 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={3} className="py-12 text-center text-navy/30 italic">No commissionable orders recorded.</td></tr>
                    ) : orders.map(o => (
                      <tr key={o.id} className="border-b border-cream hover:bg-cream/30 transition-colors">
                        <td className="py-4 px-2 font-bold text-navy">{o.productName}</td>
                        <td className="py-4 px-2 text-copper font-black">₦{(o.total * 0.1).toLocaleString()}</td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${o.status === 'pending' ? 'bg-gold/20 text-burntOrange' : 'bg-green-100 text-green-700'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden p-8 border border-navy/5">
              <h3 className="text-2xl font-bold text-navy mb-6 flex items-center font-belina">
                <span className="mr-3">👥</span> Sub-Affiliates
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-cream text-navy/40 uppercase text-[10px] font-black tracking-widest">
                      <th className="py-4 px-2">Partner Name</th>
                      <th className="py-4 px-2">Network Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.referredAffiliates.length === 0 ? (
                      <tr><td colSpan={2} className="py-12 text-center text-navy/30 italic">No network partners yet.</td></tr>
                    ) : user.referredAffiliates.map((r, i) => (
                      <tr key={i} className="border-b border-cream">
                        <td className="py-4 px-2 font-bold text-navy">{r.name}</td>
                        <td className="py-4 px-2">
                          {r.bonusEligible ? (
                            <span className="text-green-600 font-bold text-xs uppercase tracking-tighter">✓ Bonus Qualified</span>
                          ) : (
                            <span className="text-navy/40 text-xs">Pending Growth Milestone</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-24 pb-20 px-6 bg-cream">
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-navy/5">
        <div className="bg-navy p-10 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl"></div>
          <h1 className="text-3xl font-bold text-gold mb-2 font-belina">
            {isResetMode ? 'Partner Recovery' : (isLogin ? 'Partner Login' : 'Join Our Network')}
          </h1>
          <p className="text-white/60 text-sm">Empowering Nigerian artisans through community commerce.</p>
        </div>
        
        <form onSubmit={isResetMode ? handleResetPassword : handleAuth} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-500 font-bold">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-500 font-bold">✅</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">{success}</p>
                </div>
              </div>
            </div>
          )}

          {!isLogin && !isResetMode && (
            <div>
              <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Full Legal Name</label>
              <input 
                type="text" required
                className="w-full p-4 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none transition-all text-navy font-bold"
                value={formData.name}
                placeholder="e.g. John Doe"
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" required
              className="w-full p-4 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none transition-all text-navy font-bold"
              value={formData.email}
              placeholder="partner@example.com"
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {!isResetMode && (
            <div className="relative">
              <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Secure Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full p-4 pr-12 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none transition-all text-navy font-bold"
                  value={formData.password}
                  placeholder="••••••••"
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {isLogin && (
                <div className="mt-2 flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => { setIsResetMode(true); setError(null); setSuccess(null); }}
                    className="text-[10px] font-bold text-copper hover:underline uppercase tracking-widest"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {!isLogin && !isResetMode && (
            <>
              <div>
                <label className="block text-[10px] font-black text-navy/60 mb-2 uppercase tracking-widest">Referrer Code (Optional)</label>
                <input 
                  type="text"
                  className="w-full p-4 bg-cream/50 border-2 border-transparent focus:border-gold rounded-2xl outline-none transition-all text-navy font-bold uppercase"
                  value={formData.referrerCode}
                  placeholder="e.g. DAVID123"
                  onChange={e => setFormData({ ...formData, referrerCode: e.target.value.toUpperCase() })}
                />
                <p className="mt-2 text-[10px] text-copper font-bold italic leading-tight">
                  Note: Including a valid referral code makes you eligible for an immediate signup bonus and network growth rewards!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" required
                  className="w-5 h-5 accent-copper rounded cursor-pointer"
                  id="policy"
                  checked={formData.policyAccepted}
                  onChange={e => setFormData({ ...formData, policyAccepted: e.target.checked })}
                />
                <label htmlFor="policy" className="text-xs text-navy/80 cursor-pointer select-none">
                  I accept the <button type="button" onClick={() => setShowPolicy(true)} className="text-copper underline font-bold">Affiliate Policy</button>
                </label>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-navy text-gold py-5 rounded-2xl font-bold text-lg transition-all shadow-xl mt-4 uppercase tracking-[0.2em] flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-wait' : 'hover:bg-copper hover:text-white active:scale-95'}`}
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"></div> Validating...</>
            ) : (
              isResetMode ? 'Request Reset' : (isLogin ? 'Enter Dashboard' : 'Create Account')
            )}
          </button>

          <p className="text-center text-navy/60 text-sm">
            {isResetMode ? (
              <button 
                type="button" 
                onClick={() => { setIsResetMode(false); setError(null); setSuccess(null); }}
                className="text-copper font-bold hover:underline"
              >
                Back to Login
              </button>
            ) : (
              <>
                {isLogin ? "New to the platform?" : "Already a partner?"} 
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="ml-2 text-copper font-bold hover:underline"
                >
                  {isLogin ? 'Sign Up Now' : 'Login Here'}
                </button>
              </>
            )}
          </p>
        </form>
      </div>

      {showPolicy && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/90 backdrop-blur-sm">
          <div className="bg-white max-w-md p-10 rounded-[2.5rem] shadow-2xl border-4 border-gold/20 animate-fade-in">
            <h3 className="text-2xl font-bold text-navy mb-6 font-belina">Partnership Policy</h3>
            <ul className="space-y-4 text-navy/80 text-sm leading-relaxed">
              <li className="flex gap-3"><span className="text-gold font-bold">✦</span> 10% commission on all confirmed custom orders.</li>
              <li className="flex gap-3"><span className="text-gold font-bold">✦</span> Real-time order tracking via this secure dashboard.</li>
              <li className="flex gap-3"><span className="text-gold font-bold">✦</span> Multi-tier bonuses for referring other active partners.</li>
              <li className="flex gap-3"><span className="text-gold font-bold">✦</span> Standard 14-day payment validation window.</li>
              <li className="flex gap-3"><span className="text-gold font-bold">✦</span> Integrity Clause: Self-referrals result in permanent ban.</li>
            </ul>
            <button 
              onClick={() => setShowPolicy(false)}
              className="mt-8 w-full bg-navy text-gold py-4 rounded-xl font-bold uppercase tracking-widest text-xs"
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatePage;
