'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI } from '../../config/contracts';
import { useWeb3 } from '../../context/Web3Context';

interface ClaimHistoryRecord {
  claimId: string;
  mainUserIdStr: string;
  wallet: string;
  totalAmount: number;
  directAmount: number;
  shareAmount: number;
  levelAmount: number;
  boardRewardAmount: number;
  timestamp: string;
  txHash?: string;
}

export default function ClaimedIncomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-bold">Loading Claimed Income History...</div>}>
      <ClaimedIncomeContent />
    </Suspense>
  );
}

function ClaimedIncomeContent() {
  const router = useRouter();
  const { account, mainUserId, isRegistered } = useWeb3();

  const [claimRecords, setClaimRecords] = useState<ClaimHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalWithdrawnSum, setTotalWithdrawnSum] = useState<number>(0);

  const formatDisplayId = (id: number) => {
    if (!id || id <= 0) return 'GR00000';
    return `GR${id.toString().padStart(6, '0')}`;
  };

  useEffect(() => {
    if (account && isRegistered && mainUserId > 0) {
      loadClaimHistory(mainUserId);
    } else {
      setIsLoading(false);
    }
  }, [account, isRegistered, mainUserId]);

  const loadClaimHistory = async (mId: number) => {
    try {
      setIsLoading(true);
      if (typeof window === 'undefined' || !(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);

      let historyList: ClaimHistoryRecord[] = [];
      let totalSum = 0;

      // 1. Try reading on-chain userClaimHistory mapping
      try {
        const rawList = await coreContract.getUserClaimHistory(mId);
        if (rawList && rawList.length > 0) {
          historyList = rawList.map((item: any, idx: number) => {
            const tot = parseFloat(ethers.formatEther(item.totalAmount || item[3] || BigInt(0)));
            const dir = parseFloat(ethers.formatEther(item.directAmount || item[4] || BigInt(0)));
            const shr = parseFloat(ethers.formatEther(item.shareAmount || item[5] || BigInt(0)));
            const lvl = parseFloat(ethers.formatEther(item.levelAmount || item[6] || BigInt(0)));
            const brd = parseFloat(ethers.formatEther(item.boardRewardAmount || item[7] || BigInt(0)));
            const ts = Number(item.timestamp || item[8] || Math.floor(Date.now() / 1000));

            totalSum += tot;

            return {
              claimId: `CLM-#${item.claimId ? item.claimId.toString() : idx + 1}`,
              mainUserIdStr: formatDisplayId(mId),
              wallet: item.wallet || account || '',
              totalAmount: tot,
              directAmount: dir,
              shareAmount: shr,
              levelAmount: lvl,
              boardRewardAmount: brd,
              timestamp: new Date(ts * 1000).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'medium',
              }),
            };
          });
        }
      } catch (err) {
        console.warn('Could not read userClaimHistory from contract directly:', err);
      }

      // 2. Fetch event logs for AllUserIncomeClaimed if direct getter returns empty or before contract deployment
      if (historyList.length === 0) {
        try {
          const filter = coreContract.filters.AllUserIncomeClaimed(mId, null);
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 50000);
          const events = await coreContract.queryFilter(filter, fromBlock, currentBlock);

          events.forEach((evt: any, idx: number) => {
            const args = evt.args;
            if (args) {
              const dir = parseFloat(ethers.formatEther(args.directAmount || 0));
              const shr = parseFloat(ethers.formatEther(args.shareAmount || 0));
              const lvl = parseFloat(ethers.formatEther(args.levelAmount || 0));
              const brd = parseFloat(ethers.formatEther(args.boardRewardAmount || 0));
              const tot = parseFloat(ethers.formatEther(args.totalClaimed || 0));
              const ts = Number(args.timestamp || Math.floor(Date.now() / 1000));

              totalSum += tot;

              historyList.push({
                claimId: `CLM-EVT-#${idx + 1}`,
                mainUserIdStr: formatDisplayId(mId),
                wallet: args.wallet || account || '',
                totalAmount: tot,
                directAmount: dir,
                shareAmount: shr,
                levelAmount: lvl,
                boardRewardAmount: brd,
                timestamp: new Date(ts * 1000).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                }),
                txHash: evt.transactionHash,
              });
            }
          });
        } catch (evtErr) {
          console.warn('Could not read event logs:', evtErr);
        }
      }

      // Reverse to show newest claim first
      historyList.reverse();
      setClaimRecords(historyList);
      setTotalWithdrawnSum(totalSum);
    } catch (e) {
      console.error('Error loading claim history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!account || !isRegistered) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Wallet Not Connected or Registered</h2>
        <p className="text-xs text-slate-500">Please connect your Web3 wallet and register your Main ID to view your claimed income history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Small Compact Top Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💳</span>
          <h1 className="text-base font-black text-white">Claimed Income</h1>
          <span className="text-xs text-slate-400 font-mono font-bold bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
            {formatDisplayId(mainUserId)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 font-semibold">Total Claimed Income:</span>
            <strong className="text-emerald-400 font-black text-sm">${totalWithdrawnSum.toFixed(2)} USDT</strong>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80">
            <span className="text-slate-400 font-semibold">Total Transactions:</span>
            <strong className="text-sky-400 font-black text-sm">{claimRecords.length}</strong>
          </div>
        </div>
      </div>

      {/* Claim Records List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <span>📜</span> Consolidated Withdrawal History
          </h3>
          <button
            onClick={() => loadClaimHistory(mainUserId)}
            className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 hover:underline"
          >
            🔄 Refresh History
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold animate-pulse">
            Loading Claimed Income Transactions from BSC Smart Contract...
          </div>
        ) : claimRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-4xl">💸</div>
            <h4 className="text-base font-bold text-slate-700">No Income Claimed Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When you click <strong className="text-emerald-600">CLAIM ALL INCOME</strong> on your Main ID Dashboard, your combined income from all your Sub-IDs will appear here in 1 clean transaction log with date and time.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1"
            >
              🚀 Go to Main Dashboard
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Claim ID / Date & Time</th>
                  <th className="px-4 py-3">Recipient Main ID</th>
                  <th className="px-4 py-3">Total Amount Claimed</th>
                  <th className="px-4 py-3">Income Streams Included</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {claimRecords.map((rec, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900">{rec.claimId}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>🗓️</span> {rec.timestamp}
                      </div>
                      {rec.txHash && (
                        <a
                          href={`https://testnet.bscscan.com/tx/${rec.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-mono text-sky-600 hover:underline block mt-0.5"
                        >
                          Tx: {rec.txHash.substring(0, 10)}...{rec.txHash.substring(rec.txHash.length - 6)}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{rec.mainUserIdStr}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {rec.wallet ? `${rec.wallet.substring(0, 6)}...${rec.wallet.substring(rec.wallet.length - 4)}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-base font-black text-emerald-600">
                        +${rec.totalAmount.toFixed(2)} USDT
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">1 Single Transaction</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {rec.directAmount > 0 && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md font-bold">
                            💰 Direct: ${rec.directAmount.toFixed(2)}
                          </span>
                        )}
                        {rec.boardRewardAmount > 0 && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-bold">
                            🏆 Board: ${rec.boardRewardAmount.toFixed(2)}
                          </span>
                        )}
                        {rec.levelAmount > 0 && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                            ⚡ Level: ${rec.levelAmount.toFixed(2)}
                          </span>
                        )}
                        {rec.shareAmount > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                            📊 Share: ${rec.shareAmount.toFixed(2)}
                          </span>
                        )}
                        {rec.directAmount === 0 && rec.boardRewardAmount === 0 && rec.levelAmount === 0 && rec.shareAmount === 0 && (
                          <span className="text-slate-400">Combined Main & Sub-IDs Claim</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                        <span>✅</span> Claimed & Deposited
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
