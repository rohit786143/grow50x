'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../../../config/contracts';

interface SubIdRecord {
  rawId: number;
  id: string;
  sponsorId: number;
  placementParentId: number;
  currentBoard: number;
  directCount: number;
  active: boolean;
  createdAt: number;
  activeBoardUnitId: number;
  matrixPositionLabel: string;
}

export default function MySubIdsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<string | null>(null);
  const [mainUserId, setMainUserId] = useState<number>(0);
  const [subIdList, setSubIdList] = useState<SubIdRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadMySubIds();
  }, []);

  const formatDisplayId = (id: number) => {
    if (!id || id <= 0) return '';
    return `GR${id.toString().padStart(6, '0')}`;
  };

  const posLabels = [
    'Position 1 (TOP Root) ⭐',
    'Position 2 (Middle Left)',
    'Position 3 (Middle Right)',
    'Position 4 (Bottom Left 1)',
    'Position 5 (Bottom Left 2)',
    'Position 6 (Bottom Right 1)',
    'Position 7 (Bottom Right 2)',
  ];

  const loadMySubIds = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length === 0) {
        setLoading(false);
        return;
      }

      const userWallet = accounts[0];
      setAccount(userWallet);

      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      
      // Resolve mainUserId from wallet address
      let mId = mainUserId;
      if (mId === 0) {
        const checksumAddr = ethers.getAddress(userWallet);
        const mIdRaw = await coreContract.walletToMainUserId(checksumAddr);
        mId = Number(mIdRaw);
        setMainUserId(mId);
      }

      if (mId > 0) {
        // Query user's owned Sub-IDs using getOwnerSubIds
        const subIdsRaw = await coreContract.getOwnerSubIds(mId);
        const fetchedList: SubIdRecord[] = [];

        for (let i = 0; i < subIdsRaw.length; i++) {
          const sId = Number(subIdsRaw[i]);
          try {
            const uData = await coreContract.users(sId);
            let activeBId = 0;
            let matrixPosLabel = 'Queued / Inactive';

            try {
              const userLvl = Number(uData.currentBoard) || 1;
              const base = userLvl * 1000 + 1;
              const totalBoardsCountRaw = await coreContract.boardIdCounter();
              const totalBoards = Number(totalBoardsCountRaw);

              let foundActive = false;
              // Scan uncompleted active board units backwards (newest active first)
              for (let checkId = base + totalBoards + 5; checkId >= base; checkId--) {
                try {
                  const positions = await coreContract.getBoardUnitPositions(checkId);
                  let filled = 0;
                  let sIdx = -1;
                  for (let pIdx = 0; pIdx < positions.length; pIdx++) {
                    const pId = Number(positions[pIdx]);
                    if (pId > 0) filled++;
                    if (pId === sId) sIdx = pIdx;
                  }
                  if (sIdx !== -1 && filled < 7) {
                    activeBId = checkId;
                    matrixPosLabel = posLabels[sIdx] || `Position ${sIdx + 1}`;
                    foundActive = true;
                    break;
                  }
                } catch (e) {}
              }

              // Fallback to latest mapped board unit if not in active uncompleted board
              if (!foundActive) {
                const bIdRaw = await coreContract.userActiveBoardUnit(sId);
                activeBId = Number(bIdRaw);
                if (activeBId > 0) {
                  const positions = await coreContract.getBoardUnitPositions(activeBId);
                  for (let pIdx = 0; pIdx < positions.length; pIdx++) {
                    if (Number(positions[pIdx]) === sId) {
                      matrixPosLabel = posLabels[pIdx] || `Position ${pIdx + 1}`;
                      break;
                    }
                  }
                }
              }
            } catch (e) {
              console.warn(`Error resolving active unit/position for sub-id ${sId}:`, e);
            }

            fetchedList.push({
              rawId: sId,
              id: formatDisplayId(sId),
              sponsorId: Number(uData.sponsorId),
              placementParentId: Number(uData.placementParentId),
              currentBoard: Number(uData.currentBoard) || 1,
              directCount: Number(uData.directCount || 0),
              active: uData.active,
              createdAt: Number(uData.createdAt),
              activeBoardUnitId: activeBId,
              matrixPositionLabel: matrixPosLabel,
            });
          } catch (e) {
            console.error(`Error fetching data for sub-id ${sId}:`, e);
          }
        }

        setSubIdList(fetchedList);
      }
    } catch (err) {
      console.error('Error loading my sub-ids:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Sub-ID Management</span>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-purple-100 text-purple-700 rounded-full border border-purple-200">
              Owned Sub-IDs
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-1">My Sub-IDs Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            All system Sub-IDs generated under your Main ID account ({mainUserId > 0 ? formatDisplayId(mainUserId) : 'Main ID'}). Level income credits directly to your beneficiary wallet.
          </p>
        </div>

        <Link
          href="/sub-ids"
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
        >
          <span>✨</span> Create New Sub-IDs
        </Link>
      </div>

      {/* Main Sub-IDs Data Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">Total Owned Sub-IDs</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-purple-100 text-purple-700 rounded-full border border-purple-200">
              {subIdList.length} Accounts
            </span>
          </div>

          <button
            onClick={loadMySubIds}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400">
            <span>🔄</span> Reading Sub-IDs & Board Positions from BNB Smart Chain...
          </div>
        ) : subIdList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Sub-ID</th>
                  <th className="p-3">Sponsor ID</th>
                  <th className="p-3">Placement Parent</th>
                  <th className="p-3">Directs</th>
                  <th className="p-3">Current Board</th>
                  <th className="p-3">Active Unit</th>
                  <th className="p-3">Current Matrix Position</th>
                  <th className="p-3 text-right">View Board Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {subIdList.map((item, idx) => (
                  <tr key={item.rawId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-black text-purple-700 text-sm">
                      {item.id} <span className="text-[10px] font-normal text-slate-400">(#{idx + 1})</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {item.sponsorId > 0 ? formatDisplayId(item.sponsorId) : 'Root'}
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {item.placementParentId > 0 ? formatDisplayId(item.placementParentId) : 'Root'}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{item.directCount} Directs</td>
                    <td className="p-3 font-bold text-emerald-600">Board {item.currentBoard}</td>
                    <td className="p-3 font-mono text-slate-600">
                      {item.activeBoardUnitId > 0 ? `Unit #${item.activeBoardUnitId}` : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        item.matrixPositionLabel.includes('TOP')
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 font-black'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.matrixPositionLabel}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => router.push(`/boards?userId=${item.rawId}`)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-purple-600 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-sm flex items-center gap-1.5 ml-auto"
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
          <div className="py-16 text-center space-y-4">
            <span className="text-4xl">🚀</span>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Sub-IDs Created Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                You haven't generated any Sub-IDs under your Main ID. Create single or 5-batch Sub-IDs to maximize your board matrix earnings.
              </p>
            </div>
            <Link
              href="/sub-ids"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <span>✨</span> Go to Sub-IDs Creation Hub
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
