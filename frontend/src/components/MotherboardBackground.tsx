'use client';

import React from 'react';

export default function MotherboardBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-85 select-none">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glowing Gold Gradient for Traveling Pulses */}
          <linearGradient id="goldPulseGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="goldPulseGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0" />
            <stop offset="50%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </linearGradient>

          {/* Radial Glow Filter for Node Joints */}
          <filter id="jointGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ========================================================= */}
        {/* 1. BASE STATIC MOTHERBOARD TRACE LINES (Subtle Gold Opacity) */}
        {/* ========================================================= */}
        <g fill="none" stroke="#d97706" strokeWidth="1.2" strokeOpacity="0.22" strokeLinecap="round" strokeLinejoin="round">
          {/* Top Left Quadrant Traces */}
          <path d="M 50 80 H 220 L 290 150 V 280 H 450 L 510 340" />
          <path d="M 120 20 H 310 L 380 90 H 550" />
          <path d="M 20 220 H 140 L 200 280 V 420 H 340" />

          {/* Top Right Quadrant Traces */}
          <path d="M 1390 80 H 1220 L 1150 150 V 280 H 990 L 930 340" />
          <path d="M 1320 20 H 1130 L 1060 90 H 890" />
          <path d="M 1420 220 H 1300 L 1240 280 V 420 H 1100" />

          {/* Center & Hero Area Background Traces */}
          <path d="M 350 480 H 520 L 580 540 H 860 L 920 480 H 1090" />
          <path d="M 420 200 H 600 L 660 140 H 780 L 840 200 H 1020" />
          <path d="M 180 580 H 380 L 440 640 H 1000 L 1060 580 H 1260" />

          {/* Bottom Left Quadrant Traces */}
          <path d="M 60 720 H 240 L 300 780 H 580 L 640 840 H 800" />
          <path d="M 100 850 H 350 L 410 790 H 620" />

          {/* Bottom Right Quadrant Traces */}
          <path d="M 1380 720 H 1200 L 1140 780 H 860 L 800 840" />
          <path d="M 1340 850 H 1090 L 1030 790 H 820" />
        </g>

        {/* ========================================================= */}
        {/* 2. BASE STATIC CIRCUIT JOINT DOTS */}
        {/* ========================================================= */}
        <g fill="#d97706" fillOpacity="0.35">
          <circle cx="220" cy="80" r="3.5" />
          <circle cx="290" cy="150" r="3.5" />
          <circle cx="450" cy="280" r="3.5" />
          <circle cx="310" cy="20" r="3" />
          <circle cx="380" cy="90" r="3.5" />
          <circle cx="140" cy="220" r="3.5" />
          <circle cx="200" cy="280" r="3.5" />

          <circle cx="1220" cy="80" r="3.5" />
          <circle cx="1150" cy="150" r="3.5" />
          <circle cx="990" cy="280" r="3.5" />
          <circle cx="1130" cy="20" r="3" />
          <circle cx="1060" cy="90" r="3.5" />
          <circle cx="1300" cy="220" r="3.5" />
          <circle cx="1240" cy="280" r="3.5" />

          <circle cx="520" cy="480" r="3.5" />
          <circle cx="580" cy="540" r="3.5" />
          <circle cx="860" cy="540" r="3.5" />
          <circle cx="920" cy="480" r="3.5" />

          <circle cx="600" cy="200" r="3.5" />
          <circle cx="660" cy="140" r="3.5" />
          <circle cx="780" cy="140" r="3.5" />
          <circle cx="840" cy="200" r="3.5" />

          <circle cx="240" cy="720" r="3.5" />
          <circle cx="300" cy="780" r="3.5" />
          <circle cx="580" cy="780" r="3.5" />

          <circle cx="1200" cy="720" r="3.5" />
          <circle cx="1140" cy="780" r="3.5" />
          <circle cx="860" cy="780" r="3.5" />
        </g>

        {/* ========================================================= */}
        {/* 3. ANIMATED TRAVELING GOLDEN LIGHT PULSES ALONG TRACES */}
        {/* ========================================================= */}
        <g fill="none" strokeWidth="2.5" strokeLinecap="round">
          {/* Top Left Pulse 1 */}
          <path
            d="M 50 80 H 220 L 290 150 V 280 H 450 L 510 340"
            stroke="url(#goldPulseGrad1)"
            strokeDasharray="60 380"
            className="animate-circuit-pulse-1"
          />

          {/* Top Right Pulse 2 */}
          <path
            d="M 1390 80 H 1220 L 1150 150 V 280 H 990 L 930 340"
            stroke="url(#goldPulseGrad1)"
            strokeDasharray="60 380"
            className="animate-circuit-pulse-2"
          />

          {/* Center Hero Pulse 3 */}
          <path
            d="M 420 200 H 600 L 660 140 H 780 L 840 200 H 1020"
            stroke="url(#goldPulseGrad1)"
            strokeDasharray="80 450"
            className="animate-circuit-pulse-3"
          />

          {/* Middle Lower Pulse 4 */}
          <path
            d="M 350 480 H 520 L 580 540 H 860 L 920 480 H 1090"
            stroke="url(#goldPulseGrad1)"
            strokeDasharray="70 420"
            className="animate-circuit-pulse-4"
          />

          {/* Bottom Left Pulse 5 */}
          <path
            d="M 60 720 H 240 L 300 780 H 580 L 640 840 H 800"
            stroke="url(#goldPulseGrad1)"
            strokeDasharray="60 400"
            className="animate-circuit-pulse-5"
          />

          {/* Bottom Right Pulse 6 */}
          <path
            d="M 1380 720 H 1200 L 1140 780 H 860 L 800 840"
            stroke="url(#goldPulseGrad1)"
            strokeDasharray="60 400"
            className="animate-circuit-pulse-6"
          />
        </g>

        {/* ========================================================= */}
        {/* 4. EXPANDING GOLDEN LIGHT FLARE AT CIRCUIT JOINTS (STAGGERED) */}
        {/* ========================================================= */}
        <g filter="url(#jointGlow)">
          {/* Joint (220, 80) */}
          <circle cx="220" cy="80" r="4" fill="#fbbf24" className="animate-joint-flare-1" />
          {/* Joint (290, 150) */}
          <circle cx="290" cy="150" r="4.5" fill="#f59e0b" className="animate-joint-flare-2" />
          {/* Joint (450, 280) */}
          <circle cx="450" cy="280" r="5" fill="#fbbf24" className="animate-joint-flare-3" />

          {/* Joint (1220, 80) */}
          <circle cx="1220" cy="80" r="4" fill="#fbbf24" className="animate-joint-flare-4" />
          {/* Joint (1150, 150) */}
          <circle cx="1150" cy="150" r="4.5" fill="#f59e0b" className="animate-joint-flare-5" />
          {/* Joint (990, 280) */}
          <circle cx="990" cy="280" r="5" fill="#fbbf24" className="animate-joint-flare-6" />

          {/* Joint (600, 200) */}
          <circle cx="600" cy="200" r="4.5" fill="#fef08a" className="animate-joint-flare-7" />
          {/* Joint (660, 140) */}
          <circle cx="660" cy="140" r="5" fill="#fbbf24" className="animate-joint-flare-8" />
          {/* Joint (780, 140) */}
          <circle cx="780" cy="140" r="5" fill="#fbbf24" className="animate-joint-flare-9" />
          {/* Joint (840, 200) */}
          <circle cx="840" cy="200" r="4.5" fill="#fef08a" className="animate-joint-flare-10" />

          {/* Joint (520, 480) */}
          <circle cx="520" cy="480" r="4.5" fill="#fbbf24" className="animate-joint-flare-11" />
          {/* Joint (580, 540) */}
          <circle cx="580" cy="540" r="5" fill="#f59e0b" className="animate-joint-flare-12" />
          {/* Joint (860, 540) */}
          <circle cx="860" cy="540" r="5" fill="#f59e0b" className="animate-joint-flare-13" />
          {/* Joint (920, 480) */}
          <circle cx="920" cy="480" r="4.5" fill="#fbbf24" className="animate-joint-flare-14" />

          {/* Joint (300, 780) */}
          <circle cx="300" cy="780" r="4.5" fill="#fbbf24" className="animate-joint-flare-15" />
          {/* Joint (1140, 780) */}
          <circle cx="1140" cy="780" r="4.5" fill="#fbbf24" className="animate-joint-flare-16" />
        </g>
      </svg>
    </div>
  );
}
