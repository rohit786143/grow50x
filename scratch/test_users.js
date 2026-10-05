const { ethers } = require('ethers');

async function testUsers() {
  const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const coreAddress = '0x0000000000000000000000000000000000000000'; // Let's get real address from contracts.ts
  const contracts = require('./frontend/src/config/contracts.ts');
}

testUsers();
