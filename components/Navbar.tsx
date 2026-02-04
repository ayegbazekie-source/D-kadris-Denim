
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storage } from '../services/storage';
import { SiteConfig } from '../types';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [config, setConfig] = useState<SiteConfig>(storage.getSiteConfig());
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const isAdminPage = location.pathname.startsWith('/admin');

  const isStudioPreview = () => {
    return window.location.hostname.includes('aistudio.google.com') || 
           window.location.hostname.includes('localhost');
  };

  useEffect(() => {
    const updateConfig = () => setConfig(storage.getSiteConfig());
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    
    // Only show admin link if in preview or already authed (check session)
    const authed = sessionStorage.getItem('dkadris_admin_auth') === 'true';
    setShowAdmin(isStudioPreview() || authed);

    window.addEventListener('dkadris_storage_update', updateConfig);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('dkadris_storage_update', updateConfig);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (isAdminPage) return null;

  const renderLogo = (isSmall: boolean = false) => {
    const logoClass = isSmall ? "h-6 w-auto" : "h-10 w-auto";
    if (config.logoType === 'image' && config.logoImage) {
      return <img src={config.logoImage} alt="Logo" className={logoClass} />;
    }
    return <span className={`text-gold font-bold font-belina ${isSmall ? 'text-lg' : 'text-2xl'}`}>{config.logoText}</span>;
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center transition-all duration-700 ease-in-out pointer-events-none`}>
        <Link to="/" className={`pointer-events-auto transition-all duration-700 ${isScrolled ? 'translate-y-[-100%] opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="bg-navy p-3 px-6 rounded-2xl shadow-2xl border border-gold/30">
            {renderLogo()}
          </div>
        </Link>

        <div className="flex gap-4 items-center pointer-events-auto relative">
          <div className={`flex gap-6 items-center bg-white/10 backdrop-blur-xl px-8 py-3 rounded-full border border-white/20 shadow-2xl transition-all duration-700 ease-in-out ${isScrolled ? 'opacity-0 scale-90 translate-x-12' : 'opacity-100 scale-100 translate-x-0'}`}>
            <Link to="/" className="text-white hover:text-gold font-bold transition-colors text-sm uppercase tracking-widest">Home</Link>
            <Link to="/catalog" className="text-white hover:text-gold font-bold transition-colors text-sm uppercase tracking-widest">Shop</Link>
            <Link to="/affiliate" className="text-white hover:text-gold font-bold transition-colors text-sm uppercase tracking-widest">Affiliates</Link>
          </div>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className={`absolute right-0 top-1/2 -translate-y-1/2 bg-navy text-gold p-4 rounded-full shadow-2xl border-2 border-gold/30 flex items-center justify-center transition-all duration-700 transform ${isScrolled ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90 pointer-events-none'}`}
          >
            <div className="flex flex-col gap-1.5 w-6">
              <span className="h-0.5 w-full bg-gold rounded-full"></span>
              <span className="h-0.5 w-4/5 bg-gold rounded-full"></span>
              <span className="h-0.5 w-full bg-gold rounded-full"></span>
            </div>
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 z-[100] bg-navy/98 backdrop-blur-2xl transition-all duration-700 ease-in-out ${isMenuOpen ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-full'}`}>
        <button 
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-10 right-10 text-gold p-4 hover:scale-110 transition-transform"
        >
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="min-h-screen flex flex-col items-center justify-center gap-12 text-center px-4">
          <div className="mb-8 scale-150">
             {renderLogo()}
          </div>
          <Link onClick={() => setIsMenuOpen(false)} to="/" className="text-5xl font-black text-white hover:text-gold transition-all uppercase tracking-tighter">Home</Link>
          <Link onClick={() => setIsMenuOpen(false)} to="/catalog" className="text-5xl font-black text-white hover:text-gold transition-all uppercase tracking-tighter">Shop Marketplace</Link>
          <Link onClick={() => setIsMenuOpen(false)} to="/affiliate" className="text-5xl font-black text-white hover:text-gold transition-all uppercase tracking-tighter">Affiliates</Link>
          {showAdmin && (
            <Link onClick={() => setIsMenuOpen(false)} to="/admin" className="text-xl font-bold text-gold/60 hover:text-gold transition-all uppercase tracking-widest border-t border-white/10 pt-12 mt-12">Admin Entry</Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
