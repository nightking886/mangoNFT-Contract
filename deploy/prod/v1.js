const { ethers } = require("hardhat");

/* 注意: 先修改合约里面的价格再执行次脚本！！！ */

async function main() {

    const openSeaProxyAddress = '0x58807baD0B376efc12F5AD86aAc70E78ed67deaE';
    const MangoToken = await ethers.getContractFactory("MangoToken");
    console.log("Deploying MangoToken...");
    const mangoToken = await MangoToken.deploy("https://metadata.mangoNFT.io/metadata/index", openSeaProxyAddress);
    console.log("MangoToken deployed to:", mangoToken.address);


    const default_treasury = '0xcb2c0493D504f85622EDcffBd57684F0041e4f2E';
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
