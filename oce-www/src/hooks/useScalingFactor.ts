import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'

import { bnToDec, decToBn } from '../utils'
import { getScalingFactor } from '../oceUtils'

import useOce from './useOce'

const useScalingFactor = () => {
  const [scalingFactor, setScalingFactor] = useState(decToBn(1))
  const oce = useOce()

  useEffect(() => {
    async function fetchScalingFactor () {
      const sf = await getScalingFactor(oce)
      setScalingFactor(sf)
    }
    if (oce) {
      fetchScalingFactor()
    }
  }, [oce])

  return bnToDec(scalingFactor)
}

export default useScalingFactor