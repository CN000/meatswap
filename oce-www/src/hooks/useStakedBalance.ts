import { useCallback, useEffect, useState } from 'react'

import BigNumber from 'bignumber.js'
import { useWallet } from 'use-wallet'
import { Contract } from "web3-eth-contract"

import { getStaked } from '../oceUtils'
import useOce from './useOce'

const useStakedBalance = (pool: Contract) => {
  const [balance, setBalance] = useState(new BigNumber(0))
  const { account }: { account: string } = useWallet()
  const oce = useOce()

  const fetchBalance = useCallback(async () => {
    const balance = await getStaked(oce, pool, account)
    setBalance(new BigNumber(balance))
  }, [account, pool, oce])

  useEffect(() => {
    if (account && pool && oce) {
      fetchBalance()
    }
  }, [account, pool, setBalance, oce])

  return balance
}

export default useStakedBalance