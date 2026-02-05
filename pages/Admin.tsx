import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Product, Order, Affiliate, SiteConfig } from '../types';

const Admin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [affiliates, setAffiliates] = useState<Record<string, Affiliate>>({});
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(storage.getSiteConfig());
  const [isMaintenance, setIsMaintenance] = useState(storage.getMaintenance());
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'affiliates' | 'cms' | 'system'>('products');

  // Modals / Editors
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const session = sessionStorage.getItem('dkadris_admin_auth') === 'true';
      setIsAuth(session);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuth) refreshData();
  }, [isAuth]);

  const refreshData = () => {
    setProducts(storage.getProducts());
    setOrders(storage.getOrders());
    setAffiliates(storage.getAffiliates());
    setSiteConfig(storage.getSiteConfig());
    setIsMaintenance(storage.getMaintenance());
  };

  /** ----------------- LOGIN ----------------- **/
  const executeLogin = async (inputPassword: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword }),
      });
      const data = await res.json();

      if (data.status === 'ok') {
        sessionStorage.setItem('dkadris_admin_auth', 'true');
        setIsAuth(true);
        window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
      } else {
        alert(data.message || 'Invalid Access Key');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed – check your connection');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(password);
  };

  const logout = () => {
    sessionStorage.removeItem('dkadris_admin_auth');
    setIsAuth(false);
    setIsSafeMode(false);
    setPassword('');
    window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
  };

  /** ----------------- IMAGE UPLOAD ----------------- **/
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        callback(base64);
      } catch (err) {
        alert("Image upload failed");
      }
    }
  };

  /** ----------------- PRODUCT CRUD ----------------- **/
  const saveProduct = (p: Product) => {
    const exists = products.find(x => x.id === p.id);
    let newProducts;
    if (exists) {
      newProducts = products.map(x => x.id === p.id ? p : x);
    } else {
      newProducts = [...products, p];
    }
    storage.setProducts(newProducts);
    setProducts(newProducts);
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const deleteProduct = (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const newProducts = products.filter(p => p.id !== id);
    storage.setProducts(newProducts);
    setProducts(newProducts);
  };

  /** ----------------- CONFIG ----------------- **/
  const saveConfig = async () => {
    storage.setSiteConfig(siteConfig);
    storage.setMaintenance(isMaintenance);

    // Send maintenance state to worker if needed
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/toggle-maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('dkadris_admin_auth_token')}`
        },
        body: JSON.stringify({ action: isMaintenance ? 'enable' : 'disable' })
      });
    } catch (err) {
      console.error('Worker sync failed:', err);
    }

    alert("System configuration published!");
    window.dispatchEvent(new CustomEvent('dkadris_storage_update'));
  };

  const moveFit = (index: number, direction: 'up' | 'down') => {
    const newFits = [...siteConfig.featuredFits];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFits.length) {
      const temp = newFits[index];
      newFits[index] = newFits[newIndex];
      newFits[newIndex] = temp;
      setSiteConfig({ ...siteConfig, featuredFits: newFits });
    }
  };

  if (isLoading) return <div className="min-h-screen bg-navy flex items-center justify-center text-gold font-bold">Initializing System...</div>;

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-4">
        <div className="w-full max-w-md bg-cream p-10 rounded-[2.5rem] shadow-2xl text-center">
          <h1 className="text-3xl font-bold mb-6 text-navy font-belina">Admin Console</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="System Access Key"
              className="w-full p-4 border-2 border-navy/10 rounded-2xl outline-none focus:border-copper transition-all text-center font-bold text-black"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="w-full bg-navy text-gold py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-copper transition-all">
              Login
            </button>
            <button type="button" onClick={() => { setIsSafeMode(true); setIsAuth(true); }} className="text-[10px] font-black text-navy/40 uppercase tracking-widest hover:text-navy">
              Bypass for Development
            </button>
          </form>
        </div>
      </div>
    );
  }

  /** ----------------- MAIN ADMIN DASHBOARD ----------------- **/
  return (
    <div className="min-h-screen bg-cream flex flex-col pt-24">
      {isSafeMode && <div className="bg-burntOrange text-white text-[10px] font-black py-2 px-6 uppercase tracking-[0.3em] text-center sticky top-0 z-[60]">Auth Disabled – Development Mode</div>}
      
      {/* NAVIGATION TABS */}
      <nav className="bg-navy text-gold p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gold/20 shadow-xl mx-4 md:mx-6 rounded-[2rem]">
        <h1 className="text-xl md:text-2xl font-bold font-belina">D-Kadris Tailor CMS</h1>
        <div className="flex flex-wrap justify-center gap-2">
          {(['products', 'orders', 'affiliates', 'cms', 'system'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-gold text-navy shadow-lg' : 'text-gold/60 hover:text-gold'}`}>
              {tab}
            </button>
          ))}
          <button onClick={logout} className="ml-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-burntOrange/20 text-burntOrange border border-burntOrange/30 hover:bg-burntOrange hover:text-white transition-all">Exit</button>
        </div>
      </nav>

      {/* Tabs content (Products, Orders, Affiliates, CMS, System) */}
      {/* … keep all the content from your original Admin.tsx … */}
      {/* just ensure image upload uses handleImageUpload and config saves call saveConfig */}
    </div>
  );
};

export default Admin;
