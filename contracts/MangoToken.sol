// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ContextMixin.sol";

contract MangoToken is
    ERC721,
    ERC721Enumerable,
    ContextMixin,
    AccessControl,
    Ownable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string private _baseTokenURI;

    // if OpenSea's ERC721 Proxy Address is detected, auto-return true
    // for Polygon's Mumbai testnet, use 0xff7Ca10aF37178BdD056628eF42fD7F799fAc77c
    // for Polygon's mainnet, use 0x58807baD0B376efc12F5AD86aAc70E78ed67deaE
    address private _openSeaProxy;

    constructor(string memory baseURI, address openSeaProxy)
        ERC721("MangoToken", "MAGT")
    {
        _baseTokenURI = baseURI;
        _openSeaProxy = openSeaProxy;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function setOpenSeaProxy(address addr) external onlyOwner {
        _openSeaProxy = addr;
    }

    function getOpenSeaProxy() public view onlyOwner returns (address) {
        return _openSeaProxy;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * Override isApprovedForAll to auto-approve OS's proxy contract
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        // if OpenSea's ERC721 Proxy Address is detected, auto-return true
        // for Polygon's Mumbai testnet, use 0xff7Ca10aF37178BdD056628eF42fD7F799fAc77c
        // for Polygon's mainnet, use 0x58807baD0B376efc12F5AD86aAc70E78ed67deaE
        if (_operator == _openSeaProxy) {
            return true;
        }

        // otherwise, use the default ERC721.isApprovedForAll()
        return ERC721.isApprovedForAll(_owner, _operator);
    }

    /**
     * This is used instead of msg.sender as transactions won't be sent by the original token owner, but by OpenSea.
     */
    function _msgSender() internal view override returns (address sender) {
        return ContextMixin.msgSender();
    }

    function safeMint(address to, uint256 tokenId)
        public
        onlyRole(MINTER_ROLE)
    {
        _safeMint(to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        uint256 balance = address(this).balance;
        require(amount <= balance, "Insufficient balance");
        payable(to).transfer(amount);
    }

    function withdrawERC20(
        IERC20 token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(token.transfer(to, amount), "Transfer failed");
    }
}
