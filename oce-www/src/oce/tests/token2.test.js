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
  let new_user;
  let user = "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84";
  beforeAll(async () => {
    const accounts = await oce.web3.eth.getAccounts();
    oce.addAccount(accounts[0]);
    new_user = accounts[1];
    snapshotId = await oce.testing.snapshot();
  });

  beforeEach(async () => {
    await oce.testing.resetEVM("0x2");
  });

  describe("expected fail", () => {
    test("cant transfer from a 0 balance", async () => {
      await oce.testing.expectThrow(oce.contracts.oceV2.methods.transfer(user, "100").send({from: new_user}), "ERC20: transfer amount exceeds balance");
    });
    test("cant transferFrom without allowance", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      await oce.testing.expectThrow(oce.contracts.oceV2.methods.transferFrom(user, new_user, "100").send({from: new_user}), "ERC20: transfer amount exceeds allowance");
    });
    test("!minter", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      await oce.testing.expectThrow(oce.contracts.oceV2.methods.mint(user, "100").send({from: user}), "!minter");
    });
    test("decreaseAllowance from 0", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      await oce.testing.expectThrow(oce.contracts.oceV2.methods.decreaseAllowance(new_user, "100").send({from: user}), "ERC20: decreased allowance below zero");
    });
  });

  describe("non-failing", () => {
    test("name", async () => {
      let name = await oce.contracts.oceV2.methods.name().call();
      expect(name).toBe("OCEv2");
    });
    test("symbol", async () => {
      let symbol = await oce.contracts.oceV2.methods.symbol().call();
      expect(symbol).toBe("OCEv2");
    });
    test("decimals", async () => {
      let decimals = await oce.contracts.oceV2.methods.decimals().call();
      expect(decimals).toBe("24");
    });
    test("totalSupply", async () => {
      let ts = await oce.contracts.oceV2.methods.totalSupply().call();
      expect(ts).toBe("0");
    });
    test("transfer to self doesnt inflate", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      let bal0 = await oce.contracts.oceV2.methods.balanceOf(user).call();
      await oce.contracts.oceV2.methods.transfer(user, "100").send({from: user});
      let bal1 = await oce.contracts.oceV2.methods.balanceOf(user).call();
      expect(bal0).toBe(bal1);
    });
    test("transferFrom works", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      let bal00 = await oce.contracts.oceV2.methods.balanceOf(user).call();
      let bal01 = await oce.contracts.oceV2.methods.balanceOf(new_user).call();
      await oce.contracts.oceV2.methods.approve(new_user, "100").send({from: user});
      await oce.contracts.oceV2.methods.transferFrom(user, new_user, "100").send({from: new_user});
      let bal10 = await oce.contracts.oceV2.methods.balanceOf(user).call();
      let bal11 = await oce.contracts.oceV2.methods.balanceOf(new_user).call();
      expect((oce.toBigN(bal01).plus(oce.toBigN(100))).toString()).toBe(bal11);
      expect((oce.toBigN(bal00).minus(oce.toBigN(100))).toString()).toBe(bal10);
    });
    test("approve", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      await oce.contracts.oceV2.methods.approve(new_user, "100").send({from: user});
      let allowance = await oce.contracts.oceV2.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
    });
    test("increaseAllowance", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      await oce.contracts.oceV2.methods.increaseAllowance(new_user, "100").send({from: user});
      let allowance = await oce.contracts.oceV2.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
    });
    test("decreaseAllowance", async () => {
      await oce.contracts.oce.methods.approve(oce.contracts.oceV2migration.options.address, "10000000000000000000000000000000000").send({from: user, gas: 1000000});
      await oce.contracts.oceV2migration.methods.migrate().send({from: user});
      await oce.contracts.oceV2.methods.increaseAllowance(new_user, "100").send({from: user});
      let allowance = await oce.contracts.oceV2.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
      await oce.contracts.oceV2.methods.decreaseAllowance(new_user, "100").send({from: user});
      allowance = await oce.contracts.oceV2.methods.allowance(user, new_user).call();
      expect(allowance).toBe("0")
    });
  });
});
