import React, { useEffect, useState } from 'react'
import { firebase, auth } from '../firebase'

export const AuthContext = React.createContext<{
  currentUser: firebase.User | null
  uid: string | null;
  isPending: boolean
}>({ currentUser: null, uid: null, isPending: false })

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPending, setPending] = useState(true)
  const [uid, setUid] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<firebase.User | null>(null)

  useEffect(() => {
    if (currentUser) setUid(currentUser.uid)
    else setUid(null)
  }, [currentUser])

  useEffect(() => {
    auth.signInAnonymously().then(user => {
      setCurrentUser(user.user)
      setPending(false)
    })

    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
      setPending(false)
    })
    return unsub

  }, [])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        uid,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
