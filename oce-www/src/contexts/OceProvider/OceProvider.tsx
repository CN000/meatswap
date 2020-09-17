import React, { createContext, useEffect, useState } from 'react'

import { useWallet } from 'use-wallet'

import { Oce } from '../../oce'

export interface OceContext {
  oce ?: typeof Oce
}

export const Context = createContext<OceContext>({
  oce: undefined,
})

declare global {
  interface Window {
    ocesauce: any
  }
}

const OceProvider: React.FC = ({ children }) => {
  const { ethereum } = useWallet()
  const [oce, setOce] = useState<any>()

  useEffect(() => {
    if (ethereum) {
      const oceLib = new Oce(
        ethereum,
        "1",     // networkId
        false, {
          defaultAccount       : "",
          defaultConfirmations : 1,
          autoGasMultiplier    : 1.5,
          testing              : false,
          defaultGas           : "6000000",
          defaultGasPrice      : "1000000000000",
          accounts             : [],
          ethereumNodeTimeout  : 10000
        }
      )

      setOce(oceLib)
      window.ocesauce = oceLib
    }
  }, [ethereum])

  return (
    <Context.Provider value={{ oce }}>
      {children}
    </Context.Provider>
  )
}

export default OceProvider
