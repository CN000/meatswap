import { Oce } from '../../oce'

import { bnToDec } from '../../utils'

import {
  getCurrentPrice as gCP,
  getTargetPrice as gTP,
  getCirculatingSupply as gCS,
  getNextRebaseTimestamp as gNRT,
  getTotalSupply as gTS,
  getScalingFactor,
} from '../../oceUtils'

const getCurrentPrice = async (oce: typeof Oce): Promise<number> => {
  // FORBROCK: get current OCE price
  return gCP(oce)
}

const getTargetPrice = async (oce: typeof Oce): Promise<number> => {
  // FORBROCK: get target OCE price
  return gTP(oce)
}

const getCirculatingSupply = async (oce: typeof Oce): Promise<string> => {
  // FORBROCK: get circulating supply
  return gCS(oce)
}

const getNextRebaseTimestamp = async (oce: typeof Oce): Promise<number> => {
  // FORBROCK: get next rebase timestamp
  const nextRebase = await gNRT(oce) as number
  return nextRebase * 1000
}

const getTotalSupply = async (oce: typeof Oce): Promise<string> => {
  // FORBROCK: get total supply
  return gTS(oce)
}

export const getStats = async (oce: typeof Oce) => {
  const curPrice         = await getCurrentPrice(oce)
  const circSupply       = '' // await getCirculatingSupply(oce)
  const nextRebase       = await getNextRebaseTimestamp(oce)
  const rawScalingFactor = await getScalingFactor(oce)
  const scalingFactor    = Number(bnToDec(rawScalingFactor).toFixed(2))
  const targetPrice      = await getTargetPrice(oce)
  const totalSupply      = await getTotalSupply(oce)
  return {
    circSupply,
    curPrice,
    nextRebase,
    scalingFactor,
    targetPrice,
    totalSupply
  }
}
