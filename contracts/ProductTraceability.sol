// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTraceability {
    struct Product {
        string productId;
        string name;
        string origin;
        string manufacturer;
        string[] logisticsStages;
        string certificationHash;
        uint timestamp;
        address creator;
    }

    mapping(string => Product) private products;
    mapping(string => bool) private productExists;
    address public owner;
    mapping(address => bool) public whitelisted;

    event ProductAdded(string productId, address indexed creator);
    event StageUpdated(string productId, string stage);
    event Whitelisted(address indexed account, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelisted[msg.sender], "Not whitelisted");
        _;
    }

    constructor() {
        owner = msg.sender;
        whitelisted[msg.sender] = true;
    }

    function whitelist(address account, bool status) external onlyOwner {
        whitelisted[account] = status;
        emit Whitelisted(account, status);
    }

    function addProduct(
        string memory productId,
        string memory name,
        string memory origin,
        string memory manufacturer,
        string memory certificationHash
    ) public onlyWhitelisted {
        require(!productExists[productId], "Product already exists");
        Product storage p = products[productId];
        p.productId = productId;
        p.name = name;
        p.origin = origin;
        p.manufacturer = manufacturer;
        p.certificationHash = certificationHash;
        p.timestamp = block.timestamp;
        p.creator = msg.sender;
        productExists[productId] = true;
        emit ProductAdded(productId, msg.sender);
    }

    function updateStage(string memory productId, string memory stage) public onlyWhitelisted {
        require(productExists[productId], "Product does not exist");
        products[productId].logisticsStages.push(stage);
        emit StageUpdated(productId, stage);
    }

    function getProduct(string memory productId) public view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string[] memory,
        string memory,
        uint,
        address
    ) {
        require(productExists[productId], "Product does not exist");
        Product storage p = products[productId];
        return (
            p.productId,
            p.name,
            p.origin,
            p.manufacturer,
            p.logisticsStages,
            p.certificationHash,
            p.timestamp,
            p.creator
        );
    }
} 