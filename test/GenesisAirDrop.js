// test/GenesisAirDrop.js
// Load dependencies

const { expect, assert } = require('chai');
const { ethers } = require('hardhat');

let genesisAirDrop;
let deployer;
let account1;
let sampleERC20Token;
let sampleERC20Token_amount = 10000000;
let default_treasury = '0xC957254420E9f15aF5C2207b1Ac7d6E1A18801c9';
let category_names = [1, 2, 3];
let category_prices = [0.015, 0.015, 0.018];
let category_limits = [1500, 1500, 1000];
let category_counter_start = [0, 1500, 3000];
let newCategory = [4, 0.015, 1600];


let metadata = 'https://test-metadata.mangoNFT.com';
let openSeaProxyAddress = '0xff7Ca10aF37178BdD056628eF42fD7F799fAc77c';
beforeEach(async function () {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    account1 = accounts[1];

    const MangoToken = await ethers.getContractFactory("MangoToken");
    mangoNFT = await MangoToken.deploy(metadata, openSeaProxyAddress);

    const GenesisAirDrop = await ethers.getContractFactory("GenesisAirDrop");

    genesisAirDrop = await GenesisAirDrop.deploy(mangoNFT.address, default_treasury);

    mangoNFT.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE")), genesisAirDrop.address);

    const SampleERC20Token = await ethers.getContractFactory("SampleERC20Token");
    //console.log("USDC/'s signer : " + USDC.signer.address);
    sampleERC20Token = await SampleERC20Token.deploy();
    await sampleERC20Token.deployed();

});

describe('GenesisAirDrop', function () {
    it('test setPrice', async function () {
        for (var i = 0; i < 3; i++) {
            let category = category_names[i];
            let price = category_prices[i];
            let price1 = await genesisAirDrop.getPrice(category);
            let expectPrice1 = ethers.utils.parseEther(price.toString());
            assert.equal(price1.value, expectPrice1.value, 'genesisAirDrop\'s default price is ' + price1 + ", but expect is " + expectPrice1);
            let new_price = "0.08";
            let expectPrice2 = ethers.utils.parseEther(new_price);
            await genesisAirDrop.setPrice(category, expectPrice2);
            let price2 = await genesisAirDrop.getPrice(category);
            assert.equal(price2.value, expectPrice2.value, 'genesisAirDrop\'s new price is ' + price2 + ", but expect is " + expectPrice2);
        }
    });
    it('test setTreasury', async function () {
        let oldTreasury = await genesisAirDrop.getTreasury();
        let newTreasury = account1.address;
        await genesisAirDrop.setTreasury(newTreasury);
        let treasury = await genesisAirDrop.getTreasury();
        assert.equal(treasury, newTreasury, 'genesisAirDrop\'s treasury is ' + oldTreasury + ", but expect is " + newTreasury);
    });

    it('test setLimit', async function () {
        for (var i = 0; i < 3; i++) {
            let category = category_names[i];
            let expectlimit1 = category_limits[i];
            let limit1 = await genesisAirDrop.getLimit(category);
            console.log(limit1);
            assert.equal(limit1, expectlimit1, 'genesisAirDrop\'s default limit is ' + limit1 + ", but expect is " + expectlimit1);

        }
    });

    it('test narmal claim', async function () {
        let total_count = 0;
        for (var i = 0; i < 3; i++) {
            let category = category_names[i];
            let price = category_prices[i];
            for (j = 1; j <= 3; j++) {
                let total_pay = ethers.utils.parseEther((price * j).toString());
                let gasLimit = 500000 * j;
                let overrides = {
                    value: total_pay,
                    gasLimit: gasLimit
                };
                const provider = deployer.provider;
                let balanceETH = await provider.getBalance(deployer.address);
                if (balanceETH <= total_pay) {
                    console.log('balanceETH', total_pay, balanceETH);
                    break;
                }
                //console.log(i, j, overrides);
                await genesisAirDrop.claim(category, j, overrides);
                total_count += j;
                const balanceOf1 = await mangoNFT.balanceOf(deployer.address);
                assert.equal(balanceOf1, total_count, 'deployer\'s balance is ' + total_count);

                let expect_token_id = category_counter_start[i] + j;
                let tokenOwner = await mangoNFT.ownerOf(expect_token_id);
                assert.equal(tokenOwner, deployer.address, expect_token_id + '\'s owner is ' + tokenOwner + ', but expect ' + deployer.address);
            }
        }
    });
    it('test ex claim', async function () {
        try {
            let category = category_names[0];
            let price = category_prices[0];
            let max_limit = 1;
            await genesisAirDrop.setLimit(category, max_limit);
            var claim_count = max_limit + 1;
            let overrides = {
                value: ethers.utils.parseEther(price.toString()) * claim_count,
                gasLimit: 250000
            };
            await genesisAirDrop.claim(category, claim_count, overrides);
            assert.equal(1, 0, 'deployer\'s ex claim is abnormal');
        }
        catch (ex) {
            assert.equal(1, 1, 'deployer\'s ex claim is normal');
        }

    });

    it('test add correct category', async function () {
        let category = newCategory[0];
        let price = ethers.utils.parseEther(newCategory[1].toString());
        let limit = newCategory[2];
        console.log(newCategory);

        await genesisAirDrop.addCategroy(category, price, limit);

        let quantity = 2;
        let total_pay = ethers.utils.parseEther((newCategory[1] * quantity).toString());
        let gasLimit = 500000 * quantity;
        let overrides = {
            value: total_pay,
            gasLimit: gasLimit
        };
        await genesisAirDrop.claim(category, quantity, overrides);
        const balanceOf1 = await mangoNFT.balanceOf(deployer.address);
        assert.equal(balanceOf1, quantity, 'deployer\'s balance is ' + quantity);

        for (var i = 1; i <= quantity; i++) {
            let expect_token_id = category_counter_start[2] + category_limits[2] + limit + i;
            let tokenId = await mangoNFT.tokenOfOwnerByIndex(deployer.address, i - 1);
            assert.equal(tokenId, expect_token_id, expect_token_id + '\'s id is ' + tokenId + ', but expect ' + expect_token_id);

            let tokenOwner = await mangoNFT.ownerOf(expect_token_id);
            assert.equal(tokenOwner, deployer.address, expect_token_id + '\'s owner is ' + tokenOwner + ', but expect ' + deployer.address);
        }

    });


    it('test add error category', async function () {

        try {
            let index = 0;
            let category = category_names[index];
            let price = ethers.utils.parseEther(category_prices[index].toString());
            let limit = category_limits[index];
            await genesisAirDrop.addCategroy(category, price, limit);
            assert.equal(1, 0, 'GenesisAirDrop contract\'s addCategory function is abnormal');
        }
        catch (ex) {
            assert.equal(1, 1, 'GenesisAirDrop contract\'s addCategory function is normal');
        }

    });

    it('test withdraw', async function () {
        await genesisAirDrop.withdraw(account1.address, 0);
    });

    it('test ERC2.0 withdraw', async function () {

        const balance1 = await sampleERC20Token.balanceOf(genesisAirDrop.address);
        assert.equal(balance1.value, ethers.BigNumber.from(0).value, 'genesisAirDrop\'s ERC20 balance1');

        await sampleERC20Token.mint(genesisAirDrop.address, sampleERC20Token_amount);

        const balance2 = await sampleERC20Token.balanceOf(genesisAirDrop.address);
        assert.equal(balance2.value, ethers.BigNumber.from(sampleERC20Token_amount).value, 'genesisAirDrop\'s ERC20 balance2');

        await genesisAirDrop.withdrawERC20(sampleERC20Token.address, account1.address, sampleERC20Token_amount);
        const balance3 = await sampleERC20Token.balanceOf(genesisAirDrop.address);
        assert.equal(balance3.value, ethers.BigNumber.from(0).value, 'genesisAirDrop\'s ERC20 balance3');

    });
});