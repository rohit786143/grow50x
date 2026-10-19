'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../../../config/contracts';
import { useWeb3 } from '../../../context/Web3Context';
import { fetchProtocolUsers, getDownlineMembers, formatDisplayId, DownlineMemberItem } from '../../../utils/teamData';

type DownlineMember = DownlineMemberItem;

export default function MyDownlinePage() {
  const router = useRouter();
  const { account, mainUserId, selectedUserId } = useWeb3();
  const [downlineList, setDownlineList] = useState<DownlineMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'main' | 'sub'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const activeTargetId = selectedUserId > 0 ? selectedUserId : mainUserId;

  useEffect(() => {
    if (activeTargetId > 0 || account) {
      loadDownline(activeTargetId, false);
    } else {
      setLoading(false);
    }
  }, [account, mainUserId, selectedUserId, activeTargetId]);

  const loadDownline = async (targetId: number, forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://bsc-dataseed.binance.org/';
      const fastProvider = new ethers.JsonRpcProvider(rpcUrl);

      let resolvedId = targetId;
      if (resolvedId === 0 && account) {
        try {
          const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, fastProvider);
          const mIdRaw = await coreContract.walletToMainUserId(account);
          resolvedId = Number(mIdRaw);
        } catch (e) {}
      }

      if (resolvedId > 0) {
        const allUsers = await fetchProtocolUsers(fastProvider, forceRefresh);
        const downline = getDownlineMembers(resolvedId, allUsers);
        setDownlineList(downline);
      }
    } catch (err) {
      console.error('Error loading downline tree:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredDownline = downlineList.filter((item) => {
    if (filterType === 'main' && item.isSubId) return false;
    if (filterType === 'sub' && !item.isSubId) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        item.id.toLowerCase().includes(term) ||
        item.wallet.toLowerCase().includes(term) ||
        item.sponsorDisplayId.toLowerCase().includes(term) ||
        item.rawId.toString().includes(term)
      );
    }
    return true;
  });

  const mainCount = downlineList.filter((d) => !d.isSubId).length;
  const subCount = downlineList.filter((d) => d.isSubId).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Team Network</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
            My Total Downline ({formatDisplayId(activeTargetId || 1)})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            All team members across your multi-level referral network (Directs, their directs, and beyond).
          </p>
        </div>

        {/* Main ID / Sub-ID Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Downline ({downlineList.length})
          </button>
          <button
            onClick={() => setFilterType('main')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'main' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Main IDs ({mainCount})
          </button>
          <button
            onClick={() => setFilterType('sub')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'sub' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sub-IDs ({subCount})
          </button>
          <button
            onClick={() => loadDownline(activeTargetId, true)}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1 shadow-2xs"
            title="Refresh Downline Data"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Network Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Downline Team</span>
          <p className="text-2xl font-black text-sky-600 mt-1">{downlineList.length} Members</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main User IDs</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{mainCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sub-IDs</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{subCount}</p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <span className="text-slate-400 text-sm pl-2">🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search downline by User ID, Sponsor ID, or wallet address..."
          className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600 pr-2">
            ✕
          </button>
        )}
      </div>

      {/* Downline Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400">
            <span className="animate-spin inline-block text-lg mb-2">🔄</span>
            <p>Scanning Smart Contract Multi-Level Downline Tree...</p>
          </div>
        ) : filteredDownline.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 min-w-[600px]">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Sponsor ID</th>
                  <th className="p-3">Wallet Address</th>
                  <th className="p-3">Current Board</th>
                  <th className="p-3">Directs</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDownline.map((item) => (
                  <tr key={item.rawId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-black text-sky-600 text-sm">{item.id}</div>
                      <div className="mt-0.5">
                        {item.isSubId ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200 inline-block">
                            Sub-ID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-block">
                            Main User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">
                      {item.sponsorDisplayId}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {item.wallet ? `${item.wallet.substring(0, 6)}...${item.wallet.substring(item.wallet.length - 4)}` : '-'}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">Board {item.board}</td>
                    <td className="p-3 font-bold text-slate-800">{item.directs} Directs</td>
                    <td className="p-3 text-slate-400">{item.date}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => router.push(`/boards?userId=${item.rawId}`)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-sky-600 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-sm flex items-center gap-1.5 ml-auto"
                      >
                        <span>🧩</span> View Board
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <span className="text-4xl">🌿</span>
            <p className="text-base font-bold text-slate-800">No Downline Members Found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No downline members found under account {formatDisplayId(activeTargetId || 1)} for the selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
