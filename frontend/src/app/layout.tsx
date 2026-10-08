import './globals.css';
import React from 'react';
import { Metadata } from 'next';
import AppLayoutClient from '../components/AppLayoutClient';

export const metadata: Metadata = {
  title: 'GROW 50X PROTOCOL - Decentralized Web3 DApp',
  description: 'GROW 50X Web3 Protocol on BNB Smart Chain. Smart Contracts, Matrix Boards, 10-Day Share Pool, and Sub-IDs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
