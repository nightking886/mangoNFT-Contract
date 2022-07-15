// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract GenesisAirDrop is ReentrancyGuard, Ownable, Pausable {
    using Address for address;
    using Address for address payable;
    using Counters for Counters.Counter;

    using SafeMath for uint256;

    string public constant name = "Mango Genesis AirDrop";

    string public constant version = "0.1";

    /* mangoNFT category limit
    key: category name
    value: mangoNFT limit */
    mapping(uint8 => uint256) _category_limit;

    /* mangoNFT category price
    key: category name
    value:mangoNFT price */
    mapping(uint8 => uint256) _category_price;

    /* mangoNFT saled count by category
    key: category name
    value:saled count */
    mapping(uint8 => uint256) _category_saled_count;

    mapping(uint8 => Counters.Counter) private _tokenIdCounters;

    uint256 private _current_count;

    /* mangoNFT tokenAddress*/
    address internal _tokenAddress;

    /* mangoNFT treasury*/
    address internal _treasury;

    uint8 private _category_count;

    event CallClaimResponse(bool success, bytes data);

    constructor(address tokenAddress, address treasury) {
        _tokenAddress = tokenAddress;
        _treasury = treasury;
        _category_price[1] = 30000000000000000000; // mainnet: 30000000000000000000 (30 MATIC)
        _category_limit[1] = 1500;
        _tokenIdCounters[1] = Counters.Counter(0);

        _category_price[2] = 30000000000000000000; // mainnet: 30000000000000000000 (30 MATIC)
        _category_limit[2] = 1500;
        _tokenIdCounters[2] = Counters.Counter(1500);

        _category_price[3] = 40000000000000000000; // mainnet: 40000000000000000000 (40 MATIC)
        _category_limit[3] = 1000;
        _tokenIdCounters[3] = Counters.Counter(3000);
        _current_count = 4000;
        _category_count = 3;
    }

    function addCategroy(
        uint8 category,
        uint256 price,
        uint256 limit
    ) public onlyOwner {
        require(category > _category_count, "Not valid category");
        require(category < 100, "out of maximum allowable range");
        require(limit > 0, "Not valid limit");
        require(price > 0, "Not valid price");

        _category_price[category] = price;
        _category_limit[category] = limit;
        _current_count = _current_count.add(limit);
        _tokenIdCounters[category] = Counters.Counter(_current_count);
        _category_count++;
    }

    function setTokenAddress(address tokenAddress) public onlyOwner {
        _tokenAddress = tokenAddress;
    }

    function getTokenAddress() public view returns (address) {
        return _tokenAddress;
    }

    function setTreasury(address treasury) public onlyOwner {
        _treasury = treasury;
    }

    function getTreasury() public view returns (address) {
        return _treasury;
    }

    function getLimit(uint8 category) public view returns (uint256) {
        return _category_limit[category];
    }

    function setPrice(uint8 category, uint256 price) public onlyOwner {
        _category_price[category] = price;
    }

    function getPrice(uint8 category) public view returns (uint256) {
        return _category_price[category];
    }

    function getSaledCount(uint8 category) public view returns (uint256) {
        return _category_saled_count[category];
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    /*claim a Genesis NFT*/
    function claim(uint8 category, uint256 quantity)
        public
        payable
        nonReentrant
        whenNotPaused
    {
        require(_category_limit[category] > 0, "Not valid limit");
        require(_category_price[category] > 0, "Not valid price");

        require(quantity >= 1, "Not valid quantity");

        require(
            msg.value >= quantity.mul(_category_price[category]),
            "Not enough amount"
        );
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIdCounters[category].increment();
            uint256 tokenId = _tokenIdCounters[category].current();
            require(
                _category_saled_count[category] < _category_limit[category],
                "Sold out"
            );

            (bool success, bytes memory result) = _tokenAddress.call(
                abi.encodeWithSignature(
                    "safeMint(address,uint256)",
                    msg.sender,
                    tokenId
                )
            );
            require(success, "Mint Failed");
            _category_saled_count[category]++;
            emit CallClaimResponse(success, result);
        }
        payable(address(_treasury)).sendValue(msg.value);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        uint256 balance = address(this).balance;
        require(amount <= balance, "Transfer failed");
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
