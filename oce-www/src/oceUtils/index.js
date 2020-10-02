import {ethers} from 'ethers'

import BigNumber from 'bignumber.js'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
});

const GAS_LIMIT = {
  STAKING: {
    DEFAULT: 200000,
    SNX: 850000,
  }
};

export const getPoolStartTime = async (poolContract) => {
  return await poolContract.methods.starttime().call()
}

export const stake = async (poolContract, amount, account, tokenName) => {
  let now = new Date().getTime() / 1000;
  const gas = GAS_LIMIT.STAKING[tokenName.toUpperCase()] || GAS_LIMIT.STAKING.DEFAULT;
  if (now >= 1597172400) {
    return poolContract.methods
      .stake((new BigNumber(amount).times(new BigNumber(10).pow(18))).toString())
      .send({ from: account, gas })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const unstake = async (poolContract, amount, account) => {
  let now = new Date().getTime() / 1000;
  if (now >= 1597172400) {
    return poolContract.methods
      .withdraw((new BigNumber(amount).times(new BigNumber(10).pow(18))).toString())
      .send({ from: account, gas: 200000 })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const harvest = async (poolContract, account) => {
  let now = new Date().getTime() / 1000;
  if (now >= 1597172400) {
    return poolContract.methods
      .getReward()
      .send({ from: account, gas: 200000 })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const redeem = async (poolContract, account) => {
  let now = new Date().getTime() / 1000;
  if (now >= 1597172400) {
    return poolContract.methods
      .exit()
      .send({ from: account, gas: 400000 })
      .on('transactionHash', tx => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert("pool not active");
  }
}

export const approve = async (tokenContract, poolContract, account) => {
  return tokenContract.methods
    .approve(poolContract.options.address, ethers.constants.MaxUint256)
    .send({ from: account, gas: 80000 })
}

export const getPoolContracts = async (oce) => {
  const pools = Object.keys(oce.contracts)
    .filter(c => c.indexOf('_pool') !== -1)
    .reduce((acc, cur) => {
      const newAcc = { ...acc }
      newAcc[cur] = oce.contracts[cur]
      return newAcc
    }, {})
  return pools
}

export const getEarned = async (oce, pool, account) => {
  const scalingFactor = new BigNumber(await oce.contracts.oce.methods.ocesScalingFactor().call())
  const earned        = new BigNumber(await pool.methods.earned(account).call())

  return earned.multipliedBy(scalingFactor.dividedBy(new BigNumber(10).pow(18)))
}

export const getStaked = async (oce, pool, account) => {
  return oce.toBigN(await pool.methods.balanceOf(account).call())
}

export const getCurrentPrice = async (oce) => {
  // FORBROCK: get current OCE price
  return oce.toBigN(await oce.contracts.rebaser.methods.getCurrentTWAP().call())
}

export const getTargetPrice = async (oce) => {
  return oce.toBigN(1).toFixed(2);
}

export const getCirculatingSupply = async (oce) => {
  let now           = await oce.web3.eth.getBlock('latest');
  let scalingFactor = oce.toBigN(await oce.contracts.oce.methods.ocesScalingFactor().call());
  let starttime     = oce.toBigN(await oce.contracts.eth_pool.methods.starttime().call()).toNumber();
  let timePassed    = now["timestamp"] - starttime;
  if (timePassed < 0) {
    return 0;
  }

  let ocesDistributed = oce.toBigN(8 * timePassed * 250000 / 625000); //oces from first 8 pools
  let starttimePool2  = oce.toBigN(await oce.contracts.ycrv_pool.methods.starttime().call()).toNumber();
  timePassed = now["timestamp"] - starttime;
  let pool2Oces = oce.toBigN(timePassed * 1500000 / 625000); // oces from second pool. note: just accounts for first week
  let circulating = pool2Oces.plus(ocesDistributed).times(scalingFactor).div(10**36).toFixed(2)

  return circulating
}

export const getNextRebaseTimestamp = async (oce) => {
  try {
    let now      = await oce.web3.eth.getBlock('latest').then(res => res.timestamp);
    let interval = 43200; // 12 hours
    let offset   = 28800; // 8am/8pm utc
    let secondsToRebase = 0;
    if (await oce.contracts.rebaser.methods.rebasingActive().call()) {
      if (now % interval > offset) {
          secondsToRebase = (interval - (now % interval)) + offset;
       } else {
          secondsToRebase = offset - (now % interval);
      }
    } else {
      let twap_init = oce.toBigN(await oce.contracts.rebaser.methods.timeOfTWAPInit().call()).toNumber();
      if (twap_init > 0) {
        let delay = oce.toBigN(await oce.contracts.rebaser.methods.rebaseDelay().call()).toNumber();
        let endTime = twap_init + delay;
        if (endTime % interval > offset) {
            secondsToRebase = (interval - (endTime % interval)) + offset;
         } else {
            secondsToRebase = offset - (endTime % interval);
        }
        return endTime + secondsToRebase;
      } else {
        return now + 13*60*60; // just know that its greater than 12 hours away
      }
    }

    return secondsToRebase

  } catch (e) {
    console.log(e)
  }
}

export const getTotalSupply = async (oce) => {
  return await oce.contracts.oce.methods.totalSupply().call();
}

export const getStats = async (oce) => {
  const curPrice = await getCurrentPrice(oce)
  const circSupply = await getCirculatingSupply(oce)
  const nextRebase = await getNextRebaseTimestamp(oce)
  const targetPrice = await getTargetPrice(oce)
  const totalSupply = await getTotalSupply(oce)
  return {
    circSupply,
    curPrice,
    nextRebase,
    targetPrice,
    totalSupply
  }
}

export const vote = async (oce, account) => {
  return oce.contracts.gov.methods.castVote(0, true).send({ from: account })
}

export const delegate = async (oce, account) => {
  return oce.contracts.oce.methods.delegate("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").send({from: account, gas: 320000 })
}

export const didDelegate = async (oce, account) => {
  return await oce.contracts.oce.methods.delegates(account).call() === '0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD'
}

export const getVotes = async (oce) => {
  const votesRaw = new BigNumber(await oce.contracts.oce.methods.getCurrentVotes("0x28C87D0b8cf871A2F136f1e372039a8aF9d128eD").call()).div(10**24)
  return votesRaw
}

export const getScalingFactor = async (oce) => {
  return new BigNumber(await oce.contracts.oce.methods.ocesScalingFactor().call())
}

export const getDelegatedBalance = async (oce, account) => {
  return new BigNumber(await oce.contracts.oce.methods.balanceOfUnderlying(account).call()).div(10**24)
}

export const migrate = async (oce, account) => {
  return oce.contracts.oceV2migration.methods.migrate().send({ from: account, gas: 320000 })
}

export const getMigrationEndTime = async (oce) => {
  return oce.toBigN(await oce.contracts.oceV2migration.methods.startTime().call()).plus(oce.toBigN(86400*3)).toNumber()
}

export const getV2Supply = async (oce) => {
  return new BigNumber(await oce.contracts.oceV2.methods.totalSupply().call())
}