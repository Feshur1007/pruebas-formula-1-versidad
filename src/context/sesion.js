import { createContext, useContext } from 'react'

export const SesionContext = createContext(null)

export const useSesion = () => useContext(SesionContext)
