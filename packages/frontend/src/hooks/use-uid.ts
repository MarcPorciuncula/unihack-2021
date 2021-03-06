import { useEffect, useState } from "react"
import { auth } from "../firebase"

export function useUID() {
  const [uid, setUid] = useState<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      auth.signInAnonymously().then((user) => setUid(user.user?.uid))
    }
    getUser()
  }, [])

  return {
    uid,
  }
}
