"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/context/OrderContext';
import { useWishlist } from '@/context/WishlistContext';

const Profile = () => {
  const { user, logout, loading } = useAuth();
  const { orders } = useOrder();
  const { wishlist } = useWishlist();
  const navigate = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      navigate.push('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F9F7]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c4a35a]"></div>
      </div>
    );
  }

  // Calculate dynamic stats
  const totalInvestment = orders.reduce((acc, order) => {
      const val = parseFloat(String(order.total || '0').replace(/[^0-9.]/g, '')) || 0;
      return acc + val;
  }, 0);

  const recentOrders = orders.slice(0, 3);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: 'orders', label: 'History', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )},
    { id: 'track', label: 'Tracking', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: 'settings', label: 'Settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      </svg>
    )},
  ];

  return (
    <div className="profile-page-wrapper">
      <style>{`
        .profile-page-wrapper {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #F9F9F7;
          overflow-y: auto;
          z-index: 1000;
          font-family: 'Inter', sans-serif;
          --fylex-gold: #c4a35a;
          --fylex-navy: #1C2E4A;
        }
        
        .profile-bg-blob {
          position: fixed; border-radius: 50%;
          filter: blur(100px); pointer-events: none; opacity: 0.15; z-index: -1;
        }
        .blob-1 { width: 500px; height: 500px; background: var(--fylex-gold); top: -100px; right: -100px; }
        .blob-2 { width: 400px; height: 400px; background: var(--fylex-navy); bottom: -100px; left: -100px; }

        .profile-container {
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          padding: 100px 40px 40px;
          gap: 40px;
        }

        @media (max-width: 1024px) {
          .profile-container { flex-direction: column; padding-top: 80px; }
        }

        .profile-sidebar {
          width: 320px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 30px;
          padding: 40px 0;
          height: fit-content;
          box-shadow: 0 20px 40px rgba(0,0,0,0.03);
          position: sticky;
          top: 100px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 1024px) {
          .profile-sidebar { width: 100%; position: relative; top: 0; }
        }

        .user-profile-header {
          text-align: center;
          padding-bottom: 30px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .profile-avatar-large {
          width: 100px; height: 100px;
          background: var(--fylex-navy);
          color: white;
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          box-shadow: 0 15px 30px rgba(28,46,74,0.15);
          border: 4px solid white;
        }
        .profile-name-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem; color: var(--fylex-navy);
          font-weight: 500; margin-bottom: 5px;
        }
        .profile-tag {
          font-size: 0.7rem; color: var(--fylex-gold);
          text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700;
        }

        .profile-nav-list { list-style: none; padding: 0; margin: 0; }
        .profile-nav-item {
          padding: 18px 40px;
          display: flex; align-items: center; gap: 15px;
          color: #666; font-weight: 500; font-size: 0.95rem;
          cursor: pointer; transition: all 0.3s;
          position: relative;
        }
        .profile-nav-item:hover { color: var(--fylex-gold); background: rgba(196,163,90,0.03); }
        .profile-nav-item.active {
          color: var(--fylex-gold);
          background: rgba(196,163,90,0.06);
        }
        .profile-nav-item.active::after {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
          background: var(--fylex-gold); border-radius: 0 4px 4px 0;
        }

        .back-to-home {
          margin-top: auto;
          padding: 20px 40px;
          display: flex; align-items: center; gap: 10px;
          color: #999; font-size: 0.85rem; font-weight: 600;
          text-decoration: none; border-top: 1px solid rgba(0,0,0,0.03);
        }
        .back-to-home:hover { color: var(--fylex-navy); }

        .profile-main-content {
          flex: 1;
          background: white;
          border-radius: 40px;
          padding: 60px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.03);
          min-height: 80vh;
        }
        @media (max-width: 768px) {
          .profile-main-content { padding: 40px 25px; border-radius: 30px; }
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 3rem; color: var(--fylex-navy);
          margin-bottom: 30px; line-height: 1;
        }

        .stats-cluster {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
          margin-bottom: 60px;
        }
        @media (max-width: 640px) { .stats-cluster { grid-template-columns: 1fr; } }
        .stat-box {
          padding: 30px; border-radius: 24px; background: #f8f9fb;
          border: 1px solid rgba(0,0,0,0.01);
          transition: transform 0.3s;
        }
        .stat-box:hover { transform: translateY(-5px); border-color: var(--fylex-gold); }
        .stat-val { font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--fylex-navy); display: block; }
        .stat-lbl { font-size: 0.75rem; color: #999; text-transform: uppercase; letter-spacing: 0.1em; }

        .order-card-premium {
          display: flex; align-items: center; gap: 30px;
          padding: 25px; border: 1px solid #f0f0f0; border-radius: 24px;
          margin-bottom: 20px; transition: all 0.3s;
          background: #fff;
        }
        .order-card-premium:hover { box-shadow: 0 10px 30px rgba(0,0,0,0.04); border-color: #ddd; }
        .item-thumb {
          width: 80px; height: 80px; object-fit: contain;
          background: #fdfdfd; border-radius: 15px; padding: 10px;
        }
        .item-meta { flex: 1; }
        .item-status-pill {
          padding: 6px 16px; border-radius: 50px; font-size: 0.7rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .status-delivered { background: #E6F9F0; color: #0EA271; }
        .status-processing { background: #FFF9E6; color: #D4A017; }

        .tracking-viz {
          background: var(--fylex-navy); padding: 50px; border-radius: 30px; color: white;
          position: relative; overflow: hidden;
        }
        .tracking-viz::after {
          content: 'FYLEXX'; position: absolute; bottom: -20px; right: -20px;
          font-size: 10rem; opacity: 0.03; font-weight: 900; pointer-events: none;
        }
        .track-progress-container {
          position: relative; height: 4px; background: rgba(255,255,255,0.1);
          margin: 40px 0; border-radius: 10px;
        }
        .track-bar { position: absolute; left: 0; top: 0; height: 100%; background: var(--fylex-gold); border-radius: 10px; box-shadow: 0 0 15px var(--fylex-gold); }
        .track-nodes { display: flex; justify-content: space-between; position: relative; top: -11px; }
        .node { width: 18px; height: 18px; border-radius: 50%; border: 3px solid var(--fylex-navy); background: #333; }
        .node.completed { background: var(--fylex-gold); box-shadow: 0 0 10px var(--fylex-gold); }
        .node-label { margin-top: 15px; font-size: 0.75rem; color: rgba(255,255,255,0.4); text-align: center; width: 80px; margin-left: -31px; }
        .node-label.active { color: white; font-weight: 600; }
        
        .logout-pill {
          margin-top: 20px; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          padding: 15px 40px; color: #ef4444; font-weight: 600;
          transition: background 0.3s; 
        }
        .logout-pill:hover { background: rgba(239, 68, 68, 0.05); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.6s ease forwards; }
      `}</style>

      <div className="profile-bg-blob blob-1"></div>
      <div className="profile-bg-blob blob-2"></div>

      <div className="profile-container">
        <aside className="profile-sidebar animate-fade" style={{ animationDelay: '0.1s' }}>
          <div className="user-profile-header">
            <div className="profile-avatar-large">
              {user.firstName ? user.firstName[0] : (user.email ? user.email[0] : '?')}
            </div>
            <h2 className="profile-name-title">{user.firstName || 'Member'} {user.lastName || ''}</h2>
            <span className="profile-tag">Heritage Member</span>
          </div>

          <ul className="profile-nav-list">
            {tabs.map(tab => (
              <li
                key={tab.id}
                className={`profile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </li>
            ))}
          </ul>

          <div className="logout-pill" onClick={() => { logout(); navigate.push('/'); }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </div>

          <Link href="/" className="back-to-home">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Store
          </Link>
        </aside>

        <main className="profile-main-content animate-fade" style={{ animationDelay: '0.3s' }}>
          {activeTab === 'overview' && (
            <div key="overview">
              <h1 className="section-title">The Collection Overview</h1>
              <p className="text-gray-500 mb-10 max-w-lg">Welcome back to your curated space. Here you can monitor your heritage pieces and manage your Fylexx journey.</p>
              
              <div className="stats-cluster">
                <div className="stat-box">
                  <span className="stat-lbl">Active Orders</span>
                  <span className="stat-val">{orders.length.toString().padStart(2, '0')}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-lbl">Collection Worth</span>
                  <span className="stat-val">₹{totalInvestment.toLocaleString()}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-lbl">Wishlist Items</span>
                  <span className="stat-val">{wishlist.length.toString().padStart(2, '0')}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-widest text-[#1C2E4A] mb-6">Recent Acquisitions</h3>
              <div className="space-y-4">
                {recentOrders.length > 0 ? recentOrders.map((order, i) => (
                  <div key={i} className="order-card-premium">
                    <img src={order.items?.[0]?.image || '/assets/fylex-watch-v2/premium.png'} alt={order.items?.[0]?.title} className="item-thumb" />
                    <div className="item-meta">
                      <span className="text-xs text-gray-400 font-mono">#{order.id}</span>
                      <h4 className="text-lg font-semibold text-[#1C2E4A] mt-1">{order.items?.[0]?.title || 'Bespoke Timepiece'}</h4>
                    </div>
                    <div>
                      <span className={`item-status-pill status-delivered`}>
                        Delivered
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-400 italic">No recent acquisitions found.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div key="orders">
              <h1 className="section-title">Acquisition History</h1>
              <p className="text-gray-500 mb-10">A detailed record of every timepiece and accessory added to your collection.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-widest">
                      <th className="pb-2 pl-4">Identification</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Timepiece</th>
                      <th className="pb-2">Investment</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? orders.map((order, i) => (
                      <tr key={i} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="p-5 pl-8 rounded-l-2xl font-mono text-xs">{order.id}</td>
                        <td className="p-5 text-gray-600 text-sm">{order.date}</td>
                        <td className="p-5 font-semibold text-[#1C2E4A]">{order.items?.[0]?.title || 'Watch'}</td>
                        <td className="p-5 font-bold text-[#1C2E4A]">{order.total}</td>
                        <td className="p-5 rounded-r-2xl">
                          <span className={`item-status-pill status-delivered`}>
                            Delivered
                          </span>
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="text-center py-10 text-gray-400">No history available.</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'track' && (
             <div key="track">
                <h1 className="section-title">Timeline & Tracking</h1>
                <p className="text-gray-500 mb-10">Monitor the journey of your newest addition from our atelier to your hands.</p>
                
                {orders.length > 0 ? (
                    <div className="tracking-viz">
                      <div className="flex justify-between items-end mb-4">
                         <div>
                            <span className="text-xs text-[#c4a35a] uppercase tracking-tighter">Current Journey</span>
                            <h4 className="text-xl font-serif mt-1">Order #{orders[0].id}</h4>
                         </div>
                         <span className="text-sm font-medium opacity-80">Estimated: Delivered</span>
                      </div>

                      <div className="track-progress-container">
                        <div className="track-bar" style={{ width: '100%' }}></div>
                        <div className="track-nodes">
                           <div className="node completed"><div className="node-label active">Ordered</div></div>
                           <div className="node completed"><div className="node-label active">Atelier</div></div>
                           <div className="node completed"><div className="node-label active">Transit</div></div>
                           <div className="node completed"><div className="node-label active">Home</div></div>
                        </div>
                      </div>

                      <div className="mt-12 grid grid-cols-2 gap-10">
                        <div className="p-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10">
                          <span className="text-[10px] uppercase opacity-50 tracking-widest">Last Update</span>
                          <p className="text-sm mt-1">Successfully Delivered</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white bg-opacity-5 border border-white border-opacity-10">
                          <span className="text-[10px] uppercase opacity-50 tracking-widest">Signed By</span>
                          <p className="text-sm mt-1">{user.firstName} {user.lastName}</p>
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="p-20 text-center bg-gray-50 rounded-3xl">
                        <p className="text-gray-400">No active shipments to track.</p>
                    </div>
                )}
             </div>
          )}

          {activeTab === 'settings' && (
            <div key="settings">
              <h1 className="section-title">Security & Profile</h1>
              <p className="text-gray-500 mb-10">Maintain your heritage profile and secure your digital experience with Fylexx.</p>
              
              <div className="max-w-xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-tighter text-gray-400">First Distinction</label>
                    <input type="text" defaultValue={user.firstName} className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-1 focus:ring-[#c4a35a] outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-tighter text-gray-400">Family Name</label>
                    <input type="text" defaultValue={user.lastName} className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-1 focus:ring-[#c4a35a] outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-tighter text-gray-400">Digital Address</label>
                  <input type="email" defaultValue={user.email} className="w-full bg-gray-50 p-4 rounded-xl border-none focus:ring-1 focus:ring-[#c4a35a] outline-none" />
                </div>

                <div className="pt-4">
                  <button className="bg-[#1C2E4A] text-white px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#c4a35a] transition-colors duration-500">
                    Update Registry
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
