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

describe("rebase_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  // let unlocked_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let unlocked_account = "0x681148725731f213b0187a3cbef215c291d85a3e";

  beforeAll(async () => {
    const accounts = await oce.web3.eth.getAccounts();
    oce.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await oce.testing.snapshot();
  });

  beforeEach(async () => {
    await oce.testing.resetEVM("0x2");
    let a = await oce.contracts.ycrv.methods.transfer(user, "2000000000000000000000000").send({
      from: unlocked_account
    });
  });

  describe("rebase", () => {
    test("user has ycrv", async () => {
      let bal0 = await oce.contracts.ycrv.methods.balanceOf(user).call();
      expect(bal0).toBe("2000000000000000000000000");
    });
    test("create pair", async () => {
      await oce.contracts.uni_fact.methods.createPair(
        oce.contracts.ycrv.options.address,
        oce.contracts.oce.options.address
      ).send({
        from: user,
        gas: 8000000
      })
    });
    test("mint pair", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        10000000,
        10000000,
        10000000,
        10000000,
        user,
        1596740361 + 100000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();
      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();
      expect(oce.toBigN(bal).toNumber()).toBeGreaterThan(100)
    });
    test("init_twap", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();
      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(1000);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await oce.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(oce.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(oce.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);
    });
    test("activate rebasing", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();
      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(1000);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await oce.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(oce.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(oce.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);

      await oce.testing.increaseTime(12 * 60 * 60);

      await oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });
    });
    test("positive rebasing", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();

      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(43200);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await oce.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      let res_bal = await oce.contracts.oce.methods.balanceOf(
          oce.contracts.reserves.options.address
      ).call();

      expect(res_bal).toBe("0");

      bal = await oce.contracts.oce.methods.balanceOf(user).call();

      let a = await oce.web3.eth.getBlock('latest');

      let offset = await oce.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = oce.toBigN(offset).toNumber();
      let interval = await oce.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = oce.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await oce.testing.increaseTime(i);

      let r = await oce.contracts.uni_pair.methods.getReserves().call();
      let q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre positive rebase", q);

      let b = await oce.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("positive rebase gas used:", b["gasUsed"]);

      let bal1 = await oce.contracts.oce.methods.balanceOf(user).call();

      let resOCE = await oce.contracts.oce.methods.balanceOf(oce.contracts.reserves.options.address).call();

      let resycrv = await oce.contracts.ycrv.methods.balanceOf(oce.contracts.reserves.options.address).call();

      console.log("bal user, bal oce res, bal res crv", bal1, resOCE, resycrv);
      r = await oce.contracts.uni_pair.methods.getReserves().call();
      q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("post positive rebase quote", q);

      // new balance > old balance
      expect(oce.toBigN(bal).toNumber()).toBeLessThan(oce.toBigN(bal1).toNumber());
      // used full oce reserves
      expect(oce.toBigN(resOCE).toNumber()).toBe(0);
      // increases reserves
      expect(oce.toBigN(resycrv).toNumber()).toBeGreaterThan(0);


      // not below peg
      expect(oce.toBigN(q).toNumber()).toBeGreaterThan(oce.toBigN(10**18).toNumber());
    });
    test("negative rebasing", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();

      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(43200);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await oce.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await oce.contracts.oce.methods.balanceOf(user).call();

      let a = await oce.web3.eth.getBlock('latest');

      let offset = await oce.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = oce.toBigN(offset).toNumber();
      let interval = await oce.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = oce.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await oce.testing.increaseTime(i);

      let r = await oce.contracts.uni_pair.methods.getReserves().call();
      let q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre negative rebase", q);

      let b = await oce.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("negative rebase gas used:", b["gasUsed"]);

      let bal1 = await oce.contracts.oce.methods.balanceOf(user).call();

      let resoce = await oce.contracts.oce.methods.balanceOf(oce.contracts.reserves.options.address).call();

      let resycrv = await oce.contracts.ycrv.methods.balanceOf(oce.contracts.reserves.options.address).call();

      // balance decreases
      expect(oce.toBigN(bal1).toNumber()).toBeLessThan(oce.toBigN(bal).toNumber());
      // no increases to reserves
      expect(oce.toBigN(resOCE).toNumber()).toBe(0);
      expect(oce.toBigN(resycrv).toNumber()).toBe(0);
    });
    test("no rebasing", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();

      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(43200);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await oce.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await oce.contracts.oce.methods.balanceOf(user).call();

      let a = await oce.web3.eth.getBlock('latest');

      let offset = await oce.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = oce.toBigN(offset).toNumber();
      let interval = await oce.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = oce.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await oce.testing.increaseTime(i);

      let r = await oce.contracts.uni_pair.methods.getReserves().call();
      console.log(r, r[0], r[1]);
      let q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre no rebase", q);
      let b = await oce.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      console.log("no rebase gas used:", b["gasUsed"]);

      let bal1 = await oce.contracts.oce.methods.balanceOf(user).call();

      let resOCE = await oce.contracts.oce.methods.balanceOf(oce.contracts.reserves.options.address).call();

      let resycrv = await oce.contracts.ycrv.methods.balanceOf(oce.contracts.reserves.options.address).call();

      // no change
      expect(oce.toBigN(bal1).toNumber()).toBe(oce.toBigN(bal).toNumber());
      // no increases to reserves
      expect(oce.toBigN(resOCE).toNumber()).toBe(0);
      expect(oce.toBigN(resycrv).toNumber()).toBe(0);
      r = await oce.contracts.uni_pair.methods.getReserves().call();
      q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post no rebase", q);
    });
    test("rebasing with OCE in reserves", async () => {
      await oce.contracts.oce.methods.transfer(oce.contracts.reserves.options.address, oce.toBigN(60000*10**18).toString()).send({from: user});
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();

      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(43200);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await oce.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await oce.contracts.oce.methods.balanceOf(user).call();

      let a = await oce.web3.eth.getBlock('latest');

      let offset = await oce.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = oce.toBigN(offset).toNumber();
      let interval = await oce.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = oce.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await oce.testing.increaseTime(i);


      let r = await oce.contracts.uni_pair.methods.getReserves().call();
      let q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre pos rebase with reserves", q);

      let b = await oce.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });
      //console.log(b.events)

      console.log("positive  with reserves gas used:", b["gasUsed"]);

      let bal1 = await oce.contracts.oce.methods.balanceOf(user).call();

      let resOCE = await oce.contracts.oce.methods.balanceOf(oce.contracts.reserves.options.address).call();

      let resycrv = await oce.contracts.ycrv.methods.balanceOf(oce.contracts.reserves.options.address).call();

      console.log(bal, bal1, resOCE, resycrv);
      expect(oce.toBigN(bal).toNumber()).toBeLessThan(oce.toBigN(bal1).toNumber());
      expect(oce.toBigN(resOCE).toNumber()).toBeGreaterThan(0);
      expect(oce.toBigN(resycrv).toNumber()).toBeGreaterThan(0);
      r = await oce.contracts.uni_pair.methods.getReserves().call();
      q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post rebase w/ reserves", q);
      expect(oce.toBigN(q).toNumber()).toBeGreaterThan(oce.toBigN(10**18).toNumber());
    });
  });

  describe("failing", () => {
    test("unitialized rebasing", async () => {
      await oce.testing.expectThrow(oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      }), "twap wasnt intitiated, call init_twap()");
    });
    test("no early twap", async () => {
      await oce.testing.expectThrow(oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      }), "");
    });
    test("too late rebasing", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();

      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(43200);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await oce.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await oce.contracts.oce.methods.balanceOf(user).call();

      let a = await oce.web3.eth.getBlock('latest');

      let offset = await oce.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = oce.toBigN(offset).toNumber();
      let interval = await oce.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = oce.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      let len = await oce.contracts.rebaser.methods.rebaseWindowLengthSec().call();

      await oce.testing.increaseTime(i + oce.toBigN(len).toNumber()+1);

      let b = await oce.testing.expectThrow(oce.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too late");
    });
    test("too early rebasing", async () => {
      await oce.contracts.oce.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await oce.contracts.ycrv.methods.approve(
        oce.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await oce.contracts.uni_router.methods.addLiquidity(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await oce.contracts.uni_fact.methods.getPair(
        oce.contracts.oce.options.address,
        oce.contracts.ycrv.options.address
      ).call();

      oce.contracts.uni_pair.options.address = pair;
      let bal = await oce.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await oce.testing.increaseTime(43200);

      await oce.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await oce.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await oce.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await oce.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          oce.contracts.ycrv.options.address,
          oce.contracts.oce.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await oce.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });

      bal = await oce.contracts.oce.methods.balanceOf(user).call();

      let a = await oce.web3.eth.getBlock('latest');

      let offset = await oce.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = oce.toBigN(offset).toNumber();
      let interval = await oce.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = oce.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await oce.testing.increaseTime(i - 1);



      let b = await oce.testing.expectThrow(oce.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too early");
    });
  });
});
