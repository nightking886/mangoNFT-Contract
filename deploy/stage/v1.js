const { ethers } = require("hardhat");

async function main() {

    const openSeaProxyAddress = '0xff7Ca10aF37178BdD056628eF42fD7F799fAc77c';
    const MangoToken = await ethers.getContractFactory("MangoToken");
    console.log("Deploying MangoToken...");
    const mangoToken = await MangoToken.deploy("https://metadata-test.mangoNFT.io/", openSeaProxyAddress);
    console.log("MangoToken deployed to:", mangoToken.address);

    const default_treasury = '0xe0753377ED07227C648dd73C11c3497437367ED6';
    const GenesisAirDrop = await ethers.getContractFactory("GenesisAirDrop");
    console.log("Deploying GenesisAirDrop...");
    const genesisAirDrop = await GenesisAirDrop.deploy(mangoToken.address, default_treasury);
    console.log("GenesisAirDrop deployed to:", genesisAirDrop.address);

    await mangoToken.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")), genesisAirDrop.address);
    console.log("grantRole success");

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
