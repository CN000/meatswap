// ============ Contracts ============

// Token
// deployed first
const OCEImplementation = artifacts.require("OCEDelegate");
const OCEProxy = artifacts.require("OCEDelegator");

// Rs
// deployed second
const OCEReserves = artifacts.require("OCEReserves");
const OCERebaser = artifacts.require("OCERebaser");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRs(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployRs(deployer, network) {
  let reserveToken    = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
  let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  await deployer.deploy(OCEReserves, reserveToken, OCEProxy.address);
  await deployer.deploy(OCERebaser,
      OCEProxy.address,
      reserveToken,
      uniswap_factory,
      OCEReserves.address
  );
  let rebase = new web3.eth.Contract(OCERebaser.abi, OCERebaser.address);

  let pair = await rebase.methods.uniswap_pair().call();
  console.log(pair)
  let oce = await OCEProxy.deployed();
  await oce._setRebaser(OCERebaser.address);
  let reserves = await OCEReserves.deployed();
  await reserves._setRebaser(OCERebaser.address)
}
