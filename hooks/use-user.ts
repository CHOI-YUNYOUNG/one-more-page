'use client'

import { useEffect, useState } from 'react'
import { getUserId } from '@/lib/user'

export function useUser() {
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  return userId
}
