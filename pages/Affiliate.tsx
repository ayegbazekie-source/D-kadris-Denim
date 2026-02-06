import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Order } from '../types';

const Affiliate: React.FC = () => {
  const [affiliate, setAffiliate] = useState<{ verified: boolean; code: string | null }>({ verified: false, code: null });
  const [orders, setOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<{ initial: number; recurrent: number }>({ initial: 0, recurrent: 0 });

  useEffect(() => {
    const currentAffiliate = storage.getCurrentAffiliate();
    if (currentAffiliate) {
      setAffiliate({
        verified: currentAffiliate.verified,
        code: currentAffiliate.verified ? currentAffiliate.code : null,
      });
    }

    const allOrders = storage.getOrders();
    setOrders(allOrders);

    // Calculate earnings if verified
    if (currentAffiliate?.verified && currentAffiliate.code) {
      let initial = 0;
      let recurrent = 0;

      allOrders.forEach((order) => {
        if (order.referrerCode === currentAffiliate.code) {
          // Assume `order.isFirstPurchase` is true for first-time purchase
          if (order.isFirstPurchase) {
            initial += (order.total || 0) * 0.10; // 10%
          } else {
            recurrent += (order.total || 0) * 0.05; // 5%
          }
        }
      });

      setEarnings({ initial, recurrent });
    }
  }, []);

  return (
    <div className="min-h-screen p-6 bg-cream">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-navy font-belina">Affiliate Dashboard</h1>
        {affiliate.verified === false && affiliate.code && (
          <div className="mt-4 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm">
            Your affiliate account is not verified yet. You cannot earn referral rewards until verified.
          </div>
        )}
        {affiliate.verified && affiliate.code && (
          <div className="mt-4 bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm">
            Your referral link: <input className="ml-2 px-2 py-1 rounded text-black w-60" readOnly value={`${window.location.origin}/catalog?ref=${affiliate.code}`} />
          </div>
        )}
      </header>

      {affiliate.verified && (
        <section className="max-w-4xl mx-auto bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold text-navy mb-6">Earnings Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-navy text-gold p-6 rounded-2xl text-center">
              <h3 className="font-bold text-xl">First Purchase Earnings (10%)</h3>
              <p className="text-2xl font-black mt-2">₦{earnings.initial.toLocaleString()}</p>
            </div>
            <div className="bg-copper text-white p-6 rounded-2xl text-center">
              <h3 className="font-bold text-xl">Recurrent Purchase Earnings (5%)</h3>
              <p className="text-2xl font-black mt-2">₦{earnings.recurrent.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold text-navy mb-4">Referred Orders</h3>
            {orders.filter(o => o.referrerCode === affiliate.code).length === 0 ? (
              <p className="text-navy/60">No referred orders yet.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="border-b px-4 py-2 text-xs font-bold uppercase tracking-widest">Product</th>
                    <th className="border-b px-4 py-2 text-xs font-bold uppercase tracking-widest">Amount</th>
                    <th className="border-b px-4 py-2 text-xs font-bold uppercase tracking-widest">Type</th>
                    <th className="border-b px-4 py-2 text-xs font-bold uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter(o => o.referrerCode === affiliate.code)
                    .map(o => (
                      <tr key={o.id}>
                        <td className="border-b px-4 py-2">{o.productName}</td>
                        <td className="border-b px-4 py-2">₦{o.total?.toLocaleString()}</td>
                        <td className="border-b px-4 py-2">{o.isFirstPurchase ? 'Initial' : 'Recurrent'}</td>
                        <td className="border-b px-4 py-2">{o.status}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Affiliate;
