import { useContext } from 'react'

import { useWallet } from 'use-wallet'

import { Context as FarmsContext } from '../contexts/Farms'
import { bnToDec } from '../utils'
import { getEarned } from '../oceUtils'

import useFarms from './useFarms'
import useOce from './useOce'

const useUnharvested = () => {
  const { unharvested } = useContext(FarmsContext)
  return unharvested
}

export default useUnharvested