'use client'

import { createContext, useContext } from 'react'

interface InfluencerContextValue {
  isPending: boolean
}

export const InfluencerContext = createContext<InfluencerContextValue>({ isPending: false })

export function useInfluencerContext() {
  return useContext(InfluencerContext)
}
