'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../../../config/contracts';

export default function MyDirectsPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [mainUserId, setMainUserId] = useState<number>(0);
  const [directList, setDirectList] = useState<any[]>([]);

  useEffect(() => {
    loadDirects();
  }, []);

  const loadDirects = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length === 0) return;

      const userWallet = accounts[0];
      setAccount(userWallet);

      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      const mIdRaw = await coreContract.walletToMainUserId(userWallet);
      const mId = Number(mIdRaw);
      setMainUserId(mId);

      if (mId > 0) {
        const totalUsersRaw = await coreContract.totalUserCount();
        const totalCount = Number(totalUsersRaw);
        const list: any[] = [];

        for (let i = 1; i <= totalCount; i++) {
          const u = await coreContract.users(i);
          if (Number(u.sponsorId) === mId) {
            list.push({
              id: `GR${i.toString().padStart(5, '0')}`,
              wallet: u.wallet,
              board: Number(u.currentBoard),
              directs: Number(u.directCount),
              isSubId: u.isSubId,
              date: new Date(Number(u.createdAt) * 1000).toLocaleDateString(),
            });
          }
        }

        setDirectList(list);
      }
    } catch (err) {
      console.error('Error loading directs list:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">Team Network</span>
        <h1 className="text-3xl font-black text-slate-900 mt-1">My Direct Referrals</h1>
        <p className="text-sm text-slate-500 mt-1">
          Direct referrals connected to your Sponsor Tree (Main ID & Sub-IDs).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-4">Direct User ID</th>
              <th className="p-4">Wallet Address</th>
              <th className="p-4">Type</th>
              <th className="p-4">Current Board</th>
              <th className="p-4">Directs Count</th>
              <th className="p-4">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {directList.length > 0 ? (
              directList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-sky-600">{item.id}</td>
                  <td className="p-4 font-mono text-slate-700">{item.wallet}</td>
                  <td className="p-4">
                    {item.isSubId ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Sub-ID</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">Main ID</span>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-emerald-600">Board {item.board}</td>
                  <td className="p-4 font-bold text-slate-800">{item.directs} Directs</td>
                  <td className="p-4 text-xs text-slate-500">{item.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                  No direct referrals found on-chain yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
