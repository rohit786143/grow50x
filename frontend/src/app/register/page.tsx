'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ethers } from 'ethers';
import { useRouter, useSearchParams } from 'next/navigation';
import { CONTRACT_ADDRESSES, GROW50X_CORE_ABI, MOCK_USDT_ABI, isAdminWallet, getAdminIndex, ensureBscChain } from '../../config/contracts';
import { useWeb3 } from '../../context/Web3Context';
import { validatePlacementEligibility } from '../../utils/placementValidation';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-400">Loading Registration Form...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sponsorParam = searchParams?.get('sponsor') || searchParams?.get('ref') || searchParams?.get('sponsorId');

  const { account, mainUserId, isRegistered, usdtBalance, chainId, refreshWeb3State } = useWeb3();
  const isTestnet = chainId === 97;
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  // Form inputs
  const [sponsorInput, setSponsorInput] = useState<string>('363306');
  const [placementInput, setPlacementInput] = useState<string>('');
  const [placementStatus, setPlacementStatus] = useState<{ isChecking: boolean; isEligible: boolean; message: string }>({
    isChecking: false,
    isEligible: true,
    message: '',
  });

  // Transaction state
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClaimingFaucet, setIsClaimingFaucet] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const adminIdx = getAdminIndex(account);
  const isAdmin = adminIdx > 0;

  useEffect(() => {
    setMounted(true);
    if (sponsorParam) {
      setSponsorInput(sponsorParam.trim());
    }
  }, [sponsorParam]);

  // Real-time Placement ID Eligibility Check
  useEffect(() => {
    const clean = placementInput.replace(/^GR/i, '').trim();
    if (!clean || clean === '0') {
      setPlacementStatus({ isChecking: false, isEligible: true, message: '' });
      return;
    }

    setPlacementStatus({ isChecking: true, isEligible: false, message: 'Checking placement eligibility...' });
    const timer = setTimeout(async () => {
      const res = await validatePlacementEligibility(clean);
      setPlacementStatus({
        isChecking: false,
        isEligible: res.isEligible,
        message: res.message,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [placementInput]);

  useEffect(() => {
    fetchTotalUserCount();
    checkAllowanceOnChain();
    if (isAdmin) {
      router.push('/admin');
    } else if (isRegistered && mainUserId > 0) {
      router.push('/dashboard');
    }
  }, [account, isRegistered, mainUserId, isAdmin]);

  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 text-white rounded-3xl border border-amber-500/30 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/20 border border-amber-400/40 text-amber-400 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
          👑
        </div>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
            Admin #{adminIdx} Connected
          </span>
          <h2 className="text-2xl font-black mt-3 text-white">Official Admin Account Detected</h2>
          <p className="text-xs font-mono text-slate-400 mt-1">{account}</p>
        </div>
        <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Official Protocol Admin wallets do not register as normal users or require sponsor IDs. You are automatically assigned to your dedicated 5% fee withdrawal control panel.
        </p>
        <button
          onClick={() => router.push('/admin')}
          className="btn-primary-amber px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 mx-auto hover:scale-105 transition-all"
        >
          <span>👑</span> Open Admin 5% Revenue Control Center ➔
        </button>
      </div>
    );
  }


  const checkAllowanceOnChain = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum || !account) {
      setIsCheckingAllowance(false);
      return;
    }
    try {
      setIsCheckingAllowance(true);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, provider);
      const allowance = await usdtContract.allowance(account, CONTRACT_ADDRESSES.GROW50X_CORE);
      const approved = allowance >= ethers.parseEther('100');
      setIsApproved(approved);
    } catch (e) {
      console.error('Allowance check error:', e);
      setIsApproved(false);
    } finally {
      setIsCheckingAllowance(false);
    }
  };

  const fetchTotalUserCount = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, provider);

      const totalCountRaw = await coreContract.totalUserCount();
      const count = Number(totalCountRaw);
      setTotalUserCount(count);
    } catch (err) {
      console.error('Error fetching total user count:', err);
    }
  };

  const handleClaimFaucet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum || !account) return;
    setIsClaimingFaucet(true);
    setStatusMessage('Checking network and minting 1,000 Free Testnet USDT to your wallet...');
    try {
      await ensureBscChain();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);

      const tx = await usdtContract.faucet();
      await tx.wait(1);

      setStatusMessage('🎉 Successfully claimed 1,000 USDT! Now approve USDT in Step 1 below.');
      alert('🎉 1,000 Testnet USDT added to your wallet!');
      await refreshWeb3State();
      await checkAllowanceOnChain();
    } catch (err: any) {
      console.error('Faucet error:', err);
      const msg = err.reason || err.message || 'Faucet claim failed';
      setStatusMessage(`❌ Faucet Error: ${msg}`);
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  const handleApprove = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    setIsSubmitting(true);
    setStatusMessage('🔑 Step 1/2: Please click CONFIRM in your MetaMask popup to approve USDT...');
    try {
      await ensureBscChain();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);

      const approveTx = await usdtContract.approve(CONTRACT_ADDRESSES.GROW50X_CORE, ethers.MaxUint256);
      setStatusMessage('⏳ Confirming USDT Approval on BNB Smart Chain blockchain...');
      await approveTx.wait(1);
      
      await checkAllowanceOnChain();
      setStatusMessage('✓ USDT Approved successfully! Now click "Step 2/2: Register Main ID" below.');
      alert('✓ USDT Approval Confirmed! Now click "Step 2/2: Register Main ID".');
    } catch (err: any) {
      console.error('Approval error:', err);
      const msg = err.reason || err.message || 'Approval failed';
      setStatusMessage(`❌ Approval Error: ${msg}`);
      alert(`Approval Failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingId = isRegistered && mainUserId > 0 ? `GR${mainUserId}` : '';
  const isFirstUser = totalUserCount === 0;
  const hasInsufficientUsdt = parseFloat(usdtBalance || '0') < 100;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('MetaMask or Web3 Wallet required');
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatusMessage('Verifying USDT allowance on BNB Smart Chain...');

    try {
      await ensureBscChain();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT, MOCK_USDT_ABI, signer);
      const coreContract = new ethers.Contract(CONTRACT_ADDRESSES.GROW50X_CORE, GROW50X_CORE_ABI, signer);

      const userAddr = await signer.getAddress();
      const entryFeeWei = ethers.parseEther('100');

      // 1. Strict On-Chain Allowance Verification
      const currentAllowance = await usdtContract.allowance(userAddr, CONTRACT_ADDRESSES.GROW50X_CORE);
      if (currentAllowance < entryFeeWei) {
        setIsApproved(false);
        setIsSubmitting(false);
        setStatusMessage('⚠️ USDT Approval not found on-chain. Please click "Step 1/2: Approve 100 USDT in MetaMask" first!');
        alert('⚠️ USDT Approval is required first! Please click the green "Step 1/2: Approve 100 USDT in MetaMask" button and confirm in MetaMask.');
        return;
      }

      // 2. Check USDT Balance
      const usdtRaw = await usdtContract.balanceOf(userAddr);
      if (usdtRaw < entryFeeWei) {
        alert('Insufficient USDT balance! Click "🎁 Claim 1,000 USDT" to get free test USDT.');
        setIsSubmitting(false);
        setStatusMessage('❌ Insufficient USDT balance. Click Claim 1,000 USDT below.');
        return;
      }

      // 3. Validate Sponsor ID before calling contract
      const totalCountRaw = await coreContract.totalUserCount();
      const count = Number(totalCountRaw);

      const cleanSponsor = sponsorInput.replace(/^GR/i, '').trim();
      const cleanPlacement = placementInput.replace(/^GR/i, '').trim();

      const sponsorIdNum = count === 0 ? 0 : (parseInt(cleanSponsor) || 0);
      const placementIdNum = parseInt(cleanPlacement) || 0;

      if (count > 0) {
        if (sponsorIdNum <= 0) {
          alert('Please enter a valid 6-digit numeric Sponsor ID (e.g. GR363306 or 363306).');
          setIsSubmitting(false);
          setStatusMessage('❌ Invalid Sponsor ID.');
          return;
        }

        try {
          const sponsorUser = await coreContract.users(sponsorIdNum);
          if (!sponsorUser.active) {
            alert(`❌ Sponsor ID GR${sponsorIdNum} does not exist or is inactive on this smart contract! Please check and enter the correct active Sponsor ID.`);
            setIsSubmitting(false);
            setStatusMessage(`❌ Sponsor ID GR${sponsorIdNum} is invalid or inactive on this contract.`);
            return;
          }
        } catch (e) {
          alert(`❌ Sponsor ID GR${sponsorIdNum} not found on the smart contract.`);
          setIsSubmitting(false);
          setStatusMessage(`❌ Sponsor ID GR${sponsorIdNum} not found.`);
          return;
        }

        // Validate Placement ID eligibility if specified
        if (placementIdNum > 0) {
          const valRes = await validatePlacementEligibility(placementIdNum);
          if (!valRes.isEligible) {
            alert(`❌ Not Eligible for placement Id! ${valRes.message}`);
            setIsSubmitting(false);
            setStatusMessage(`❌ Not Eligible for placement Id.`);
            return;
          }
        }
      }

      // 4. Estimate gas & Execute Registration cleanly
      setStatusMessage('🚀 Step 2/2: Please click CONFIRM in your MetaMask popup window to complete Registration...');
      
      let gasLimit: bigint;
      try {
        const estGas = await coreContract.registerMainUser.estimateGas(sponsorIdNum, placementIdNum);
        gasLimit = (estGas * BigInt(115)) / BigInt(100);
        if (gasLimit < BigInt(320000)) {
          gasLimit = BigInt(320000);
        }
      } catch (gasErr) {
        console.warn('Gas estimation fallback:', gasErr);
        gasLimit = BigInt(450000);
      }

      const regTx = await coreContract.registerMainUser(sponsorIdNum, placementIdNum, { gasLimit });

      setStatusMessage('⏳ Finalizing Registration on BNB Smart Chain blockchain...');
      console.log('Register TX:', regTx.hash);
      await regTx.wait(1);

      setStatusMessage('🎉 Registration Successful! Redirecting to Dashboard...');
      alert(count === 0 ? '🎉 Congratulations! Registered as 1st Root User!' : '🎉 Registration Successful on BNB Smart Chain!');

      await refreshWeb3State();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.reason || err.message || 'Transaction failed';
      setStatusMessage(`❌ Registration Error: ${msg}`);
      alert(`Registration Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider border border-sky-300">
          {isFirstUser ? '👑 Protocol Root Registration' : '🚀 Web3 User Registration'}
        </span>
        <h1 className="text-3xl font-black text-slate-900">
          {isFirstUser ? 'Register 1st Root User' : 'Register New Main User'}
        </h1>
        <p className="text-xs text-slate-500">
          Entry Fee: <strong className="text-emerald-600 font-bold">$100 USDT</strong>. Executes directly against smart contract.
        </p>
      </div>

      {/* Already Registered Card */}
      {isRegistered && (
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-center space-y-3">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">✓ Account Already Active</span>
          <p className="text-xl font-black text-slate-900">Your Main ID: <span className="gradient-text-blue">{existingId}</span></p>
          <p className="text-xs font-mono text-slate-500">{account}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary-blue px-6 py-2.5 rounded-xl font-bold text-xs shadow-md mt-2"
          >
            Go to My Dashboard →
          </button>
        </div>
      )}

      {/* Registration Form Card */}
      {!isRegistered && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* 2-Step Registration Stepper Component */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registration Progress</span>
              <span className="text-[11px] font-semibold text-slate-500">
                {isApproved ? 'Step 2 of 2 (Ready)' : 'Step 1 of 2 (Action Required)'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Step 1 Box */}
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isApproved 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                  : 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>1</span>
                  <span className="font-bold">Approve 100 USDT</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-xs">
                  {isApproved ? '✓ Completed' : 'Pending'}
                </span>
              </div>

              {/* Step 2 Box */}
              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isApproved 
                  ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isApproved ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>2</span>
                  <span>Register Main ID</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-xs">
                  {isApproved ? 'Ready' : '🔒 Locked'}
                </span>
              </div>
            </div>
          </div>

          {/* Insufficient USDT Alert Banner */}
          {hasInsufficientUsdt && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <span>⚠️ Insufficient USDT Balance</span>
              </div>
              <p className="text-amber-800">
                Your wallet currently has <strong>{usdtBalance} USDT</strong>. Registration requires <strong>100 USDT</strong>.
              </p>
              {isTestnet ? (
                <button
                  type="button"
                  onClick={handleClaimFaucet}
                  disabled={isClaimingFaucet}
                  className="w-full btn-primary-emerald py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <span>🎁</span>
                  {isClaimingFaucet ? 'Minting 1,000 USDT...' : 'Claim 1,000 Free Testnet USDT Now'}
                </button>
              ) : (
                <p className="text-[11px] font-semibold text-slate-600">
                  Please acquire BEP-20 USDT into your connected BNB Smart Chain wallet address to proceed with 100 USDT registration.
                </p>
              )}
            </div>
          )}

          {statusMessage && (
            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-xs font-bold text-sky-900 leading-relaxed shadow-sm">
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {!isFirstUser && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Sponsor ID <span className="text-sky-600">*</span>
                </label>
                <input
                  type="text"
                  value={sponsorInput}
                  onChange={(e) => setSponsorInput(e.target.value.toUpperCase())}
                  placeholder="e.g. GR363306 or 363306"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Type Sponsor ID with or without GR prefix (e.g. GR363306 or 363306).</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Placement ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {placementStatus.isChecking ? (
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full animate-pulse border border-sky-200">
                    ⏳ Checking Eligibility...
                  </span>
                ) : placementInput.trim() && placementInput.trim() !== '0' ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    placementStatus.isEligible 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-300' 
                      : 'text-rose-700 bg-rose-50 border-rose-300'
                  }`}>
                    {placementStatus.isEligible ? '✓ Eligible' : '❌ Not Eligible for placement Id'}
                  </span>
                ) : null}
              </div>
              <input
                type="text"
                value={placementInput}
                onChange={(e) => setPlacementInput(e.target.value.toUpperCase())}
                placeholder="0 (Auto Placement)"
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-900 font-mono focus:outline-none transition-all ${
                  placementInput.trim() && placementInput.trim() !== '0'
                    ? placementStatus.isEligible
                      ? 'border-emerald-400 focus:border-emerald-500 bg-emerald-50/20'
                      : 'border-rose-400 focus:border-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:border-sky-500'
                }`}
              />
              {placementStatus.message ? (
                <div className={`mt-2 p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  placementStatus.isEligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800 animate-shake'
                }`}>
                  <span>{placementStatus.isEligible ? '✅' : '🚨'}</span>
                  <span>{placementStatus.message}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">Leave blank or 0 for protocol automatic TOP → BOTTOM, LEFT → RIGHT placement.</p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Entry Fee Required</span>
                <span className="font-bold text-slate-900">100 USDT</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Your Current USDT Balance</span>
                <span className={`font-bold ${hasInsufficientUsdt ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {usdtBalance} USDT
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>USDT Approval Status</span>
                <span className={`font-bold ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isCheckingAllowance ? 'Checking...' : isApproved ? '✓ 100 USDT Approved' : '⚠️ Approval Required (Step 1)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Network Gas</span>
                <span className="font-bold text-slate-900">~0.0003 BNB (~$0.20)</span>
              </div>
            </div>

            {hasInsufficientUsdt ? (
              <button
                type="button"
                onClick={handleClaimFaucet}
                disabled={isClaimingFaucet}
                className="w-full btn-primary-emerald py-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>🎁</span>
                {isClaimingFaucet ? 'Minting 1,000 USDT...' : 'Claim 1,000 USDT Test Tokens First'}
              </button>
            ) : !isApproved ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isSubmitting || isCheckingAllowance}
                className="w-full btn-primary-emerald py-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>🔑</span>
                {isSubmitting ? 'Confirming USDT Approval in MetaMask...' : 'Step 1/2: Approve 100 USDT in MetaMask'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isCheckingAllowance}
                className="w-full btn-primary-blue py-4 rounded-xl font-bold text-base shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                {isSubmitting
                  ? 'Confirming Registration in MetaMask...'
                  : isFirstUser
                  ? 'Step 2/2: Register 1st Root User (100 USDT)'
                  : 'Step 2/2: Register Main ID (100 USDT)'}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
