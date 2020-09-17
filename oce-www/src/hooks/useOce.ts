import { useContext } from 'react'
import { Context } from '../contexts/OceProvider'

const useOce = () => {
  const { oce } = useContext(Context)
  return oce
}

export default useOce