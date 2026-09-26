// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @notice Mock BEP-20 USDT token for testing on BNB Smart Chain Testnet & Local Hardhat Network.
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private _decimals;

    constructor() ERC20("Mock Tether USD", "USDT") Ownable(msg.sender) {
        _decimals = 18;
        // Mint 10,000,000 USDT to deployer for testing setup
        _mint(msg.sender, 10000000 * 10**_decimals);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Testnet Faucet function allowing any user to request 1,000 Mock USDT for testing.
     */
    function faucet() external {
        _mint(msg.sender, 1000 * 10**_decimals);
    }

    /**
     * @notice Owner function to mint custom testnet tokens if needed.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
