import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storage } from '../services/storage';

const Home: React.FC = () => {
  const location = useLocation();
  const [referrerCode, setReferrerCode] = useState<string | null>(null);

  // Capture referral code from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('ref');
    if (code) {
      setReferrerCode(code);
      localStorage.setItem('dkadris_referrer', code);
    }
  }, [location.search]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6 bg-cream">
      <div className="max-w-6xl mx-auto">
        {/* Existing Home content stays exactly the same */}
        <h1 className="text-4xl font-bold text-navy mb-6">Welcome to D-Kadris Tailor Jeans Market</h1>
        <p className="text-navy/60 mb-6">Explore our curated denim collection and join our artisan community.</p>

        {/* Optional Referral Message */}
        {referrerCode && (
          <div className="bg-gold/20 border-l-4 border-gold p-4 rounded-xl mb-6">
            <p className="text-navy font-bold text-sm">
              🎉 You were referred by <span className="uppercase">{referrerCode}</span>! Your signup bonus will be applied at checkout.
            </p>
          </div>
        )}

        {/* Rest of Home page content stays exactly as before */}
      </div>
    </div>
  );
};

export default Home;
