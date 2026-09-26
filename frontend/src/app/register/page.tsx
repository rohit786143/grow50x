'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, MOCK_USDT_ABI } from '../../config/contracts';

export default function RegisterPage() {
  const router = useRouter();
  const [account, setAccount] = useState<string | null>(null);
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [existingId, setExistingId] = useState<string>('');

  // Form inputs
  const [sponsorInput, setSponsorInput] = useState<string>('1');
  const [placementInput, setPlacementInput] = useState<string>('');
  
  // Transaction progress state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    checkRegistrationStatus();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.on('accountsChanged', () => checkRegistrationStatus());
    }
  }, []);

  const checkRegistrationStatus = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length === 0) return;

      const userWallet = accounts[0];
      setAccount(userWallet);

      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);
      
      // Read total registered users to check if this is the 1st user
      const totalCountRaw = await coreContract.totalUserCount();
      const count = Number(totalCountRaw);
      setTotalUserCount(count);

      // Check if current connected wallet is already registered
      const mIdRaw = await coreContract.walletToMainUserId(userWallet);
      const mId = Number(mIdRaw);

      if (mId > 0) {
        setIsRegistered(true);
        setExistingId(`GR${mId.toString().padStart(5, '0')}`);
      } else {
        setIsRegistered(false);
        // Default sponsor ID for subsequent users
        if (count > 0 && sponsorInput === '0') {
          setSponsorInput('1');
        }
      }
    } catch (err) {
      console.error('Error checking registration status:', err);
    }
  };

  const isFirstUser = totalUserCount === 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or Web3 Wallet required');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Checking USDT allowance...');

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const entryFeeWei = ethers.parseEther('100');

      // 1. Check USDT Balance first
      const usdtRaw = await usdtContract.balanceOf(userAddr);
      if (usdtRaw < entryFeeWei) {
        alert('Insufficient USDT balance! Please click "🎁 Get 1,000 USDT" in the header first.');
        setIsSubmitting(false);
        setStatusMessage('❌ Insufficient USDT balance.');
        return;
      }

      // 2. Check Allowance & Approve
      const allowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (allowance < entryFeeWei) {
        setStatusMessage('Step 1/2: Approving 100 USDT transfer in MetaMask...');
        const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
        console.log('Approve TX:', approveTx.hash);
        await approveTx.wait();
        setStatusMessage('Step 1/2 Confirmed! Submitting Registration transaction...');
      }

      // 3. Execute Smart Contract Call
      const sponsorIdNum = isFirstUser ? 0 : (parseInt(sponsorInput) || 1);
      const placementIdNum = parseInt(placementInput) || 0;

      setStatusMessage('Step 2/2: Confirming Registration on BNB Smart Chain Testnet...');
      const regTx = await coreContract.registerMainUser(sponsorIdNum, placementIdNum);
      console.log('Register TX:', regTx.hash);
      await regTx.wait();

      setStatusMessage('🎉 Registration Successful! Redirecting to Dashboard...');
      alert(isFirstUser ? '🎉 Congratulations! You are registered as the 1st Root User (GR00001)!' : '🎉 Registration Successful!');

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
      setStatusMessage(`❌ Registration Failed: ${msg}`);
      alert(`Registration Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-cyan-950 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-800/50">
          {isFirstUser ? '👑 Protocol Root Registration' : '🚀 Web3 User Registration'}
        </span>
        <h1 className="text-3xl font-black text-slate-100">
          {isFirstUser ? 'Register 1st Root User' : 'Register Main User'}
        </h1>
        <p className="text-xs text-slate-400">
          Entry Fee: <strong className="text-emerald-400 font-bold">$100 USDT</strong>. Executes directly against the smart contract.
        </p>
      </div>

      {/* Already Registered Card */}
      {isRegistered && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-emerald-950/20 text-center space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">✓ Account Already Active</span>
          <p className="text-xl font-black text-slate-100">Your Main ID: <span className="gradient-text">{existingId}</span></p>
          <p className="text-xs font-mono text-slate-400">{account}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-slate-950 text-xs shadow-md mt-2"
          >
            Go to My Dashboard →
          </button>
        </div>
      )}

      {/* Registration Card */}
      {!isRegistered && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          {isFirstUser ? (
            <div className="p-4 bg-cyan-950/40 rounded-2xl border border-cyan-800/60 text-xs text-cyan-200 leading-relaxed space-y-1">
              <p className="font-bold text-sm text-cyan-300">👑 You are registering as the 1st User of GROW 50X!</p>
              <p>• Sponsor ID: <strong>None (Root Node)</strong></p>
              <p>• Placement: <strong>Top Position (Board 1)</strong></p>
              <p>• Direct income ($40) is securely retained in protocol reserves as no sponsor exists.</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-slate-200">ℹ️ Subsequent User Registration</p>
              <p>• Sponsor ID: Required (Direct sponsor in Sponsor Tree)</p>
              <p>• Placement ID: Optional (Leave blank or 0 for Auto Placement)</p>
            </div>
          )}

          {statusMessage && (
            <div className="p-3.5 bg-slate-900 rounded-xl border border-cyan-800/60 text-xs font-semibold text-cyan-300 animate-pulse">
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {!isFirstUser && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Sponsor ID <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="number"
                  value={sponsorInput}
                  onChange={(e) => setSponsorInput(e.target.value)}
                  placeholder="e.g. 1"
                  required
                  min={1}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Enter the numerical ID of your direct sponsor (e.g. 1 for GR00001).</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                Placement ID <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="number"
                value={placementInput}
                onChange={(e) => setPlacementInput(e.target.value)}
                placeholder="Leave blank for Auto Placement"
                min={0}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Leave blank or 0 for protocol automatic TOP → BOTTOM, RIGHT → LEFT placement.</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Entry Fee Required</span>
                <span className="font-bold text-slate-100">100 USDT</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network Fee (Gas)</span>
                <span className="font-bold text-slate-100">~0.001 tBNB</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-btn py-4 rounded-xl font-bold text-slate-950 text-base shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform"
            >
              {isSubmitting
                ? 'Processing Smart Contract Call...'
                : isFirstUser
                ? 'Register 1st Root User (100 USDT)'
                : 'Register Main ID (100 USDT)'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
