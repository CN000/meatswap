import {
  Oce
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const oce = new Oce(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
    defaultAccount: "",
    defaultConfirmations: 1,
    autoGasMultiplier: 1.5,
    testing: false,
    defaultGas: "6000000",
    defaultGasPrice: "1000000000000",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("token_tests", () => {
  let snapshotId;
  let user = "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84";
  let new_user;
  beforeAll(async () => {
    const accounts = await oce.web3.eth.getAccounts();
    oce.addAccount(accounts[0]);
    new_user = accounts[1];
    snapshotId = await oce.testing.snapshot();
  });

  beforeEach(async () => {
    await oce.testing.resetEVM("0x2");
  });

  // describe("expected fail", () => {
  //   test("before start", async () => {
  //     await oce.testing.resetEVM("0x2");
  //     let startTime = await oce.contracts.oceV2migration.methods.startTime().call();
  //     let timeNow = oce.toBigN((await oce.web3.eth.getBlock('latest'))["timestamp"]);
  //     let waitTime = oce.toBigN(startTime).minus(timeNow);
  //     if (waitTime <= 0) {
  //       // this test is hard to run on ganache as there is no easy way to
  //       // ensure that another test hasnt increased the time already
  //       console.log("WARNING: TEST CANNOT OCCUR DUE TO GANACHE TIMING");
  //     } else {
  //       await oce.testing.expectThrow(oce.contracts.oceV2migration.methods.migrate().send({from: user}), "!started");
  //     }
  //   });
  //   test("user 0 balance", async () => {
  //     // fast forward to startTime
  //     let startTime = await oce.contracts.oceV2migration.methods.startTime().call();
  //     let timeNow = oce.toBigN((await oce.web3.eth.getBlock('latest'))["timestamp"]);
  //     let waitTime = oce.toBigN(startTime).minus(timeNow);
  //     if (waitTime.toNumber() > 0) {
  //       await oce.testing.increaseTime(waitTime.toNumber());
  //     }
  //     await oce.testing.expectThrow(oce.contracts.oceV2migration.methods.migrate().send({from: new_user}), "No oces");
  //   });
  //   test("after end", async () => {
  //     // increase time
  //     let startTime = await oce.contracts.oceV2migration.methods.startTime().call();
  //     let migrationDuration = await oce.contracts.oceV2migration.methods.migrationDuration().call();
  //     let timeNow = oce.toBigN((await oce.web3.eth.getBlock('latest'))["timestamp"]);
  //     let waitTime = oce.toBigN(startTime).plus(oce.toBigN(migrationDuration)).minus(timeNow);
  //     if (waitTime.toNumber() > 0) {
  //       await oce.testing.increaseTime(waitTime.toNumber());
  //     }
  //     // expect fail
  //     await oce.testing.expectThrow(oce.contracts.oceV2migration.methods.migrate().send({from: user}), "migration ended");
  //   });
  //   test("double migrate", async () => {
  //     await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
  //     await oce.contracts.oceV2migration.methods.migrate().send({from: user, gas: 1000000});
  //     let oce_bal = oce.toBigN(await oce.contracts.oce.methods.balanceOfUnderlying(user).call()).toNumber();
  //     await oce.testing.expectThrow(oce.contracts.oceV2migration.methods.migrate().send({from: user, gas: 1000000}), "No oces");
  //   });
  // });

  describe("non-failing", () => {
    test("zeros balance", async () => {
      let startTime = await oce.contracts.oceV2migration.methods.startTime().call();
      let timeNow = oce.toBigN((await oce.web3.eth.getBlock('latest'))["timestamp"]);
      let waitTime = oce.toBigN(startTime).minus(timeNow);
      if (waitTime.toNumber() > 0) {
        await oce.testing.increaseTime(waitTime.toNumber());
      }
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user, gas: 1000000});
      let oce_bal = oce.toBigN(await oce.contracts.oce.methods.balanceOf(user).call()).toNumber();
      expect(oce_bal).toBe(0);
    });
    test("v2 balance equal to v1 underlying balance", async () => {
      let startTime = await oce.contracts.oceV2migration.methods.startTime().call();
      let timeNow = oce.toBigN((await oce.web3.eth.getBlock('latest'))["timestamp"]);
      let waitTime = oce.toBigN(startTime).minus(timeNow);
      if (waitTime.toNumber() > 0) {
        await oce.testing.increaseTime(waitTime.toNumber());
      }
      let oce_bal = oce.toBigN(await oce.contracts.oce.methods.balanceOfUnderlying(user).call());
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user, gas: 1000000});
      let oceV2_bal = oce.toBigN(await oce.contracts.oceV2.methods.balanceOf(user).call());
      expect(oce_bal.toString()).toBe(oceV2_bal.toString());
    });
    test("totalSupply increase equal to oce_underlying_bal", async () => {
      let startTime = await oce.contracts.oceV2migration.methods.startTime().call();
      let timeNow = oce.toBigN((await oce.web3.eth.getBlock('latest'))["timestamp"]);
      let waitTime = oce.toBigN(startTime).minus(timeNow);
      if (waitTime.toNumber() > 0) {
        await oce.testing.increaseTime(waitTime.toNumber());
      }
      let oce_underlying_bal = oce.toBigN(await oce.contracts.oce.methods.balanceOfUnderlying(user).call());
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user, gas: 1000000});
      let oceV2_ts = oce.toBigN(await oce.contracts.oceV2.methods.totalSupply().call());
      expect(oceV2_ts.toString()).toBe(oce_underlying_bal.toString());
    });
  });
});
