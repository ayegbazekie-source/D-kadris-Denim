import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { Order, Affiliate, Product } from '../types';
import Navbar from '../components/Navbar';

const Admin: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [affiliates, setAffiliates] = useState<Record<string, Affiliate>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'affiliates'>('orders');
  const [filterRef, setFilterRef] = useState<string | 'all'>('all');

  useEffect(() => {
    setOrders(storage.getOrders());
    setProducts(storage.getProducts());
    setAffiliates(storage.getAffiliates());
  }, []);

  // Referral summary: total earnings per referrer
  const referralSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    orders.forEach(order => {
      if (order.referrerCode) {
        summary[order.referrerCode] = (summary[order.referrerCode] || 0) + order.total;
      }
    });
    return summary;
  }, [orders]);

  // Orders filtered by selected referral code
  const filteredOrders = useMemo(() => {
    if (filterRef === 'all') return orders;
    return orders.filter(o => o.referrerCode === filterRef);
  }, [orders, filterRef]);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20 bg-cream">
      <Navbar />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-navy mb-8 font-belina">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['orders', 'products', 'affiliates'].map(tab => (
            <button
              key={tab}
              className={`px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-xs ${
                activeTab === tab ? 'bg-navy text-gold shadow-md' : 'bg-white text-navy/60'
              }`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="mb-4 flex items-center gap-4">
              <label className="text-navy font-bold text-xs uppercase tracking-widest">Filter by Referrer:</label>
              <select
                value={filterRef}
                onChange={e => setFilterRef(e.target.value)}
                className="border px-3 py-2 rounded-xl text-sm font-bold text-navy"
              >
                <option value="all">All</option>
                {Object.keys(referralSummary).map(code => (
                  <option key={code} value={code}>{code} (₦{referralSummary[code].toLocaleString()})</option>
                ))}
              </select>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy text-white uppercase text-xs font-bold tracking-widest">
                  <th className="py-3 px-2 border-b border-white/20">Order ID</th>
                  <th className="py-3 px-2 border-b border-white/20">Product</th>
                  <th className="py-3 px-2 border-b border-white/20">Quantity</th>
                  <th className="py-3 px-2 border-b border-white/20">Total</th>
                  <th className="py-3 px-2 border-b border-white/20">Status</th>
                  <th className="py-3 px-2 border-b border-white/20">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-navy/40 italic">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="border-b border-cream hover:bg-cream/20 transition-colors">
                      <td className="py-2 px-2 font-bold text-navy">{order.id}</td>
                      <td className="py-2 px-2 text-navy">{order.productName}</td>
                      <td className="py-2 px-2 text-navy font-bold">{order.quantity}</td>
                      <td className="py-2 px-2 text-copper font-black">₦{order.total.toLocaleString()}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'pending' ? 'bg-gold/20 text-burntOrange' : 'bg-green-100 text-green-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-navy font-bold">{order.referrerCode || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy text-white uppercase text-xs font-bold tracking-widest">
                  <th className="py-3 px-2 border-b border-white/20">Product Name</th>
                  <th className="py-3 px-2 border-b border-white/20">Type</th>
                  <th className="py-3 px-2 border-b border-white/20">Price</th>
                  <th className="py-3 px-2 border-b border-white/20">Category</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-navy/40 italic">No products found.</td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="border-b border-cream hover:bg-cream/20 transition-colors">
                      <td className="py-2 px-2 font-bold text-navy">{p.name}</td>
                      <td className="py-2 px-2 text-navy">{p.type}</td>
                      <td className="py-2 px-2 text-copper font-black">₦{p.price.toLocaleString()}</td>
                      <td className="py-2 px-2 text-navy">{p.category}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Affiliates Tab */}
        {activeTab === 'affiliates' && (
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy text-white uppercase text-xs font-bold tracking-widest">
                  <th className="py-3 px-2 border-b border-white/20">Name</th>
                  <th className="py-3 px-2 border-b border-white/20">Email</th>
                  <th className="py-3 px-2 border-b border-white/20">Code</th>
                  <th className="py-3 px-2 border-b border-white/20">Referred</th>
                  <th className="py-3 px-2 border-b border-white/20">Commission</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(affiliates).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-navy/40 italic">No affiliates yet.</td>
                  </tr>
                ) : (
                  Object.values(affiliates).map(a => (
                    <tr key={a.email} className="border-b border-cream hover:bg-cream/20 transition-colors">
                      <td className="py-2 px-2 font-bold text-navy">{a.name}</td>
                      <td className="py-2 px-2 text-navy">{a.email}</td>
                      <td className="py-2 px-2 text-gold font-black">{a.code}</td>
                      <td className="py-2 px-2 text-navy">{a.referredAffiliates.length}</td>
                      <td className="py-2 px-2 text-copper font-black">₦{a.commission.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
