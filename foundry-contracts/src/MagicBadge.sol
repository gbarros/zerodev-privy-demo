// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title MagicBadge
 * @dev A simple ERC-721 NFT contract for the ZeroDev x Privy demo.
 * It allows the contract owner to mint new tokens to any address.
 */
contract MagicBadge is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor(address initialOwner) ERC721("Magic Badge", "MBDG") Ownable(initialOwner) {}

    /**
     * @dev Mints a new token to the sender address.
     */
    function mint() public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
    }

    /**
     * @dev Mints a new token to the specified address.
     * Can only be called by the contract owner.
     * @param to The address that will receive the minted token.
     */
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
}
