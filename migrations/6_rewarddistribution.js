var fs = require('fs')

// ============ Contracts ============


// Protocol
// deployed second
const OCEImplementation = artifacts.require("OCEDelegate");
const OCEProxy = artifacts.require("OCEDelegator");

// deployed third
const OCEReserves = artifacts.require("OCEReserves");
const OCERebaser = artifacts.require("OCERebaser");

const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");

// deployed fourth
const OCE_ETHPool = artifacts.require("OCEETHPool");
//const OCE_USDTPool = artifacts.require("OCEUSDTPool");
const OCE_AMPLPool = artifacts.require("OCEAMPLPool");
const OCE_YFIPool = artifacts.require("OCEYFIPool");
const OCE_LINKPool = artifacts.require("OCELINKPool");
const OCE_MKRPool = artifacts.require("OCEMKRPool");
const OCE_LENDPool = artifacts.require("OCELENDPool");
const OCE_COMPPool = artifacts.require("OCECOMPPool");
const OCE_SNXPool = artifacts.require("OCESNXPool");


// deployed fifth
const OCEIncentivizer = artifacts.require("OCEIncentivizer");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ]);
}

module.exports = migration;

// ============ Deploy Functions ============


async function deployDistribution(deployer, network, accounts) {
  console.log(network)
  let oce = await OCEProxy.deployed();
  let yReserves = await OCEReserves.deployed()
  let yRebaser = await OCERebaser.deployed()
  let tl = await Timelock.deployed();
  let gov = await Gov.deployed();
  if (network != "test") {

    let eth_pool = new web3.eth.Contract(OCE_ETHPool.abi, OCE_ETHPool.address);
    //let usdt_pool = new web3.eth.Contract(OCE_USDTPool.abi, OCE_USDTPool.address);
    let ampl_pool = new web3.eth.Contract(OCE_AMPLPool.abi, OCE_AMPLPool.address);
    let yfi_pool = new web3.eth.Contract(OCE_YFIPool.abi, OCE_YFIPool.address);
    let lend_pool = new web3.eth.Contract(OCE_LENDPool.abi, OCE_LENDPool.address);
    let mkr_pool = new web3.eth.Contract(OCE_MKRPool.abi, OCE_MKRPool.address);
    let snx_pool = new web3.eth.Contract(OCE_SNXPool.abi, OCE_SNXPool.address);
    let comp_pool = new web3.eth.Contract(OCE_COMPPool.abi, OCE_COMPPool.address);
    let link_pool = new web3.eth.Contract(OCE_LINKPool.abi, OCE_LINKPool.address);
    let ycrv_pool = new web3.eth.Contract(OCEIncentivizer.abi, OCEIncentivizer.address);

    console.log("setting distributor");
    await Promise.all([
        eth_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        ampl_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        yfi_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        ycrv_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        lend_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        mkr_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        snx_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        comp_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        link_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
        ycrv_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
       // usdt_pool.methods.setRewardDistribution("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
    ]);

    let two_fifty = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(250));
    let one_five = two_fifty.mul(web3.utils.toBN(6));

    console.log("transfering and notifying");
    console.log("eth");

    await Promise.all([
      oce.transfer(OCE_ETHPool.address,   two_fifty.toString()),
      //oce.transfer(OCE_USDTPool.address,   two_fifty.toString()),
      oce.transfer(OCE_AMPLPool.address, two_fifty.toString()),
      oce.transfer(OCE_YFIPool.address,   two_fifty.toString()),
      oce.transfer(OCE_LENDPool.address,  two_fifty.toString()),
      oce.transfer(OCE_MKRPool.address,   two_fifty.toString()),
      oce.transfer(OCE_SNXPool.address,   two_fifty.toString()),
      oce.transfer(OCE_COMPPool.address,  two_fifty.toString()),
      oce.transfer(OCE_LINKPool.address,  two_fifty.toString()),
      oce._setIncentivizer(OCEIncentivizer.address),
    ]);

    await Promise.all([
      eth_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      //usdt_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      ampl_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      yfi_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      lend_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      mkr_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      snx_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      comp_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),
      link_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:"0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD"}),

      // incentives is a minter and prepopulates itself.
      ycrv_pool.methods.notifyRewardAmount("0").send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 500000}),
    ]);

    await Promise.all([
      eth_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      //usdt_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      ampl_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      yfi_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      lend_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      mkr_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      snx_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      comp_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      link_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      ycrv_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
    ]);

    await Promise.all([
      eth_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      ampl_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      yfi_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      lend_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      mkr_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      snx_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      comp_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      link_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
      ycrv_pool.methods.transferOwnership(Timelock.address).send({from: "0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD", gas: 100000}),
    ]);
  }

  await Promise.all([
    oce._setPendingGov(Timelock.address),
    yReserves._setPendingGov(Timelock.address),
    yRebaser._setPendingGov(Timelock.address),
  ]);

  await Promise.all([
      tl.executeTransaction(
        OCEProxy.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        OCEReserves.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        OCERebaser.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),
  ]);
  await tl.setPendingAdmin(Gov.address);
  await gov.__acceptAdmin();
  await gov.__abdicate();
}
