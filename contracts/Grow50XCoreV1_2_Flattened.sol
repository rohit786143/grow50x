// Sources flattened with hardhat v2.29.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC165.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)

pragma solidity >=0.4.16;


// File @openzeppelin/contracts/interfaces/IERC1363.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)

pragma solidity >=0.6.2;


/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;


/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        if (!_safeTransfer(token, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        if (!_safeTransferFrom(token, from, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _safeTransfer(token, to, value, false);
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _safeTransferFrom(token, from, to, value, false);
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        if (!_safeApprove(token, spender, value, false)) {
            if (!_safeApprove(token, spender, 0, true)) revert SafeERC20FailedOperation(address(token));
            if (!_safeApprove(token, spender, value, true)) revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Oppositely, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity `token.transfer(to, value)` call, relaxing the requirement on the return value: the
     * return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransfer(IERC20 token, address to, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.transfer.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(to, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }

    /**
     * @dev Imitates a Solidity `token.transferFrom(from, to, value)` call, relaxing the requirement on the return
     * value: the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param from The sender of the tokens
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value,
        bool bubble
    ) private returns (bool success) {
        bytes4 selector = IERC20.transferFrom.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(from, shr(96, not(0))))
            mstore(0x24, and(to, shr(96, not(0))))
            mstore(0x44, value)
            success := call(gas(), token, 0, 0x00, 0x64, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
            mstore(0x60, 0)
        }
    }

    /**
     * @dev Imitates a Solidity `token.approve(spender, value)` call, relaxing the requirement on the return value:
     * the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param spender The spender of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeApprove(IERC20 token, address spender, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.approve.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(spender, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }
}


// File @openzeppelin/contracts/utils/StorageSlot.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.js.

pragma solidity ^0.8.20;

/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * IMPORTANT: Deprecated. This storage-based reentrancy guard will be removed and replaced
 * by the {ReentrancyGuardTransient} variant in v6.0.
 *
 * @custom:stateless
 */
abstract contract ReentrancyGuard {
    using StorageSlot for bytes32;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @dev A `view` only version of {nonReentrant}. Use to block view functions
     * from being called, preventing reading from inconsistent contract state.
     *
     * CAUTION: This is a "view" modifier and does not change the reentrancy
     * status. Use it only on view functions. For payable or non-payable functions,
     * use the standard {nonReentrant} modifier instead.
     */
    modifier nonReentrantView() {
        _nonReentrantBeforeView();
        _;
    }

    function _nonReentrantBeforeView() private view {
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        _nonReentrantBeforeView();

        // Any calls to nonReentrant after this point will fail
        _reentrancyGuardStorageSlot().getUint256Slot().value = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _reentrancyGuardStorageSlot().getUint256Slot().value == ENTERED;
    }

    function _reentrancyGuardStorageSlot() internal pure virtual returns (bytes32) {
        return REENTRANCY_GUARD_STORAGE;
    }
}


// File contracts/Grow50XEvents.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Grow50XEvents
 * @notice Central event log interface for GROW 50X protocol.
 */
contract Grow50XEvents {
    event UserRegistered(
        uint256 indexed id,
        address indexed wallet,
        uint256 ownerMainUserId,
        uint256 indexed sponsorId,
        uint256 placementParentId,
        bool isSubId,
        uint256 timestamp
    );

    event SponsorAssigned(uint256 indexed id, uint256 indexed sponsorId);
    event PlacementAssigned(uint256 indexed id, uint256 indexed placementParentId, uint256 boardId, uint8 positionIndex);
    event BoardPositionFilled(uint256 indexed boardId, uint8 boardLevel, uint256 indexed id, uint8 positionIndex);
    event BoardCompleted(uint256 indexed boardId, uint8 boardLevel, uint256 indexed topId);
    event BoardSplit(uint256 indexed completedBoardId, uint256 newBoardIdA, uint256 newBoardIdB);
    event BoardAdvanced(uint256 indexed id, uint8 fromBoard, uint8 toBoard);
    event DirectCountUpdated(uint256 indexed id, uint256 newDirectCount);
    
    event DirectCommissionAccrued(uint256 indexed sponsorId, uint256 indexed fromUserId, uint256 amount, uint256 timestamp);
    event DirectCommissionPaid(uint256 indexed sponsorId, address indexed sponsorWallet, uint256 amount);
    event DirectCommissionClaimed(uint256 indexed sponsorId, address indexed sponsorWallet, uint256 amount);

    event SharePoolFunded(uint256 amount, uint256 newTotalPoolBalance);
    event ShareDistributionFinalized(uint256 indexed periodId, uint256 poolAmount, uint256 totalShares, uint256 shareValueScaled);
    event ShareIncomeCredited(uint256 indexed id, address indexed wallet, uint256 amount, uint256 newLifetimeShareIncome);
    
    event BoardRewardAccrued(uint256 indexed id, uint8 boardLevel, uint256 amount, uint256 timestamp);
    event BoardRewardPaid(uint256 indexed id, address indexed wallet, uint8 boardLevel, uint256 amount);
    event BoardRewardClaimed(uint256 indexed id, address indexed wallet, uint256 amount);

    event LevelIncomeAccrued(uint256 indexed beneficiaryMainUserId, uint256 indexed sourceId, uint8 level, uint256 amount, uint256 timestamp);
    event LevelIncomePaid(uint256 indexed beneficiaryMainUserId, address indexed wallet, uint256 sourceId, uint8 level, uint256 amount);
    event LevelIncomeClaimed(uint256 indexed beneficiaryMainUserId, address indexed wallet, uint256 amount);
    
    event AllUserIncomeClaimed(
        uint256 indexed mainUserId,
        address indexed wallet,
        uint256 directAmount,
        uint256 shareAmount,
        uint256 levelAmount,
        uint256 boardRewardAmount,
        uint256 totalClaimed,
        uint256 timestamp
    );

    event AdminFeeAccrued(
        uint8 indexed adminIndex,
        address indexed adminWallet,
        uint256 amount,
        uint256 indexed fromUserId,
        uint256 timestamp
    );
    event AdminFeesWithdrawn(
        uint8 indexed adminIndex,
        address indexed adminWallet,
        uint256 amount,
        uint256 timestamp
    );

    event CycleCompleted(uint256 indexed cycleId, uint256 indexed userId, address indexed wallet, uint256 timestamp);
    event ReserveFunded(uint256 totalFunded, uint256 boardRewardsBucket, uint256 levelIncomeBucket);
    event ReserveUsed(string category, uint256 amount, uint256 remainingBucketBalance);
    
    event BatchSubIdsCreated(uint256 indexed ownerMainUserId, address indexed wallet, uint256 count, uint256 firstSubId, uint256 lastSubId);
    event AdminWalletsUpdated(address admin1, address admin2, address admin3);
    event UserPlacedOnHold(uint256 indexed userId, uint8 fromLevel, uint8 targetLevel, uint256 directCount);
    event UserReleasedFromHold(uint256 indexed userId, uint8 fromLevel, uint8 targetLevel);
    event RootDirectCommissionSplit(uint256 indexed fromUserId, uint256 totalAmount, uint256 amountPerAdmin);
    event InactivitySweepTriggered(address indexed caller, uint256 totalAmount, uint256 timestamp);
}


// File contracts/Grow50XStorage.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Grow50XStorage
 * @notice Central data types, structs, and storage layouts for GROW 50X protocol.
 */
contract Grow50XStorage {
    struct UserID {
        uint256 id;                 // Deterministic internal numeric ID (1-indexed)
        address wallet;             // Owner wallet address
        uint256 ownerMainUserId;    // Main ID owning this entity (self ID for Main IDs)
        uint256 sponsorId;          // Sponsor ID in Sponsor Tree
        uint256 placementParentId;  // Parent ID in Placement Tree
        uint8 currentBoard;         // Board level 1..5
        uint256 directCount;        // Direct referrals count on Sponsor Tree
        bool active;                // Registration status
        uint256 createdAt;          // Timestamp of creation
        bool isSubId;               // Flag indicating if this is a Sub-ID
    }

    struct BoardUnit {
        uint256 boardId;            // Unique board unit ID
        uint8 boardLevel;           // Level 1..5
        uint256 topId;              // Position 1 ID
        uint256[7] positions;       // Array of 7 position IDs [0..6] (0 = empty)
        uint8 filledCount;          // Count of filled positions (0..7)
        bool completed;             // Completion flag
        uint256 createdAt;          // Creation timestamp
    }

    struct IncomeRecord {
        uint256 directIncome;             // Direct sponsor earnings ($40 / entry)
        uint256 shareIncome;              // Earned from 10-day Share Pool
        uint256 levelIncome;              // Earned from 3%/2%/1% Sub-ID level rewards
        uint256 boardRewards;             // Board completion payouts ($40, $80, $160, $320, $640)
        uint256 lifetimeShareIncomeEarned; // Non-resetting cumulative share earnings
    }

    struct CycleRecord {
        uint256 cycleId;
        uint256 userId;
        address wallet;
        uint256 completedAt;
    }

    struct ClaimRecord {
        uint256 claimId;
        uint256 mainUserId;
        address wallet;
        uint256 totalAmount;
        uint256 directAmount;
        uint256 shareAmount;
        uint256 levelAmount;
        uint256 boardRewardAmount;
        uint256 timestamp;
    }

    // Protocol Constants
    uint256 public constant ENTRY_FEE = 100 * 10**18; // 100 USDT (18 decimals)
    uint256 public constant SPONSOR_FEE = 40 * 10**18;
    uint256 public constant SHARE_POOL_FEE = 30 * 10**18;
    uint256 public constant ADMIN_FEE_EACH = 5 * 10**18;
    uint256 public constant RESERVE_FEE = 15 * 10**18;

    // Board Completion Rewards
    uint256 public constant REWARD_BOARD_1 = 40 * 10**18;
    uint256 public constant REWARD_BOARD_2 = 80 * 10**18;
    uint256 public constant REWARD_BOARD_3 = 160 * 10**18;
    uint256 public constant REWARD_BOARD_4 = 320 * 10**18;
    uint256 public constant REWARD_BOARD_5 = 640 * 10**18;

    // Cumulative Share-Income Caps
    uint256 public constant CAP_BOARD_1 = 200 * 10**18;
    uint256 public constant CAP_BOARD_2 = 400 * 10**18;
    uint256 public constant CAP_BOARD_3 = 1000 * 10**18;
    uint256 public constant CAP_BOARD_4 = 2000 * 10**18;
    uint256 public constant CAP_BOARD_5 = 5000 * 10**18;

    // Share Multipliers by Board Level
    uint256 public constant SHARES_BOARD_1 = 1;
    uint256 public constant SHARES_BOARD_2 = 2;
    uint256 public constant SHARES_BOARD_3 = 5;
    uint256 public constant SHARES_BOARD_4 = 10;
    uint256 public constant SHARES_BOARD_5 = 25;

    // Level Income Percentages (from Reserve)
    uint256 public constant LEVEL_1_INCOME = 3 * 10**18; // 3 USDT
    uint256 public constant LEVEL_2_INCOME = 2 * 10**18; // 2 USDT
    uint256 public constant LEVEL_3_INCOME = 1 * 10**18; // 1 USDT
}


// File contracts/Grow50XCoreV1_2.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;






/**
 * @title Grow50XCoreV1_2
 * @notice Production-Grade V1.2 Smart Contract Architecture for GROW 50X on BNB Smart Chain.
 * Major Upgrades in V1.2:
 * 1. 3 ADMIN INDIVIDUAL TELEMETRY & SELF-CLAIM LEDGER:
 *    - 5% Admin Fees ($5 USDT per entry) and Root direct commission splits are tracked in individual admin ledgers.
 *    - Detailed telemetry events (`AdminFeeAccrued`) emitted per entry for full transparent dashboard tracking (shows exactly which user fee came from).
 *    - Admins claim accumulated fees anytime via `withdrawAdminFees()`.
 * 2. 40% DIRECT COMMISSION UNCLAIMED LEDGER (`claimDirectIncome`):
 *    - 40% ($40 USDT) direct sponsor commission is accrued to sponsor's unclaimed direct income ledger.
 *    - Zero instant token transfers during registration -> Reduces registration gas fee by up to 35-40%!
 *    - Sponsors claim accumulated direct commission anytime via `claimDirectIncome()` or `claimAllUserIncome()`.
 * 3. 3-2-1 LEVEL INCOME & BOARD REWARDS UNCLAIMED LEDGER:
 *    - Sub-ID 3-2-1 level income ($3, $2, $1 USDT) and Board Completion Rewards ($40, $80, $160, $320, $640 USDT) accrue to user unclaimed ledgers.
 *    - Users claim via `claimLevelIncome()`, `claimBoardRewards()`, or `claimAllUserIncome()`.
 * 4. CONSOLIDATED 1-CLICK USER CLAIM (`claimAllUserIncome`):
 *    - Users can claim all accumulated Direct Income, Level Income, Board Rewards, and Share Income in 1 single transaction.
 */
contract Grow50XCoreV1_2 is Grow50XStorage, Grow50XEvents, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;

    // Official Admin Wallets
    address public adminWallet1;
    address public adminWallet2;
    address public adminWallet3;

    // Protocol Counters & Share Tracker
    uint256 public totalUserCount;
    uint256 public boardIdCounter;
    uint256 public cycleIdCounter;
    mapping(uint8 => uint256) public boardLevelCounter;                 // boardLevel (1..5) => level-specific unit count
    uint256 public totalActiveProtocolShares;

    // 3 Admin 5% Individual Telemetry & Ledger
    uint256 public admin1UnclaimedFees;
    uint256 public admin1TotalEarned;
    uint256 public admin1TotalWithdrawn;

    uint256 public admin2UnclaimedFees;
    uint256 public admin2TotalEarned;
    uint256 public admin2TotalWithdrawn;

    uint256 public admin3UnclaimedFees;
    uint256 public admin3TotalEarned;
    uint256 public admin3TotalWithdrawn;

    // User Unclaimed Income Balances (Claimable from Dashboard)
    mapping(uint256 => uint256) public userUnclaimedDirectIncome;
    mapping(uint256 => uint256) public userUnclaimedLevelIncome;
    mapping(uint256 => uint256) public userUnclaimedBoardRewards;

    // Account Mappings
    mapping(uint256 => UserID) public users;                            // internalId => UserID
    mapping(address => uint256) public walletToMainUserId;             // wallet => mainUserId
    mapping(uint256 => uint256[]) public ownerSubIds;                   // mainUserId => list of subId internalIds
    mapping(uint256 => IncomeRecord) public userIncomes;                // internalId => IncomeRecord

    // Board Unit Mappings
    mapping(uint256 => BoardUnit) public boardUnits;                    // boardId => BoardUnit
    mapping(uint8 => uint256[]) public activeBoardIdsByLevel;           // boardLevel (1..5) => array of active boardIds
    mapping(uint256 => uint256) public userActiveBoardUnit;             // internalId => boardId for current level

    // Board Hold Queue Mappings
    mapping(uint8 => uint256[]) public boardHoldList;                   // boardLevel (1..4) => array of userIds waiting for direct qualification
    mapping(uint256 => bool) public isHoldingForQualification;          // userId => is currently on hold
    mapping(uint256 => uint8) public holdingTargetLevel;                // userId => target level waiting for (2..5)

    // Reserve Fund Accounting Buckets
    uint256 public reserveForBoardRewards;
    uint256 public reserveForLevelIncome;

    // Share Pool Accounting State
    uint256 public sharePoolBalance;
    uint256 public currentPeriodId;
    uint256 public currentPeriodStart;
    uint256 public nextPeriodTargetTimestamp;
    uint256 public accumulatedShareValueScaled; // Scaled by 1e18
    mapping(uint256 => uint256) public userLastAccumulator;             // internalId => last claimed accumulator
    mapping(uint256 => uint256) public periodPoolBalance;               // periodId => total pool amount
    mapping(uint256 => uint256) public periodTotalShares;                // periodId => total eligible shares

    // Cycle Records
    mapping(uint256 => CycleRecord) public cycles;
    mapping(uint256 => uint256[]) public userCompletedCycles;           // mainUserId => cycleIds

    // Claim Records & Withdrawal History Ledger
    uint256 public claimRecordCounter;
    mapping(uint256 => ClaimRecord[]) public userClaimHistory;           // mainUserId => list of ClaimRecords

    // Deterministic position filling order: TOP -> BOTTOM, LEFT -> RIGHT
    uint8[7] private FILL_ORDER = [0, 1, 2, 3, 4, 5, 6];

    // Activity Tracker & Random Nonce
    uint256 public lastActivityTimestamp;
    uint256 private nonce;
    mapping(uint256 => bool) public usedUserIds;

    constructor(
        address _usdtToken,
        address _admin1,
        address _admin2,
        address _admin3
    ) Ownable(msg.sender) {
        require(_usdtToken != address(0), "Invalid USDT");
        require(_admin1 != address(0) && _admin2 != address(0) && _admin3 != address(0), "Invalid admin");

        usdtToken = IERC20(_usdtToken);
        adminWallet1 = _admin1;
        adminWallet2 = _admin2;
        adminWallet3 = _admin3;

        currentPeriodId = 1;
        currentPeriodStart = block.timestamp;
        nextPeriodTargetTimestamp = _calculateNextCutoff(block.timestamp);
        lastActivityTimestamp = block.timestamp;
    }

    // ==========================================
    // 1. PUBLIC REGISTRATION & SUB-ID CREATION
    // ==========================================

    /**
     * @notice Register a new Main ID (requires 100 USDT).
     * @param sponsorId The Sponsor ID in the Sponsor Tree (0 for Root).
     * @param manualPlacementId Target Board 1 placement ID (0 for Auto Placement).
     */
    function registerMainUser(uint256 sponsorId, uint256 manualPlacementId) external nonReentrant {
        require(walletToMainUserId[msg.sender] == 0, "Registered");
        if (totalUserCount == 0) {
            sponsorId = 0; // First system ID (Root) has no sponsor
        } else {
            require(sponsorId > 0 && users[sponsorId].active, "Invalid sponsor");
        }

        // Deposit 100 USDT (Single token transfer -> Super cheap gas!)
        usdtToken.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);

        // Generate new 6-Digit Random Main User ID
        totalUserCount++;
        uint256 newId = _generateRandom6DigitId();
        walletToMainUserId[msg.sender] = newId;

        users[newId] = UserID({
            id: newId,
            wallet: msg.sender,
            ownerMainUserId: newId,
            sponsorId: sponsorId,
            placementParentId: 0,
            currentBoard: 1,
            directCount: 0,
            active: true,
            createdAt: block.timestamp,
            isSubId: false
        });

        // Add 1 Share for Board 1
        totalActiveProtocolShares += SHARES_BOARD_1;

        // Process revenue allocation to ledgers (Zero instant transfers -> Low Gas!)
        _distributeEntryFeeV1_2(sponsorId, newId);

        // Increment Sponsor's direct count & check for auto-release from hold queue
        if (sponsorId != 0) {
            users[sponsorId].directCount++;
            emit DirectCountUpdated(sponsorId, users[sponsorId].directCount);
            emit SponsorAssigned(newId, sponsorId);

            _checkAndReleaseFromHold(sponsorId);
        }

        // Determine placement & fill position in Board 1
        _placeUserInBoard(newId, 1, sponsorId, manualPlacementId);

        emit UserRegistered(newId, msg.sender, newId, sponsorId, users[newId].placementParentId, false, block.timestamp);
    }

    /**
     * @notice Create a single Sub-ID for caller's Main User account (V1.2 Engine).
     * @param sponsorId Sponsor ID (0 for auto placement, or owned ID for manual placement).
     * @param manualPlacementId Target Board 1 placement ID (0 for Auto Placement).
     */
    function createSubId(uint256 sponsorId, uint256 manualPlacementId) external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 targetSponsorId;
        if (sponsorId == 0) {
            targetSponsorId = _findNextAvailableAutoSponsor(mainUserId);
        } else {
            _validateOwnedSponsorId(mainUserId, sponsorId);
            targetSponsorId = sponsorId;
        }

        usdtToken.safeTransferFrom(msg.sender, address(this), ENTRY_FEE);

        uint256 newSubId = _registerSubIdInternalV1_2(mainUserId, targetSponsorId, manualPlacementId);

        _distributeEntryFeeV1_2(targetSponsorId, newSubId);

        // Process 3-2-1 level income for Sub-IDs to external upline ledgers
        _processLevelIncomeV1_2(newSubId, mainUserId);
    }

    /**
     * @notice Batch create 1 to 5 Sub-IDs in 1 Single Wallet Transaction (V1.2 Engine).
     * @param count Number of Sub-IDs to create (1 to 5).
     */
    function createBatchSubIds(uint256 count) external nonReentrant {
        require(count >= 1 && count <= 5, "Count 1 to 5");
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalCost = count * ENTRY_FEE;
        usdtToken.safeTransferFrom(msg.sender, address(this), totalCost);

        uint256[] memory createdIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 targetSponsorId = _findNextAvailableAutoSponsor(mainUserId);

            uint256 newSubId = _registerSubIdInternalV1_2(mainUserId, targetSponsorId, 0);
            createdIds[i] = newSubId;

            _distributeEntryFeeV1_2(targetSponsorId, newSubId);

            _processLevelIncomeV1_2(newSubId, mainUserId);
        }

        uint256 firstSubId = createdIds[0];
        uint256 lastSubId = createdIds[count - 1];
        emit BatchSubIdsCreated(mainUserId, msg.sender, count, firstSubId, lastSubId);
    }

    // ==========================================
    // 2. INTERNAL REGISTRATION & PLACEMENT LOGIC
    // ==========================================

    function _registerSubIdInternalV1_2(
        uint256 mainUserId,
        uint256 sponsorId,
        uint256 manualPlacementId
    ) internal returns (uint256) {
        totalUserCount++;
        uint256 newSubId = _generateRandom6DigitId();
        ownerSubIds[mainUserId].push(newSubId);

        users[newSubId] = UserID({
            id: newSubId,
            wallet: msg.sender,
            ownerMainUserId: mainUserId,
            sponsorId: sponsorId,
            placementParentId: 0,
            currentBoard: 1,
            directCount: 0,
            active: true,
            createdAt: block.timestamp,
            isSubId: true
        });

        // Add 1 Share for Board 1
        totalActiveProtocolShares += SHARES_BOARD_1;

        users[sponsorId].directCount++;
        emit DirectCountUpdated(sponsorId, users[sponsorId].directCount);
        emit SponsorAssigned(newSubId, sponsorId);

        _checkAndReleaseFromHold(sponsorId);

        _placeUserInBoard(newSubId, 1, sponsorId, manualPlacementId);

        emit UserRegistered(newSubId, msg.sender, mainUserId, sponsorId, users[newSubId].placementParentId, true, block.timestamp);
        return newSubId;
    }

    function _validateOwnedSponsorId(uint256 mainUserId, uint256 sponsorId) internal view {
        require(sponsorId > 0 && users[sponsorId].active, "Invalid Sponsor ID");
        require(
            users[sponsorId].ownerMainUserId == mainUserId,
            "Sponsor ID must belong to caller's owned IDs"
        );
    }

    function _distributeEntryFeeV1_2(uint256 sponsorId, uint256 fromUserId) internal {
        lastActivityTimestamp = block.timestamp;

        // 1. 5% Admin Fee per admin ($5 USDT each -> Accrues to Unclaimed Admin Ledgers)
        admin1UnclaimedFees += ADMIN_FEE_EACH;
        admin1TotalEarned += ADMIN_FEE_EACH;
        emit AdminFeeAccrued(1, adminWallet1, ADMIN_FEE_EACH, fromUserId, block.timestamp);

        admin2UnclaimedFees += ADMIN_FEE_EACH;
        admin2TotalEarned += ADMIN_FEE_EACH;
        emit AdminFeeAccrued(2, adminWallet2, ADMIN_FEE_EACH, fromUserId, block.timestamp);

        admin3UnclaimedFees += ADMIN_FEE_EACH;
        admin3TotalEarned += ADMIN_FEE_EACH;
        emit AdminFeeAccrued(3, adminWallet3, ADMIN_FEE_EACH, fromUserId, block.timestamp);

        // 2. 40% Direct Commission ($40 USDT)
        if (sponsorId == 0) {
            // Root User / No sponsor -> 40% split equally across 3 admin ledgers ($13.33 USDT each)
            uint256 splitThird = SPONSOR_FEE / 3;
            uint256 remainder = SPONSOR_FEE - (splitThird * 3);

            admin1UnclaimedFees += (splitThird + remainder);
            admin1TotalEarned += (splitThird + remainder);
            emit AdminFeeAccrued(1, adminWallet1, splitThird + remainder, fromUserId, block.timestamp);

            admin2UnclaimedFees += splitThird;
            admin2TotalEarned += splitThird;
            emit AdminFeeAccrued(2, adminWallet2, splitThird, fromUserId, block.timestamp);

            admin3UnclaimedFees += splitThird;
            admin3TotalEarned += splitThird;
            emit AdminFeeAccrued(3, adminWallet3, splitThird, fromUserId, block.timestamp);

            emit RootDirectCommissionSplit(fromUserId, SPONSOR_FEE, splitThird);
        } else {
            // Normal Sponsor -> 40% Direct Commission ($40 USDT) INSTANT AUTOMATIC TRANSFER to sponsor's wallet
            userIncomes[sponsorId].directIncome += SPONSOR_FEE;

            address sponsorWallet = users[sponsorId].wallet;
            if (sponsorWallet != address(0)) {
                usdtToken.safeTransfer(sponsorWallet, SPONSOR_FEE);
                emit DirectCommissionAccrued(sponsorId, fromUserId, SPONSOR_FEE, block.timestamp);
            } else {
                userUnclaimedDirectIncome[sponsorId] += SPONSOR_FEE;
                emit DirectCommissionAccrued(sponsorId, fromUserId, SPONSOR_FEE, block.timestamp);
            }
        }


        // 3. 30% Share Pool Reserve (30 USDT)
        sharePoolBalance += SHARE_POOL_FEE;
        emit SharePoolFunded(SHARE_POOL_FEE, sharePoolBalance);

        // 4. 15% Reserve Fund (10 USDT Board Rewards, 5 USDT Level Income)
        reserveForBoardRewards += 10 * 10**18;
        reserveForLevelIncome += 5 * 10**18;
        emit ReserveFunded(RESERVE_FEE, reserveForBoardRewards, reserveForLevelIncome);
    }

    function _processLevelIncomeV1_2(uint256 sourceSubId, uint256 mainUserId) internal {
        uint256 currentSponsorId = users[sourceSubId].sponsorId;
        uint8 externalEligibleCount = 0;

        while (currentSponsorId != 0 && externalEligibleCount < 3) {
            uint256 beneficiaryMainUserId = users[currentSponsorId].ownerMainUserId;

            if (beneficiaryMainUserId != mainUserId) {
                uint256 directCount = users[beneficiaryMainUserId].directCount;

                if (directCount >= 2) {
                    externalEligibleCount++;
                    uint256 levelAmount = 0;
                    if (externalEligibleCount == 1) levelAmount = LEVEL_1_INCOME;      // $3 USDT (3%)
                    else if (externalEligibleCount == 2) levelAmount = LEVEL_2_INCOME; // $2 USDT (2%)
                    else if (externalEligibleCount == 3) levelAmount = LEVEL_3_INCOME; // $1 USDT (1%)

                    if (reserveForLevelIncome >= levelAmount) {
                        reserveForLevelIncome -= levelAmount;

                        userIncomes[beneficiaryMainUserId].levelIncome += levelAmount;
                        userUnclaimedLevelIncome[beneficiaryMainUserId] += levelAmount;

                        emit LevelIncomeAccrued(beneficiaryMainUserId, sourceSubId, externalEligibleCount, levelAmount, block.timestamp);
                        emit ReserveUsed("LevelIncome", levelAmount, reserveForLevelIncome);
                    }
                }
            }

            currentSponsorId = users[beneficiaryMainUserId].sponsorId;
        }
    }

    /**
     * @notice Placement engine for placing user into specified Board Level.
     */
    function _placeUserInBoard(
        uint256 userId,
        uint8 boardLevel,
        uint256 sponsorId,
        uint256 manualPlacementId
    ) internal {
        uint256 targetBoardId = 0;

        if (boardLevel == 1 && manualPlacementId != 0) {
            targetBoardId = _validateManualPlacement(userId, manualPlacementId);
        }

        if (targetBoardId == 0) {
            targetBoardId = _findAutoPlacementBoard(boardLevel, sponsorId);
        }

        if (targetBoardId == 0) {
            targetBoardId = _createNewBoardUnit(boardLevel, userId);
        } else {
            userActiveBoardUnit[userId] = targetBoardId;
            _insertIntoBoardUnit(targetBoardId, userId, (boardLevel == 1 ? manualPlacementId : 0));
        }
    }

    function _validateManualPlacement(uint256 userId, uint256 manualPlacementId) internal view returns (uint256) {
        require(manualPlacementId != 0 && users[manualPlacementId].active, "Invalid placement parent ID");
        require(manualPlacementId != userId, "Cannot place under self");

        uint256 boardId = userActiveBoardUnit[manualPlacementId];
        require(boardId != 0, "Placement parent has no active board");

        BoardUnit memory b = boardUnits[boardId];
        require(b.boardLevel == 1, "Manual placement only allowed in Board Level 1");
        require(!b.completed && b.filledCount < 7, "Placement parent board is full or completed");

        uint8 parentSlot = 255;
        for (uint8 i = 0; i < 7; i++) {
            if (b.positions[i] == manualPlacementId) {
                parentSlot = i;
                break;
            }
        }

        require(parentSlot < 3, "Cannot use bottom board position (Pos 4-7) as placement parent");

        if (parentSlot == 0) {
            require(b.positions[1] == 0 || b.positions[2] == 0, "Placement parent already has 2 direct placement children filled");
        } else if (parentSlot == 1) {
            require(b.positions[3] == 0 || b.positions[4] == 0, "Placement parent already has 2 direct placement children filled");
        } else if (parentSlot == 2) {
            require(b.positions[5] == 0 || b.positions[6] == 0, "Placement parent already has 2 direct placement children filled");
        }

        return boardId;
    }

    function _findAutoPlacementBoard(uint8 boardLevel, uint256 sponsorId) internal view returns (uint256) {
        if (sponsorId != 0) {
            uint256 sponsorBoardId = userActiveBoardUnit[sponsorId];
            if (sponsorBoardId != 0) {
                BoardUnit memory b = boardUnits[sponsorBoardId];
                if (b.boardLevel == boardLevel && !b.completed && b.filledCount < 7) {
                    return sponsorBoardId;
                }
            }
        }

        uint256[] memory activeIds = activeBoardIdsByLevel[boardLevel];
        for (uint256 i = 0; i < activeIds.length; i++) {
            uint256 bId = activeIds[i];
            BoardUnit memory b = boardUnits[bId];
            if (!b.completed && b.filledCount < 7) {
                return bId;
            }
        }

        return 0;
    }

    function _createNewBoardUnit(uint8 boardLevel, uint256 topUserId) internal returns (uint256) {
        boardLevelCounter[boardLevel]++;
        boardIdCounter++;
        uint256 newBoardId = (uint256(boardLevel) * 1000) + boardLevelCounter[boardLevel];

        BoardUnit storage b = boardUnits[newBoardId];
        b.boardId = newBoardId;
        b.boardLevel = boardLevel;
        b.topId = topUserId;
        b.positions[0] = topUserId;
        b.filledCount = 1;
        b.completed = false;
        b.createdAt = block.timestamp;

        activeBoardIdsByLevel[boardLevel].push(newBoardId);
        userActiveBoardUnit[topUserId] = newBoardId;

        emit BoardPositionFilled(newBoardId, boardLevel, topUserId, 0);
        emit PlacementAssigned(topUserId, 0, newBoardId, 0);

        return newBoardId;
    }

    function _insertIntoBoardUnit(uint256 boardId, uint256 userId, uint256 manualPlacementParentId) internal {
        BoardUnit storage b = boardUnits[boardId];
        require(!b.completed && b.filledCount < 7, "Target board unit is full or completed");

        uint8 slotToFill = 255;
        uint256 parentId = 0;

        if (manualPlacementParentId != 0) {
            slotToFill = _findChildSlotOfParent(b, manualPlacementParentId);
            require(slotToFill != 255, "Placement parent already has 2 direct placement children filled");
        } else {
            for (uint8 i = 0; i < 7; i++) {
                uint8 slot = FILL_ORDER[i];
                if (b.positions[slot] == 0) {
                    slotToFill = slot;
                    break;
                }
            }
        }

        require(slotToFill < 7, "No available position in board unit");

        b.positions[slotToFill] = userId;
        b.filledCount++;

        parentId = _getPlacementParentForSlot(b, slotToFill);
        users[userId].placementParentId = parentId;

        emit BoardPositionFilled(boardId, b.boardLevel, userId, slotToFill);
        emit PlacementAssigned(userId, parentId, boardId, slotToFill);

        if (b.filledCount == 7) {
            _processBoardCompletion(boardId);
        }
    }

    function _findChildSlotOfParent(BoardUnit storage b, uint256 parentId) internal view returns (uint8) {
        if (b.positions[0] == parentId) {
            if (b.positions[1] == 0) return 1;
            if (b.positions[2] == 0) return 2;
        } else if (b.positions[1] == parentId) {
            if (b.positions[3] == 0) return 3;
            if (b.positions[4] == 0) return 4;
        } else if (b.positions[2] == parentId) {
            if (b.positions[5] == 0) return 5;
            if (b.positions[6] == 0) return 6;
        }
        return 255;
    }

    function _getPlacementParentForSlot(BoardUnit storage b, uint8 slot) internal view returns (uint256) {
        if (slot == 1 || slot == 2) return b.positions[0];
        if (slot == 3 || slot == 4) return b.positions[1];
        if (slot == 5 || slot == 6) return b.positions[2];
        return 0;
    }

    // ==========================================
    // 3. BOARD COMPLETION, SPLIT & HOLD QUEUE
    // ==========================================

    function _processBoardCompletion(uint256 boardId) internal {
        BoardUnit storage b = boardUnits[boardId];
        b.completed = true;

        uint256 topId = b.topId;
        uint8 currentLevel = b.boardLevel;

        emit BoardCompleted(boardId, currentLevel, topId);

        bool qualified = _checkDirectQualification(topId, currentLevel);

        if (qualified) {
            _payBoardReward(topId, currentLevel);

            if (currentLevel < 5) {
                uint8 nextLevel = currentLevel + 1;
                users[topId].currentBoard = nextLevel;

                _addShareDifferenceOnPromotion(currentLevel, nextLevel);

                emit BoardAdvanced(topId, currentLevel, nextLevel);
                _placeUserInBoard(topId, nextLevel, users[topId].sponsorId, 0);
            } else {
                _recordCycleCompletion(topId);
            }
        } else {
            isHoldingForQualification[topId] = true;
            holdingTargetLevel[topId] = currentLevel + 1;
            boardHoldList[currentLevel].push(topId);
            emit UserPlacedOnHold(topId, currentLevel, currentLevel + 1, users[topId].directCount);
        }

        _executeBoardSplit(boardId);
    }

    function _addShareDifferenceOnPromotion(uint8 fromLevel, uint8 toLevel) internal {
        uint256 oldShare = _getShareWeight(fromLevel);
        uint256 newShare = _getShareWeight(toLevel);
        if (newShare > oldShare) {
            totalActiveProtocolShares += (newShare - oldShare);
        }
    }

    function _getShareWeight(uint8 level) internal pure returns (uint256) {
        return getShareMultiplier(level);
    }

    function _checkDirectQualification(uint256 userId, uint8 boardLevel) internal view returns (bool) {
        uint256 directCount = users[userId].directCount;
        if (boardLevel == 1) return directCount >= 2;
        if (boardLevel == 2) return directCount >= 3;
        if (boardLevel == 3) return directCount >= 4;
        if (boardLevel == 4) return directCount >= 5;
        if (boardLevel == 5) return true;
        return false;
    }

    function _checkAndReleaseFromHold(uint256 userId) internal {
        if (!isHoldingForQualification[userId]) return;

        uint8 targetLevel = holdingTargetLevel[userId];
        uint8 currentHoldLevel = targetLevel - 1;

        bool qualifiedNow = _checkDirectQualification(userId, currentHoldLevel);

        if (qualifiedNow) {
            isHoldingForQualification[userId] = false;
            holdingTargetLevel[userId] = 0;

            _removeFromHoldList(currentHoldLevel, userId);

            _payBoardReward(userId, currentHoldLevel);

            if (targetLevel <= 5) {
                users[userId].currentBoard = targetLevel;
                _addShareDifferenceOnPromotion(currentHoldLevel, targetLevel);

                emit UserReleasedFromHold(userId, currentHoldLevel, targetLevel);
                emit BoardAdvanced(userId, currentHoldLevel, targetLevel);

                _placeUserInBoard(userId, targetLevel, users[userId].sponsorId, 0);
            } else {
                _recordCycleCompletion(userId);
            }
        }
    }

    function _removeFromHoldList(uint8 level, uint256 userId) internal {
        uint256[] storage list = boardHoldList[level];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == userId) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
    }

    function _payBoardReward(uint256 userId, uint8 boardLevel) internal {
        uint256 rewardAmount;
        if (boardLevel == 1) rewardAmount = REWARD_BOARD_1;
        else if (boardLevel == 2) rewardAmount = REWARD_BOARD_2;
        else if (boardLevel == 3) rewardAmount = REWARD_BOARD_3;
        else if (boardLevel == 4) rewardAmount = REWARD_BOARD_4;
        else if (boardLevel == 5) rewardAmount = REWARD_BOARD_5;

        if (reserveForBoardRewards >= rewardAmount) {
            reserveForBoardRewards -= rewardAmount;
            userIncomes[userId].boardRewards += rewardAmount;
            userUnclaimedBoardRewards[userId] += rewardAmount;
            
            emit BoardRewardAccrued(userId, boardLevel, rewardAmount, block.timestamp);
            emit ReserveUsed("BoardRewards", rewardAmount, reserveForBoardRewards);
        }
    }

    function _executeBoardSplit(uint256 completedBoardId) internal {
        BoardUnit storage b = boardUnits[completedBoardId];
        uint8 level = b.boardLevel;

        uint256 pos2Id = b.positions[1];
        uint256 pos3Id = b.positions[2];

        if (pos2Id == 0 && pos3Id == 0) return;

        uint256 newBoardA = 0;
        if (pos2Id != 0) {
            boardLevelCounter[level]++;
            boardIdCounter++;
            newBoardA = (uint256(level) * 1000) + boardLevelCounter[level];

            BoardUnit storage unitA = boardUnits[newBoardA];
            unitA.boardId = newBoardA;
            unitA.boardLevel = level;
            unitA.topId = pos2Id;
            unitA.positions[0] = pos2Id;
            unitA.positions[1] = b.positions[3];
            unitA.positions[2] = b.positions[4];
            unitA.filledCount = 1 + (b.positions[3] != 0 ? 1 : 0) + (b.positions[4] != 0 ? 1 : 0);
            activeBoardIdsByLevel[level].push(newBoardA);

            userActiveBoardUnit[pos2Id] = newBoardA;
            if (b.positions[3] != 0) userActiveBoardUnit[b.positions[3]] = newBoardA;
            if (b.positions[4] != 0) userActiveBoardUnit[b.positions[4]] = newBoardA;
        }

        uint256 newBoardB = 0;
        if (pos3Id != 0) {
            boardLevelCounter[level]++;
            boardIdCounter++;
            newBoardB = (uint256(level) * 1000) + boardLevelCounter[level];

            BoardUnit storage unitB = boardUnits[newBoardB];
            unitB.boardId = newBoardB;
            unitB.boardLevel = level;
            unitB.topId = pos3Id;
            unitB.positions[0] = pos3Id;
            unitB.positions[1] = b.positions[5];
            unitB.positions[2] = b.positions[6];
            unitB.filledCount = 1 + (b.positions[5] != 0 ? 1 : 0) + (b.positions[6] != 0 ? 1 : 0);
            activeBoardIdsByLevel[level].push(newBoardB);

            userActiveBoardUnit[pos3Id] = newBoardB;
            if (b.positions[5] != 0) userActiveBoardUnit[b.positions[5]] = newBoardB;
            if (b.positions[6] != 0) userActiveBoardUnit[b.positions[6]] = newBoardB;
        }

        _removeFromActiveBoardIds(level, completedBoardId);
        emit BoardSplit(completedBoardId, newBoardA, newBoardB);
    }

    function _removeFromActiveBoardIds(uint8 level, uint256 boardId) internal {
        uint256[] storage activeIds = activeBoardIdsByLevel[level];
        for (uint256 i = 0; i < activeIds.length; i++) {
            if (activeIds[i] == boardId) {
                activeIds[i] = activeIds[activeIds.length - 1];
                activeIds.pop();
                break;
            }
        }
    }

    function _recordCycleCompletion(uint256 topId) internal {
        cycleIdCounter++;
        uint256 newCycleId = cycleIdCounter;

        uint256 mainUserId = users[topId].ownerMainUserId;

        cycles[newCycleId] = CycleRecord({
            cycleId: newCycleId,
            userId: topId,
            wallet: users[topId].wallet,
            completedAt: block.timestamp
        });

        userCompletedCycles[mainUserId].push(newCycleId);

        _payBoardReward(topId, 5);

        emit CycleCompleted(newCycleId, topId, users[topId].wallet, block.timestamp);
    }

    // ==========================================
    // 4. ADMIN 5% WITHDRAWAL & USER CLAIMS
    // ==========================================

    /**
     * @notice Allows Admin 1, Admin 2, or Admin 3 to claim their accumulated 5% protocol revenue.
     */
    function withdrawAdminFees() external nonReentrant {
        uint256 amountToClaim = 0;
        uint8 adminIdx = 0;

        if (msg.sender == adminWallet1) {
            adminIdx = 1;
            amountToClaim = admin1UnclaimedFees;
            require(amountToClaim > 0, "No unclaimed admin 1 fees available");
            admin1UnclaimedFees = 0;
            admin1TotalWithdrawn += amountToClaim;
        } else if (msg.sender == adminWallet2) {
            adminIdx = 2;
            amountToClaim = admin2UnclaimedFees;
            require(amountToClaim > 0, "No unclaimed admin 2 fees available");
            admin2UnclaimedFees = 0;
            admin2TotalWithdrawn += amountToClaim;
        } else if (msg.sender == adminWallet3) {
            adminIdx = 3;
            amountToClaim = admin3UnclaimedFees;
            require(amountToClaim > 0, "No unclaimed admin 3 fees available");
            admin3UnclaimedFees = 0;
            admin3TotalWithdrawn += amountToClaim;
        } else {
            revert("Unauthorized: Caller is not an official Admin wallet");
        }

        usdtToken.safeTransfer(msg.sender, amountToClaim);
        emit AdminFeesWithdrawn(adminIdx, msg.sender, amountToClaim, block.timestamp);
    }

    /**
     * @notice Allows registered users to claim their accumulated 40% Direct Commission.
     */
    function claimDirectIncome() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimDirectIncomeInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimDirectIncomeInternal(subIds[i]);
        }

        require(totalClaimable > 0, "No direct commission available to claim");
        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit DirectCommissionClaimed(mainUserId, msg.sender, totalClaimable);
    }

    function _claimDirectIncomeInternal(uint256 userId) internal returns (uint256) {
        uint256 unclaimed = userUnclaimedDirectIncome[userId];
        if (unclaimed > 0) {
            userUnclaimedDirectIncome[userId] = 0;
        }
        return unclaimed;
    }

    /**
     * @notice Allows registered users to claim their accumulated Sub-ID 3-2-1 Level Income.
     */
    function claimLevelIncome() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimLevelIncomeInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimLevelIncomeInternal(subIds[i]);
        }

        require(totalClaimable > 0, "No level income available to claim");
        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit LevelIncomeClaimed(mainUserId, msg.sender, totalClaimable);
    }

    function _claimLevelIncomeInternal(uint256 userId) internal returns (uint256) {
        uint256 unclaimed = userUnclaimedLevelIncome[userId];
        if (unclaimed > 0) {
            userUnclaimedLevelIncome[userId] = 0;
        }
        return unclaimed;
    }

    /**
     * @notice Allows registered users to claim their accumulated Board Completion Rewards.
     */
    function claimBoardRewards() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimBoardRewardInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimBoardRewardInternal(subIds[i]);
        }

        require(totalClaimable > 0, "No board rewards available to claim");
        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit BoardRewardClaimed(mainUserId, msg.sender, totalClaimable);
    }

    function _claimBoardRewardInternal(uint256 userId) internal returns (uint256) {
        uint256 unclaimed = userUnclaimedBoardRewards[userId];
        if (unclaimed > 0) {
            userUnclaimedBoardRewards[userId] = 0;
        }
        return unclaimed;
    }

    /**
     * @notice Claims accumulated 10-Day Share Pool Dividends.
     */
    function claimAllShareIncome() public nonReentrant returns (uint256) {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        uint256 totalClaimable = _claimUserShareIncomeInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            totalClaimable += _claimUserShareIncomeInternal(subIds[i]);
        }

        if (totalClaimable > 0) {
            usdtToken.safeTransfer(msg.sender, totalClaimable);
        }
        return totalClaimable;
    }

    function _claimUserShareIncomeInternal(uint256 userId) internal returns (uint256) {
        if (!users[userId].active) return 0;

        uint256 lastAcc = userLastAccumulator[userId];
        if (accumulatedShareValueScaled <= lastAcc) return 0;

        uint256 accDiff = accumulatedShareValueScaled - lastAcc;
        uint8 bLevel = users[userId].currentBoard;
        uint256 userShares = _getShareWeight(bLevel);

        uint256 grossEarned = (accDiff * userShares) / 1e18;
        if (grossEarned == 0) return 0;

        userLastAccumulator[userId] = accumulatedShareValueScaled;

        uint256 capLimit = getBoardCap(bLevel);
        uint256 currentLifetimeEarned = userIncomes[userId].lifetimeShareIncomeEarned;

        if (currentLifetimeEarned >= capLimit) {
            return 0;
        }

        uint256 netClaimable = grossEarned;
        if (currentLifetimeEarned + grossEarned > capLimit) {
            netClaimable = capLimit - currentLifetimeEarned;
        }

        userIncomes[userId].lifetimeShareIncomeEarned += netClaimable;
        userIncomes[userId].shareIncome += netClaimable;

        emit ShareIncomeCredited(userId, users[userId].wallet, netClaimable, userIncomes[userId].lifetimeShareIncomeEarned);
        return netClaimable;
    }

    /**
     * @notice CONSOLIDATED 1-CLICK CLAIM FUNCTION:
     * Claims ALL accumulated Direct Income, Share Income, Level Income, and Board Rewards in 1 single transaction!
     */
    function claimAllUserIncome() external nonReentrant {
        uint256 mainUserId = walletToMainUserId[msg.sender];
        require(mainUserId != 0, "Not registered");

        // 1. Direct Income
        uint256 directAmount = _claimDirectIncomeInternal(mainUserId);
        // 2. Level Income
        uint256 levelAmount = _claimLevelIncomeInternal(mainUserId);
        // 3. Board Rewards
        uint256 boardRewardAmount = _claimBoardRewardInternal(mainUserId);

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            directAmount += _claimDirectIncomeInternal(subIds[i]);
            levelAmount += _claimLevelIncomeInternal(subIds[i]);
            boardRewardAmount += _claimBoardRewardInternal(subIds[i]);
        }

        // 4. Share Income
        uint256 shareAmount = _claimUserShareIncomeInternal(mainUserId);
        for (uint256 i = 0; i < subIds.length; i++) {
            shareAmount += _claimUserShareIncomeInternal(subIds[i]);
        }

        uint256 totalClaimable = directAmount + levelAmount + boardRewardAmount + shareAmount;
        require(totalClaimable > 0, "No accumulated income available to claim");

        claimRecordCounter++;
        userClaimHistory[mainUserId].push(ClaimRecord({
            claimId: claimRecordCounter,
            mainUserId: mainUserId,
            wallet: msg.sender,
            totalAmount: totalClaimable,
            directAmount: directAmount,
            shareAmount: shareAmount,
            levelAmount: levelAmount,
            boardRewardAmount: boardRewardAmount,
            timestamp: block.timestamp
        }));

        usdtToken.safeTransfer(msg.sender, totalClaimable);
        emit AllUserIncomeClaimed(mainUserId, msg.sender, directAmount, shareAmount, levelAmount, boardRewardAmount, totalClaimable, block.timestamp);
    }

    // ==========================================
    // 5. SHARE PERIOD FINALIZATION & UTILITIES
    // ==========================================

    function finalizeSharePeriod() external nonReentrant {
        require(
            block.timestamp >= nextPeriodTargetTimestamp,
            "Share pool cutoff date (9th/19th/29th) not reached yet"
        );
        require(totalActiveProtocolShares > 0, "No active shares");

        uint256 poolAmount = sharePoolBalance;

        periodPoolBalance[currentPeriodId] = poolAmount;
        periodTotalShares[currentPeriodId] = totalActiveProtocolShares;

        if (poolAmount > 0) {
            uint256 periodValueScaled = (poolAmount * 1e18) / totalActiveProtocolShares;
            accumulatedShareValueScaled += periodValueScaled;
        }

        emit ShareDistributionFinalized(currentPeriodId, poolAmount, totalActiveProtocolShares, accumulatedShareValueScaled);

        sharePoolBalance = 0;
        currentPeriodId++;
        currentPeriodStart = block.timestamp;
        nextPeriodTargetTimestamp = _calculateNextCutoff(block.timestamp + 1 hours);
    }

    function _calculateNextCutoff(uint256 currentTimestamp) internal pure returns (uint256) {
        (uint256 year, uint256 month, uint256 day) = _timestampToDate(currentTimestamp);

        if (day < 9) return _toTimestamp(year, month, 9) + 23 hours + 59 minutes + 59 seconds;
        if (day < 19) return _toTimestamp(year, month, 19) + 23 hours + 59 minutes + 59 seconds;

        (uint256 lastYear, uint256 lastMonth, uint256 lastDay) = _getLastDayOfMonth(year, month);
        if (day < lastDay) return _toTimestamp(lastYear, lastMonth, lastDay) + 23 hours + 59 minutes + 59 seconds;

        if (month == 12) return _toTimestamp(year + 1, 1, 9) + 23 hours + 59 minutes + 59 seconds;
        return _toTimestamp(year, month + 1, 9) + 23 hours + 59 minutes + 59 seconds;
    }

    function _getLastDayOfMonth(uint256 year, uint256 month) internal pure returns (uint256 y, uint256 m, uint256 d) {
        if (month == 2) {
            bool isLeap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
            return (year, month, isLeap ? 29 : 28);
        }
        if (month == 4 || month == 6 || month == 9 || month == 11) return (year, month, 30);
        return (year, month, 31);
    }

    function _timestampToDate(uint256 timestamp) internal pure returns (uint256 year, uint256 month, uint256 day) {
        int256 z = int256(timestamp / 86400) + 719468;
        int256 era = (z >= 0 ? z : z - 146096) / 146097;
        uint256 doe = uint256(z - era * 146097);
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        int256 y = int256(yoe) + era * 400;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;
        uint256 d = doy - (153 * mp + 2) / 5 + 1;
        uint256 m = mp < 10 ? mp + 3 : mp - 9;
        int256 addYear = m <= 2 ? int256(1) : int256(0);
        return (uint256(y + addYear), m, d);
    }

    function _toTimestamp(uint256 year, uint256 month, uint256 day) internal pure returns (uint256) {
        int256 _year = int256(year);
        int256 _month = int256(month);
        int256 _day = int256(day);
        int256 _a = (14 - _month) / 12;
        int256 y = _year + 4800 - _a;
        int256 m = _month + 12 * _a - 3;
        int256 julianDay = _day + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045;
        return uint256(julianDay - 2440588) * 86400;
    }

    function _getTargetDirectCount(uint256 userId) internal view returns (uint256) {
        if (isHoldingForQualification[userId]) {
            uint8 holdLevel = holdingTargetLevel[userId] - 1;
            if (holdLevel == 1) return 2;
            if (holdLevel == 2) return 3;
            if (holdLevel == 3) return 4;
            if (holdLevel == 4) return 5;
            return 5;
        }

        uint8 boardLvl = users[userId].currentBoard;
        if (boardLvl == 1) return 2;
        if (boardLvl == 2) return 3;
        if (boardLvl == 3) return 4;
        if (boardLvl == 4) return 5;
        if (boardLvl == 5) return 5;
        return 2;
    }

    function _findNextAvailableAutoSponsor(uint256 mainUserId) internal view returns (uint256) {
        uint256 mainTarget = _getTargetDirectCount(mainUserId);
        if (users[mainUserId].directCount < mainTarget) {
            return mainUserId;
        }

        uint256[] storage subIds = ownerSubIds[mainUserId];

        for (uint256 i = 0; i < subIds.length; i++) {
            uint256 subId = subIds[i];
            uint256 target = _getTargetDirectCount(subId);
            if (users[subId].directCount < target) {
                return subId;
            }
        }

        for (uint256 i = 0; i < subIds.length; i++) {
            uint256 subId = subIds[i];
            if (users[subId].directCount < 2) {
                return subId;
            }
        }

        return mainUserId;
    }

    function _generateRandom6DigitId() internal returns (uint256) {
        uint256 candidateId;
        uint256 attempts = 0;

        while (attempts < 100) {
            nonce++;
            candidateId = 100000 + (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce, block.prevrandao))) % 900000);
            if (!usedUserIds[candidateId]) {
                usedUserIds[candidateId] = true;
                return candidateId;
            }
            attempts++;
        }

        candidateId = 100000 + totalUserCount;
        usedUserIds[candidateId] = true;
        return candidateId;
    }

    // ==========================================
    // 6. TELEMETRY & VIEW UTILITIES
    // ==========================================

    function getAdminTelemetry(uint8 adminIndex) external view returns (
        address adminWallet,
        uint256 unclaimedFees,
        uint256 totalEarned,
        uint256 totalWithdrawn
    ) {
        if (adminIndex == 1) return (adminWallet1, admin1UnclaimedFees, admin1TotalEarned, admin1TotalWithdrawn);
        if (adminIndex == 2) return (adminWallet2, admin2UnclaimedFees, admin2TotalEarned, admin2TotalWithdrawn);
        if (adminIndex == 3) return (adminWallet3, admin3UnclaimedFees, admin3TotalEarned, admin3TotalWithdrawn);
        revert("Invalid admin index (must be 1, 2, or 3)");
    }

    function getUserUnclaimedSummary(uint256 mainUserId) external view returns (
        uint256 unclaimedDirect,
        uint256 unclaimedLevel,
        uint256 unclaimedBoardRewards,
        uint256 unclaimedShareIncome,
        uint256 totalUnclaimed
    ) {
        unclaimedDirect = userUnclaimedDirectIncome[mainUserId];
        unclaimedLevel = userUnclaimedLevelIncome[mainUserId];
        unclaimedBoardRewards = userUnclaimedBoardRewards[mainUserId];

        uint256[] memory subIds = ownerSubIds[mainUserId];
        for (uint256 i = 0; i < subIds.length; i++) {
            unclaimedDirect += userUnclaimedDirectIncome[subIds[i]];
            unclaimedLevel += userUnclaimedLevelIncome[subIds[i]];
            unclaimedBoardRewards += userUnclaimedBoardRewards[subIds[i]];
        }

        // Estimated Share Income
        unclaimedShareIncome = _getPendingShareIncomeView(mainUserId);
        for (uint256 i = 0; i < subIds.length; i++) {
            unclaimedShareIncome += _getPendingShareIncomeView(subIds[i]);
        }

        totalUnclaimed = unclaimedDirect + unclaimedLevel + unclaimedBoardRewards + unclaimedShareIncome;
    }

    function getUserClaimHistory(uint256 mainUserId) external view returns (ClaimRecord[] memory) {
        return userClaimHistory[mainUserId];
    }

    function _getPendingShareIncomeView(uint256 userId) internal view returns (uint256) {
        if (!users[userId].active) return 0;
        uint256 lastAcc = userLastAccumulator[userId];
        if (accumulatedShareValueScaled <= lastAcc) return 0;

        uint256 accDiff = accumulatedShareValueScaled - lastAcc;
        uint8 bLevel = users[userId].currentBoard;
        uint256 userShares = _getShareWeight(bLevel);

        uint256 grossEarned = (accDiff * userShares) / 1e18;
        if (grossEarned == 0) return 0;

        uint256 capLimit = getBoardCap(bLevel);
        uint256 currentLifetimeEarned = userIncomes[userId].lifetimeShareIncomeEarned;
        if (currentLifetimeEarned >= capLimit) return 0;

        uint256 net = grossEarned;
        if (currentLifetimeEarned + grossEarned > capLimit) {
            net = capLimit - currentLifetimeEarned;
        }
        return net;
    }

    function getBoardUnitPositions(uint256 boardId) external view returns (uint256[7] memory) {
        return boardUnits[boardId].positions;
    }

    function getOwnerSubIds(uint256 mainUserId) external view returns (uint256[] memory) {
        return ownerSubIds[mainUserId];
    }

    function getActiveBoardUnitsByLevel(uint8 level) external view returns (uint256[] memory) {
        return activeBoardIdsByLevel[level];
    }

    function getHoldListByLevel(uint8 level) external view returns (uint256[] memory) {
        return boardHoldList[level];
    }

    function getTotalActiveShares() external view returns (uint256) {
        return totalActiveProtocolShares;
    }

    function getBoardCap(uint8 boardLevel) public pure returns (uint256) {
        if (boardLevel == 1) return CAP_BOARD_1;
        if (boardLevel == 2) return CAP_BOARD_2;
        if (boardLevel == 3) return CAP_BOARD_3;
        if (boardLevel == 4) return CAP_BOARD_4;
        if (boardLevel == 5) return CAP_BOARD_5;
        return CAP_BOARD_1;
    }

    function getShareMultiplier(uint8 boardLevel) public pure returns (uint256) {
        if (boardLevel == 1) return SHARES_BOARD_1;
        if (boardLevel == 2) return SHARES_BOARD_2;
        if (boardLevel == 3) return SHARES_BOARD_3;
        if (boardLevel == 4) return SHARES_BOARD_4;
        if (boardLevel == 5) return SHARES_BOARD_5;
        return SHARES_BOARD_1;
    }

    function updateAdminWallets(address _admin1, address _admin2, address _admin3) external onlyOwner {
        require(_admin1 != address(0) && _admin2 != address(0) && _admin3 != address(0), "Invalid admin address");
        adminWallet1 = _admin1;
        adminWallet2 = _admin2;
        adminWallet3 = _admin3;
        emit AdminWalletsUpdated(_admin1, _admin2, _admin3);
    }
}
