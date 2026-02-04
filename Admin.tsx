import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Product, Order, Affiliate, SiteConfig, FeaturedFit, FeatureToggles } from '../types';

// Admin component for managing products, orders, affiliates and site configuration
const Admin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [affiliates, setAffiliates] = useState<Record<string, Affiliate>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(storage.getSiteConfig());
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'affiliates' | 'cms'>('products');

  useEffect(() => {
    // Check if user is already authenticated in this session
    const checkAuth = () => {
      const session = sessionStorage.getItem('dkadris_admin_auth') === 'true';
      setIsAuth(session);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Load management data only if authenticated
    if (isAuth) {
      setProducts(storage.getProducts());
      setOrders(storage.getOrders());
      setAffiliates(storage.getAffiliates());
      setSiteConfig(storage.getSiteConfig());
    }
  }, [isAuth]);

  // Handle system login with static key
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('dkadris_admin_auth', 'true');
      setIsAuth(true);
      window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
    } else {
      alert("Invalid Access Key");
    }
  };

  // Exit admin session
  const logout = () => {
    sessionStorage.removeItem('dkadris_admin_auth');
    setIsAuth(false);
    setPassword('');
    window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
  };

  // Persist site configuration changes
  const saveConfig = () => {
    storage.setSiteConfig(siteConfig);
    alert("Site configuration published!");
  };

  // Toggle boolean features in site config
  const toggleFeature = (key: keyof FeatureToggles) => {
    setSiteConfig(prev => ({
      ...prev,
      featureToggles: {
        ...prev.featureToggles,
        [key]: !prev.featureToggles[key]
      }
    }));
  };

  // Manage product visibility
  const toggleWhitelist = (id: string) => {
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, whitelisted: !p.whitelisted } : p
    );
    setProducts(updatedProducts);
    storage.setProducts(updatedProducts);
  };

  // Update featured item details
  const updateFit = (id: string, updates: Partial<FeaturedFit>) => {
    setSiteConfig(prev => ({
      ...prev,
      featuredFits: prev.featuredFits.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
  };

  // Reorder featured items
  const moveFit = (idx: number, direction: 'up' | 'down') => {
    const newList = [...siteConfig.featuredFits];
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= newList.length) return;
    [newList[idx], newList[target]] = [newList[target], newList[idx]];
    setSiteConfig(prev => ({ ...prev, featuredFits: newList }));
  };

  if (isLoading) return <div className="min-h-screen bg-navy flex items-center justify-center text-gold font-bold">Verifying System Status...</div>;

  // Render Login Form if not authenticated
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-6">
        <div className="w-full max-w-md bg-cream p-12 rounded-[2.5rem] shadow-2xl text-center border border-navy/5">
          <h1 className="text-3xl font-bold mb-2 uppercase tracking-tight font-sans text-navy">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="System Access Key"
                className="w-full p-5 pr-14 border-2 border-navy/10 rounded-2xl outline-none focus:border-copper transition-all text-center text-lg bg-white font-bold tracking-widest text-black"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors"
              >
                {showPassword ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            <button type="submit" className="w-full bg-navy text-gold py-5 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl hover:bg-copper transition-all">
              Initialize Dashboard
            </button>
            <div className="pt-4">
               <button 
                type="button"
                onClick={() => setShowRecoveryInfo(!showRecoveryInfo)}
                className="text-xs font-bold text-navy/40 hover:text-navy uppercase tracking-widest"
               >
                 Lost Access Key?
               </button>
               {showRecoveryInfo && (
                 <p className="mt-4 text-[10px] text-copper font-bold italic">
                   Contact the system architect for key rotation. Standard default key for early preview: "admin123"
                 </p>
               )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  return (
    <div className="min-h-screen bg-cream flex flex-col pt-16">
      <nav className="bg-navy text-gold p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gold/20 shadow-xl">
        <h1 className="text-2xl font-bold font-belina tracking-tight">System Command Center</h1>
        <div className="flex flex-wrap justify-center gap-2">
          {(['products', 'orders', 'affiliates', 'cms'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-gold text-navy shadow-lg' : 'text-gold/60 hover:text-gold'}`}
            >
              {tab}
            </button>
          ))}
          <button onClick={logout} className="ml-4 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-burntOrange/20 text-burntOrange border border-burntOrange/30 hover:bg-burntOrange hover:text-white transition-all">
            Exit
          </button>
        </div>
      </nav>

      <div className="flex-grow p-6">
        <div className="max-w-7xl mx-auto">
          {/* Inventory Management Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-bold text-navy font-belina">Inventory Management</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white p-6 rounded-3xl shadow-xl border border-navy/5 flex gap-4 hover:shadow-2xl transition-shadow">
                    <img src={product.image} className="w-24 h-32 object-cover rounded-xl shadow-md" alt={product.name} />
                    <div className="flex-grow">
                      <h3 className="font-bold text-navy">{product.name}</h3>
                      <p className="text-xs text-navy/40 font-black uppercase tracking-widest">{product.type}</p>
                      <p className="text-copper font-bold mt-2">₦{product.price.toLocaleString()}</p>
                      <button 
                        onClick={() => toggleWhitelist(product.id)}
                        className={`mt-4 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${product.whitelisted ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                      >
                        {product.whitelisted ? 'Public' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workshop Ledger Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden p-8 border border-navy/5">
              <h2 className="text-3xl font-bold text-navy font-belina mb-8">Workshop Ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-cream text-navy/40 uppercase text-[10px] font-black tracking-widest">
                      <th className="py-4 px-2">Order ID</th>
                      <th className="py-4 px-2">Product</th>
                      <th className="py-4 px-2">Total</th>
                      <th className="py-4 px-2">Status</th>
                      <th className="py-4 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-navy/30 italic">No workshop logs found.</td></tr>
                    ) : orders.map(order => (
                      <tr key={order.id} className="border-b border-cream hover:bg-cream/20 transition-colors">
                        <td className="py-4 px-2 font-mono text-[10px] text-navy/60">{order.id}</td>
                        <td className="py-4 px-2 font-bold text-navy">{order.productName}</td>
                        <td className="py-4 px-2 font-black text-copper">₦{order.total.toLocaleString()}</td>
                        <td className="py-4 px-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-gold/20 text-burntOrange' : 'bg-green-100 text-green-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-[10px] text-navy/40 font-bold uppercase">{new Date(order.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Partner Registry Tab */}
          {activeTab === 'affiliates' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden p-8 border border-navy/5">
              <h2 className="text-3xl font-bold text-navy font-belina mb-8">Partner Registry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fix: Added explicit Affiliate type to avoid 'unknown' type errors during mapping */}
                {Object.values(affiliates).map((affiliate: Affiliate) => (
                  <div key={affiliate.email} className="p-6 border-2 border-cream rounded-3xl hover:border-gold transition-colors bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-navy text-lg">{affiliate.name}</h3>
                        <p className="text-xs text-navy/40">{affiliate.email}</p>
                      </div>
                      <span className="bg-navy text-gold px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">{affiliate.code}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-cream/50 p-3 rounded-2xl border border-navy/5">
                        <p className="text-[10px] font-black text-navy/40 uppercase mb-1 tracking-widest">Network Size</p>
                        <span className="font-bold text-navy text-xl">{affiliate.referredAffiliates.length}</span>
                      </div>
                      <div className="bg-cream/50 p-3 rounded-2xl border border-navy/5">
                        <p className="text-[10px] font-black text-navy/40 uppercase mb-1 tracking-widest">Commission</p>
                        <span className="font-bold text-copper text-xl">10%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.values(affiliates).length === 0 && (
                   <p className="col-span-full py-20 text-center text-navy/30 italic">No partners registered in system.</p>
                )}
              </div>
            </div>
          )}

          {/* CMS Editor Tab */}
          {activeTab === 'cms' && (
             <div className="space-y-8 pb-20">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-navy/5">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-3xl font-bold text-navy font-belina">Live CMS Editor</h2>
                    <button onClick={saveConfig} className="bg-navy text-gold px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-copper transition-all active:scale-95">
                      Publish Site Changes
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-navy/40 border-b pb-2">Hero Experience</h3>
                      <div>
                        <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-widest">Main Headline</label>
                        <textarea 
                          className="w-full p-4 border-2 border-cream rounded-2xl text-sm font-medium bg-cream/20 focus:border-gold outline-none transition-colors"
                          rows={3}
                          value={siteConfig.heroTitle}
                          onChange={e => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-widest">Subheadline</label>
                        <input 
                          type="text"
                          className="w-full p-4 border-2 border-cream rounded-2xl text-sm font-medium bg-cream/20 focus:border-gold outline-none transition-colors"
                          value={siteConfig.heroSubtitle}
                          onChange={e => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-widest">Logo Display Text</label>
                        <input 
                          type="text"
                          className="w-full p-4 border-2 border-cream rounded-2xl text-sm font-medium bg-cream/20 focus:border-gold outline-none transition-colors"
                          value={siteConfig.logoText}
                          onChange={e => setSiteConfig({...siteConfig, logoText: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-navy/40 border-b pb-2">Feature Toggles</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(siteConfig.featureToggles).map(([key, value]) => (
                          <button 
                            key={key}
                            onClick={() => toggleFeature(key as keyof FeatureToggles)}
                            className={`flex justify-between items-center p-4 rounded-2xl border-2 transition-all ${value ? 'bg-gold/10 border-gold/30 text-navy' : 'bg-white border-cream text-navy/40'}`}
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${value ? 'bg-gold' : 'bg-navy/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'right-1' : 'left-1'}`}></div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-8 p-6 bg-cream/30 rounded-3xl border border-navy/5">
                        <p className="text-[10px] font-bold text-copper italic leading-relaxed">
                          Note: Toggles control the visibility of beta features like direct payments and vendor onboarding. Use with caution on production.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gallery Editor Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-navy/5">
                  <h3 className="text-2xl font-bold text-navy font-belina mb-8">Homepage Gallery Curation</h3>
                  <div className="space-y-4">
                    {siteConfig.featuredFits.map((fit, idx) => (
                      <div key={fit.id} className="flex flex-col md:flex-row gap-6 p-6 border-2 border-cream rounded-3xl bg-cream/10 hover:border-gold/30 transition-colors">
                        <div className="w-full md:w-32 aspect-square rounded-2xl overflow-hidden shadow-md border-2 border-white">
                          <img src={fit.image} className="w-full h-full object-cover" alt={fit.title} />
                        </div>
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            className="p-3 border rounded-xl text-xs font-bold bg-white focus:border-gold outline-none"
                            value={fit.title}
                            placeholder="Display Title"
                            onChange={e => updateFit(fit.id, { title: e.target.value })}
                          />
                          <select 
                            className="p-3 border rounded-xl text-xs font-bold bg-white focus:border-gold outline-none"
                            value={fit.layoutType}
                            onChange={e => updateFit(fit.id, { layoutType: e.target.value as any })}
                          >
                            <option value="standard">Standard Card</option>
                            <option value="bold">Hero Bold (Large)</option>
                            <option value="wide">Panoramic Wide</option>
                            <option value="tall">Portrait Tall</option>
                          </select>
                          <textarea 
                            className="p-3 border rounded-xl text-xs font-bold md:col-span-2 bg-white focus:border-gold outline-none"
                            rows={2}
                            value={fit.description}
                            placeholder="Hover Description"
                            onChange={e => updateFit(fit.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-row md:flex-col gap-2 justify-center items-center px-4">
                          <button onClick={() => moveFit(idx, 'up')} className="p-2 bg-white hover:bg-gold/20 rounded-lg text-navy shadow-sm border border-navy/5 transition-all">↑</button>
                          <button onClick={() => moveFit(idx, 'down')} className="p-2 bg-white hover:bg-gold/20 rounded-lg text-navy shadow-sm border border-navy/5 transition-all">↓</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;