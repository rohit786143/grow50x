const { ethers } = require('ethers');

async function testQuery() {
  const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const coreAddress = '0x6923d9D26a480f4dC32b79EeCAb00A1DB8DC9970';
  const abi = [
    "function totalUserCount() external view returns (uint256)",
    "function users(uint256 id) external view returns (uint256 id, address wallet, uint256 ownerMainUserId, uint256 sponsorId, uint256 placementParentId, uint8 currentBoard, uint256 directCount, bool active, uint256 createdAt, bool isSubId)",
    "function getOwnerSubIds(uint256 mainUserId) external view returns (uint256[])"
  ];

  const contract = new ethers.Contract(coreAddress, abi, provider);

  const idsToTest = [682957, 826280, 472703];

  for (const id of idsToTest) {
    const u = await contract.users(id);
    console.log(`User ${id} RAW:`, u);
    console.log(`User ${id} Parsed:`, {
      id: Number(u.id || u[0]),
      wallet: u.wallet || u[1],
      ownerMainUserId: Number(u.ownerMainUserId || u[2]),
      sponsorId: Number(u.sponsorId || u[3]),
      placementParentId: Number(u.placementParentId || u[4]),
      currentBoard: Number(u.currentBoard || u[5]),
      directCount: Number(u.directCount || u[6]),
      active: Boolean(u.active || u[7]),
      isSubId: Boolean(u.isSubId || u[9]),
    });
  }

  const subIdsOf682957 = await contract.getOwnerSubIds(682957);
  console.log('getOwnerSubIds(682957):', subIdsRaw(subIdsOf682957));
}

function subIdsRaw(arr) {
  return arr.map((x) => Number(x));
}

testQuery().catch(console.error);
