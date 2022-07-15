require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');
require('hardhat-contract-sizer');
require("@nomiclabs/hardhat-etherscan");


const { Mumbai, Polygon } = require('./secrets.json');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  contractSizer: { //https://learnblockchain.cn/docs/hardhat/plugins/hardhat-contract-sizer.html
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    mumbai: {
      url: `${Mumbai.alchemy}`,
      chainId: 80001,
      timeout: 600000,//600秒
      accounts: { mnemonic: Mumbai.mnemonic },
    },
    polygon: {
      url: `${Polygon.alchemy}`,
      chainId: 137,
      timeout: 3600000,//3600000秒 =1小时
      accounts: { mnemonic: Polygon.mnemonic },
    }
  },
  etherscan: {
    apiKey: "QXWEMBFYR6DQWBM9K8W24R7VDRWI7H7ZC6"
  }
};
