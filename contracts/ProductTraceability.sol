// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTraceability {
    enum Role { None, Producer, Logistics, Inspector, Admin }

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
    
    // Role-based access control
    mapping(address => Role) public roleRegistry;

    event ProductAdded(string productId, address indexed creator);
    event StageUpdated(string productId, string stage);
    event Whitelisted(address indexed account, bool status);
    event RoleGranted(address indexed account, Role role);
    event RoleRevoked(address indexed account);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelisted[msg.sender], "Not whitelisted");
        _;
    }

    modifier requiresRole(Role _required) {
        Role userRole = roleRegistry[msg.sender];
        require(
            userRole == _required || userRole == Role.Admin || msg.sender == owner,
            "Insufficient role permissions"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        whitelisted[msg.sender] = true;
        roleRegistry[msg.sender] = Role.Admin;
    }

    // Role management functions
    function grantRole(address account, Role role) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(role != Role.None, "Cannot grant None role");
        roleRegistry[account] = role;
        whitelisted[account] = true;
        emit RoleGranted(account, role);
    }

    function revokeRole(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        roleRegistry[account] = Role.None;
        whitelisted[account] = false;
        emit RoleRevoked(account);
    }

    function getRole(address account) external view returns (Role) {
        return roleRegistry[account];
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
    ) public requiresRole(Role.Producer) {
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

    function updateStage(string memory productId, string memory stage) public requiresRole(Role.Logistics) {
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