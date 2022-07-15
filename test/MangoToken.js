// test/MangoToken.js
// Load dependencies

const { expect, assert } = require('chai');
const { ethers } = require('hardhat');

let mangoNFT;
let tokenId = 1;
let tokenCount = 1;
let transferCount = 1;
let deployer;
let account1;
let sampleERC20Token;
let sampleERC20Token_amount = 1000000;
let new_deploy_url = "https://metadata.MangoNFT.com/";
let openSeaProxyMumbaiAddress = '0xff7Ca10aF37178BdD056628eF42fD7F799fAc77c';

beforeEach(async function () {
  const accounts = await ethers.getSigners();
  deployer = accounts[0];
  account1 = accounts[1];

  const MangoToken = await ethers.getContractFactory("MangoToken");
  mangoNFT = await MangoToken.deploy("https://metadata.mangoNFT.com/", openSeaProxyMumbaiAddress);

  const SampleERC20Token = await ethers.getContractFactory("SampleERC20Token");
  sampleERC20Token = await SampleERC20Token.deploy();
  await sampleERC20Token.deployed();

});

describe('MangoToken', function () {
  it('test mint', async function () {
    await mangoNFT.safeMint(deployer.address, tokenId);
    const balanceOf1 = await mangoNFT.balanceOf(deployer.address);
    assert.equal(balanceOf1, tokenCount, 'deployer\'s balance is ' + tokenCount);
  });

  it('test tokenURI', async function () {
    await mangoNFT.safeMint(deployer.address, tokenId);
    await mangoNFT.setBaseURI(new_deploy_url);
    const token_uri = await mangoNFT.tokenURI(tokenId);
    let expect_token_uri = new_deploy_url + tokenId;
    assert.equal(token_uri, expect_token_uri, 'token_uri is ' + token_uri + ', but expect_token_uri is ' + expect_token_uri);
  });

  it('test openSea Proxy Address', async function () {
    let addr1 = await mangoNFT.getOpenSeaProxy();
    assert.equal(addr1, openSeaProxyMumbaiAddress, 'openSea Proxy addr is ' + addr1 + ', but is ' + openSeaProxyMumbaiAddress);

    let approval1 = await mangoNFT.isApprovedForAll(account1.address, deployer.address);
    assert.equal(approval1, false, 'opensea isApprovedForAll failed');

    await mangoNFT.setOpenSeaProxy(deployer.address);
    let addr2 = await mangoNFT.getOpenSeaProxy();
    assert.equal(addr2, deployer.address, 'openSea Proxy addr is ' + addr2 + ', but is ' + deployer.address);

    let approval2 = await mangoNFT.isApprovedForAll(account1.address, deployer.address);
    assert.equal(approval2, true, 'opensea isApprovedForAll failed');
  });

  it('test transfer', async function () {
    await mangoNFT.safeMint(deployer.address, tokenId);
    const balanceOf1 = await mangoNFT.balanceOf(deployer.address);
    await mangoNFT.transferFrom(deployer.address, account1.address, tokenId);
    const balanceOf2 = await mangoNFT.balanceOf(deployer.address);
    const balanceOf3 = await mangoNFT.balanceOf(account1.address);

    assert.equal(balanceOf1, tokenCount, 'deployer\'s balance is ' + tokenCount);
    assert.equal(balanceOf2, tokenCount - transferCount, 'deployer\'s balance is ' + tokenCount - transferCount + ' after transfer ' + transferCount);
    assert.equal(balanceOf3, transferCount, 'account1\'s balance is ' + transferCount);

  });

  it('test approval', async function () {
    const approval = await mangoNFT.isApprovedForAll(deployer.address, account1.address);
    assert.equal(approval, false, 'approval result');
    await mangoNFT.setApprovalForAll(account1.address, true);
    const approvaled = await mangoNFT.isApprovedForAll(deployer.address, account1.address);
    assert.equal(approvaled, true, 'approval result');
  });


  it('test withdraw', async function () {
    await mangoNFT.withdraw(account1.address, 0);
  });

  it('test ERC2.0 withdraw', async function () {

    const balance1 = await sampleERC20Token.balanceOf(mangoNFT.address);
    assert.equal(balance1.value, ethers.BigNumber.from(0).value, 'mangoNFT\'s ERC20 balance1');

    await sampleERC20Token.mint(mangoNFT.address, sampleERC20Token_amount);

    const balance2 = await sampleERC20Token.balanceOf(mangoNFT.address);
    assert.equal(balance2.value, ethers.BigNumber.from(sampleERC20Token_amount).value, 'mangoNFT\'s ERC20 balance2');

    await mangoNFT.withdrawERC20(sampleERC20Token.address, account1.address, sampleERC20Token_amount);
    const balance3 = await sampleERC20Token.balanceOf(mangoNFT.address);
    assert.equal(balance3.value, ethers.BigNumber.from(0).value, 'mangoNFT\'s ERC20 balance3');

  });
});