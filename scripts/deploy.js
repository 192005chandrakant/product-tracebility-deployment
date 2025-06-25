const hre = require("hardhat");

async function main() {
  const ProductTraceability = await hre.ethers.getContractFactory("ProductTraceability");
  const contract = await ProductTraceability.deploy();
  await contract.deployed();
  console.log("ProductTraceability deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 