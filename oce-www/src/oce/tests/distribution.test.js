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
    defaultGasPrice: "1",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("Distribution", () => {
  let snapshotId;
  let user;
  let user2;
  let ycrv_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let weth_account = "0xf9e11762d522ea29dd78178c9baf83b7b093aacc";
  let uni_ampl_account = "0x8c545be506a335e24145edd6e01d2754296ff018";
  let comp_account = "0xc89b6f0146642688bb254bf93c28fccf1e182c81";
  let lend_account = "0x3b08aa814bea604917418a9f0907e7fc430e742c";
  let link_account = "0xbe6977e08d4479c0a6777539ae0e8fa27be4e9d6";
  let mkr_account = "0xf37216a8ac034d08b4663108d7532dfcb44583ed";
  let snx_account = "0xb696d629cd0a00560151a434f6b4478ad6c228d7"
  let yfi_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  beforeAll(async () => {
    const accounts = await oce.web3.eth.getAccounts();
    oce.addAccount(accounts[0]);
    user = accounts[0];
    oce.addAccount(accounts[1]);
    user2 = accounts[1];
    snapshotId = await oce.testing.snapshot();
  });

  beforeEach(async () => {
    await oce.testing.resetEVM("0x2");
  });

  describe("pool failures", () => {
    test("cant join pool 1s early", async () => {
      await oce.testing.resetEVM("0x2");
      let a = await oce.web3.eth.getBlock('latest');

      let starttime = await oce.contracts.eth_pool.methods.starttime().call();

      expect(oce.toBigN(a["timestamp"]).toNumber()).toBeLessThan(oce.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);
      await oce.contracts.weth.methods.approve(oce.contracts.eth_pool.options.address, -1).send({from: user});

      await oce.testing.expectThrow(
        oce.contracts.eth_pool.methods.stake(
          oce.toBigN(200).times(oce.toBigN(10**18)).toString()
        ).send({
          from: user,
          gas: 300000
        })
      , "not start");


      a = await oce.web3.eth.getBlock('latest');

      starttime = await oce.contracts.ampl_pool.methods.starttime().call();

      expect(oce.toBigN(a["timestamp"]).toNumber()).toBeLessThan(oce.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);

      await oce.contracts.UNIAmpl.methods.approve(oce.contracts.ampl_pool.options.address, -1).send({from: user});

      await oce.testing.expectThrow(oce.contracts.ampl_pool.methods.stake(
        "5016536322915819"
      ).send({
        from: user,
        gas: 300000
      }), "not start");
    });

    test("cant join pool 2 early", async () => {

    });

    test("cant withdraw more than deposited", async () => {
      await oce.testing.resetEVM("0x2");
      let a = await oce.web3.eth.getBlock('latest');

      await oce.contracts.weth.methods.transfer(user, oce.toBigN(2000).times(oce.toBigN(10**18)).toString()).send({
        from: weth_account
      });
      await oce.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
        from: uni_ampl_account
      });

      let starttime = await oce.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await oce.testing.increaseTime(waittime);
      }

      await oce.contracts.weth.methods.approve(oce.contracts.eth_pool.options.address, -1).send({from: user});

      await oce.contracts.eth_pool.methods.stake(
        oce.toBigN(200).times(oce.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      });

      await oce.contracts.UNIAmpl.methods.approve(oce.contracts.ampl_pool.options.address, -1).send({from: user});

      await oce.contracts.ampl_pool.methods.stake(
        "5000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      await oce.testing.expectThrow(oce.contracts.ampl_pool.methods.withdraw(
        "5016536322915820"
      ).send({
        from: user,
        gas: 300000
      }), "");

      await oce.testing.expectThrow(oce.contracts.eth_pool.methods.withdraw(
        oce.toBigN(201).times(oce.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      }), "");

    });
  });

  describe("incentivizer pool", () => {
    test("joining and exiting", async() => {
      await oce.testing.resetEVM("0x2");

      await oce.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
        from: ycrv_account
      });

      await oce.contracts.weth.methods.transfer(user, oce.toBigN(2000).times(oce.toBigN(10**18)).toString()).send({
        from: weth_account
      });

      let a = await oce.web3.eth.getBlock('latest');

      let starttime = await oce.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await oce.testing.increaseTime(waittime);
      } else {
        console.log("late entry", waittime)
      }

      await oce.contracts.weth.methods.approve(oce.contracts.eth_pool.options.address, -1).send({from: user});

      await oce.contracts.eth_pool.methods.stake(
        "2000000000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      let earned = await oce.contracts.eth_pool.methods.earned(user).call();

      let rr = await oce.contracts.eth_pool.methods.rewardRate().call();

      let rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();
      //console.log(earned, rr, rpt);
      await oce.testing.increaseTime(86400);
      // await oce.testing.mineBlock();

      earned = await oce.contracts.eth_pool.methods.earned(user).call();

      rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();

      let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

      console.log(earned, ysf, rpt);

      let j = await oce.contracts.eth_pool.methods.getReward().send({
        from: user,
        gas: 300000
      });

      let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

      console.log("oce bal", oce_bal)
      // start rebasing
        //console.log("approve oce")
        await oce.contracts.oce.methods.approve(
          oce.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });
        //console.log("approve ycrv")
        await oce.contracts.ycrv.methods.approve(
          oce.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });

        let ycrv_bal = await oce.contracts.ycrv.methods.balanceOf(user).call()

        console.log("ycrv_bal bal", ycrv_bal)

        console.log("add liq/ create pool")
        await oce.contracts.uni_router.methods.addLiquidity(
          oce.contracts.oce.options.address,
          oce.contracts.ycrv.options.address,
          oce_bal,
          oce_bal,
          oce_bal,
          oce_bal,
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

        await oce.contracts.uni_pair.methods.approve(
          oce.contracts.ycrv_pool.options.address,
          -1
        ).send({
          from: user,
          gas: 300000
        });

        starttime = await oce.contracts.ycrv_pool.methods.starttime().call();

        a = await oce.web3.eth.getBlock('latest');

        waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry, pool 2", waittime)
        }

        await oce.contracts.ycrv_pool.methods.stake(bal).send({from: user, gas: 400000});


        earned = await oce.contracts.ampl_pool.methods.earned(user).call();

        rr = await oce.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await oce.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await oce.testing.increaseTime(625000 + 1000);

        earned = await oce.contracts.ampl_pool.methods.earned(user).call();

        rr = await oce.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await oce.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await oce.contracts.ycrv_pool.methods.exit().send({from: user, gas: 400000});

        oce_bal = await oce.contracts.oce.methods.balanceOf(user).call();


        expect(oce.toBigN(oce_bal).toNumber()).toBeGreaterThan(0)
        console.log("oce bal after staking in pool 2", oce_bal);
    });
  });

  describe("ampl", () => {
    test("rewards from pool 1s ampl", async () => {
        await oce.testing.resetEVM("0x2");

        await oce.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
          from: uni_ampl_account
        });
        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          //console.log("missed entry");
        }

        await oce.contracts.UNIAmpl.methods.approve(oce.contracts.ampl_pool.options.address, -1).send({from: user});

        await oce.contracts.ampl_pool.methods.stake(
          "5000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.ampl_pool.methods.earned(user).call();

        let rr = await oce.contracts.ampl_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.ampl_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.ampl_pool.methods.earned(user).call();

        rpt = await oce.contracts.ampl_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.ampl_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        // let k = await oce.contracts.eth_pool.methods.exit().send({
        //   from: user,
        //   gas: 300000
        // });
        //
        // //console.log(k.events)

        // weth_bal = await oce.contracts.weth.methods.balanceOf(user).call()

        // expect(weth_bal).toBe(oce.toBigN(2000).times(oce.toBigN(10**18)).toString())

        let ampl_bal = await oce.contracts.UNIAmpl.methods.balanceOf(user).call()

        expect(ampl_bal).toBe("5000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("eth", () => {
    test("rewards from pool 1s eth", async () => {
        await oce.testing.resetEVM("0x2");

        await oce.contracts.weth.methods.transfer(user, oce.toBigN(2000).times(oce.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.weth.methods.approve(oce.contracts.eth_pool.options.address, -1).send({from: user});

        await oce.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.eth_pool.methods.earned(user).call();

        let rr = await oce.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.eth_pool.methods.earned(user).call();

        rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await oce.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
    test("rewards from pool 1s eth with rebase", async () => {
        await oce.testing.resetEVM("0x2");

        await oce.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await oce.contracts.weth.methods.transfer(user, oce.toBigN(2000).times(oce.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.weth.methods.approve(oce.contracts.eth_pool.options.address, -1).send({from: user});

        await oce.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.eth_pool.methods.earned(user).call();

        let rr = await oce.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(125000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.eth_pool.methods.earned(user).call();

        rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await oce.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        console.log("oce bal", oce_bal)
        // start rebasing
          //console.log("approve oce")
          await oce.contracts.oce.methods.approve(
            oce.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await oce.contracts.ycrv.methods.approve(
            oce.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await oce.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          console.log("add liq/ create pool")
          await oce.contracts.uni_router.methods.addLiquidity(
            oce.contracts.oce.options.address,
            oce.contracts.ycrv.options.address,
            oce_bal,
            oce_bal,
            oce_bal,
            oce_bal,
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
          //console.log("init swap")
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await oce.contracts.uni_router.methods.swapExactTokensForTokens(
            "10000000000000000",
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

          await oce.testing.increaseTime(43200);

          //console.log("init twap")
          await oce.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await oce.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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
          //console.log("second swap")
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

          a = await oce.web3.eth.getBlock('latest');

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

          let bal1 = await oce.contracts.oce.methods.balanceOf(user).call();

          let resoce = await oce.contracts.oce.methods.balanceOf(oce.contracts.reserves.options.address).call();

          let resycrv = await oce.contracts.ycrv.methods.balanceOf(oce.contracts.reserves.options.address).call();

          // new balance > old balance
          expect(oce.toBigN(bal).toNumber()).toBeLessThan(oce.toBigN(bal1).toNumber());
          // increases reserves
          expect(oce.toBigN(resycrv).toNumber()).toBeGreaterThan(0);

          r = await oce.contracts.uni_pair.methods.getReserves().call();
          q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(oce.toBigN(q).toNumber()).toBeGreaterThan(oce.toBigN(10**18).toNumber());


        await oce.testing.increaseTime(525000 + 100);


        j = await oce.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await oce.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(
          oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toNumber()
        ).toBeGreaterThan(two_fity.toNumber())
    });
    test("rewards from pool 1s eth with negative rebase", async () => {
        await oce.testing.resetEVM("0x2");

        await oce.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await oce.contracts.weth.methods.transfer(user, oce.toBigN(2000).times(oce.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.weth.methods.approve(oce.contracts.eth_pool.options.address, -1).send({from: user});

        await oce.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.eth_pool.methods.earned(user).call();

        let rr = await oce.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(125000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.eth_pool.methods.earned(user).call();

        rpt = await oce.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await oce.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        console.log("oce bal", oce_bal)
        // start rebasing
          //console.log("approve oce")
          await oce.contracts.oce.methods.approve(
            oce.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await oce.contracts.ycrv.methods.approve(
            oce.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await oce.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          oce_bal = oce.toBigN(oce_bal);
          console.log("add liq/ create pool")
          await oce.contracts.uni_router.methods.addLiquidity(
            oce.contracts.oce.options.address,
            oce.contracts.ycrv.options.address,
            oce_bal.times(.1).toString(),
            oce_bal.times(.1).toString(),
            oce_bal.times(.1).toString(),
            oce_bal.times(.1).toString(),
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
          //console.log("init swap")
          await oce.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await oce.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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

          //console.log("init twap")
          await oce.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await oce.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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
          //console.log("second swap")
          await oce.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000",
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

          a = await oce.web3.eth.getBlock('latest');

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

          let bal1 = await oce.contracts.oce.methods.balanceOf(user).call();

          let resoce = await oce.contracts.oce.methods.balanceOf(oce.contracts.reserves.options.address).call();

          let resycrv = await oce.contracts.ycrv.methods.balanceOf(oce.contracts.reserves.options.address).call();

          expect(oce.toBigN(bal1).toNumber()).toBeLessThan(oce.toBigN(bal).toNumber());
          expect(oce.toBigN(resycrv).toNumber()).toBe(0);

          r = await oce.contracts.uni_pair.methods.getReserves().call();
          q = await oce.contracts.uni_router.methods.quote(oce.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(oce.toBigN(q).toNumber()).toBeLessThan(oce.toBigN(10**18).toNumber());


        await oce.testing.increaseTime(525000 + 100);


        j = await oce.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await oce.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(
          oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toNumber()
        ).toBeLessThan(two_fity.toNumber())
    });
  });

  describe("yfi", () => {
    test("rewards from pool 1s yfi", async () => {
        await oce.testing.resetEVM("0x2");
        await oce.contracts.yfi.methods.transfer(user, "500000000000000000000").send({
          from: yfi_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.yfi_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.yfi.methods.approve(oce.contracts.yfi_pool.options.address, -1).send({from: user});

        await oce.contracts.yfi_pool.methods.stake(
          "500000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.yfi_pool.methods.earned(user).call();

        let rr = await oce.contracts.yfi_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.yfi_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.yfi_pool.methods.earned(user).call();

        rpt = await oce.contracts.yfi_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.yfi_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await oce.contracts.yfi.methods.balanceOf(user).call()

        expect(weth_bal).toBe("500000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("comp", () => {
    test("rewards from pool 1s comp", async () => {
        await oce.testing.resetEVM("0x2");
        await oce.contracts.comp.methods.transfer(user, "50000000000000000000000").send({
          from: comp_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.comp_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.comp.methods.approve(oce.contracts.comp_pool.options.address, -1).send({from: user});

        await oce.contracts.comp_pool.methods.stake(
          "50000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.comp_pool.methods.earned(user).call();

        let rr = await oce.contracts.comp_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.comp_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.comp_pool.methods.earned(user).call();

        rpt = await oce.contracts.comp_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.comp_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await oce.contracts.comp.methods.balanceOf(user).call()

        expect(weth_bal).toBe("50000000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("lend", () => {
    test("rewards from pool 1s lend", async () => {
        await oce.testing.resetEVM("0x2");
        await oce.web3.eth.sendTransaction({from: user2, to: lend_account, value : oce.toBigN(100000*10**18).toString()});

        await oce.contracts.lend.methods.transfer(user, "10000000000000000000000000").send({
          from: lend_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.lend_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.lend.methods.approve(oce.contracts.lend_pool.options.address, -1).send({from: user});

        await oce.contracts.lend_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.lend_pool.methods.earned(user).call();

        let rr = await oce.contracts.lend_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.lend_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.lend_pool.methods.earned(user).call();

        rpt = await oce.contracts.lend_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.lend_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await oce.contracts.lend.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("link", () => {
    test("rewards from pool 1s link", async () => {
        await oce.testing.resetEVM("0x2");

        await oce.web3.eth.sendTransaction({from: user2, to: link_account, value : oce.toBigN(100000*10**18).toString()});

        await oce.contracts.link.methods.transfer(user, "10000000000000000000000000").send({
          from: link_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.link_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.link.methods.approve(oce.contracts.link_pool.options.address, -1).send({from: user});

        await oce.contracts.link_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.link_pool.methods.earned(user).call();

        let rr = await oce.contracts.link_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.link_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.link_pool.methods.earned(user).call();

        rpt = await oce.contracts.link_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.link_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await oce.contracts.link.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("mkr", () => {
    test("rewards from pool 1s mkr", async () => {
        await oce.testing.resetEVM("0x2");
        await oce.web3.eth.sendTransaction({from: user2, to: mkr_account, value : oce.toBigN(100000*10**18).toString()});
        let eth_bal = await oce.web3.eth.getBalance(mkr_account);

        await oce.contracts.mkr.methods.transfer(user, "10000000000000000000000").send({
          from: mkr_account
        });

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.mkr_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.mkr.methods.approve(oce.contracts.mkr_pool.options.address, -1).send({from: user});

        await oce.contracts.mkr_pool.methods.stake(
          "10000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.mkr_pool.methods.earned(user).call();

        let rr = await oce.contracts.mkr_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.mkr_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.mkr_pool.methods.earned(user).call();

        rpt = await oce.contracts.mkr_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.mkr_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await oce.contracts.mkr.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000")


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("snx", () => {
    test("rewards from pool 1s snx", async () => {
        await oce.testing.resetEVM("0x2");

        await oce.web3.eth.sendTransaction({from: user2, to: snx_account, value : oce.toBigN(100000*10**18).toString()});

        let snx_bal = await oce.contracts.snx.methods.balanceOf(snx_account).call();

        console.log(snx_bal)

        await oce.contracts.snx.methods.transfer(user, snx_bal).send({
          from: snx_account
        });

        snx_bal = await oce.contracts.snx.methods.balanceOf(user).call();

        console.log(snx_bal)

        let a = await oce.web3.eth.getBlock('latest');

        let starttime = await oce.contracts.snx_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await oce.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await oce.contracts.snx.methods.approve(oce.contracts.snx_pool.options.address, -1).send({from: user});

        await oce.contracts.snx_pool.methods.stake(
          snx_bal
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await oce.contracts.snx_pool.methods.earned(user).call();

        let rr = await oce.contracts.snx_pool.methods.rewardRate().call();

        let rpt = await oce.contracts.snx_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await oce.testing.increaseTime(625000 + 100);
        // await oce.testing.mineBlock();

        earned = await oce.contracts.snx_pool.methods.earned(user).call();

        rpt = await oce.contracts.snx_pool.methods.rewardPerToken().call();

        let ysf = await oce.contracts.oce.methods.ocesScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let oce_bal = await oce.contracts.oce.methods.balanceOf(user).call()

        let j = await oce.contracts.snx_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await oce.contracts.snx.methods.balanceOf(user).call()

        expect(weth_bal).toBe(snx_bal)


        let oce_bal2 = await oce.contracts.oce.methods.balanceOf(user).call()

        let two_fity = oce.toBigN(250).times(oce.toBigN(10**3)).times(oce.toBigN(10**18))
        expect(oce.toBigN(oce_bal2).minus(oce.toBigN(oce_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });
})
