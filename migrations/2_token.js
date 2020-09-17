// ============ Contracts ============

// Token
// deployed first
const OCEImplementation = artifacts.require("OCEDelegate");
const OCEProxy = artifacts.require("OCEDelegator");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
  await deployer.deploy(OCEImplementation);
  if (network != "mainnet") {
    await deployer.deploy(OCEProxy,
      "OCE",
      "OCE",
      18,
      "9000000000000000000000000", // print extra few mil for user
      OCEImplementation.address,
      "0x"
    );
  } else {
    await deployer.deploy(OCEProxy,
      "OCE",
      "OCE",
      18,
      "2000000000000000000000000",
      OCEImplementation.address,
      "0x"
    );
  }
}