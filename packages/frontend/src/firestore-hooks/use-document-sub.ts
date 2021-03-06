import { useEffect, useState } from "react"
import { firebase } from "../firebase"
import { useStableCallback } from "../util"

export function useDocumentSub<T = firebase.firestore.DocumentData>(
  ref: firebase.firestore.DocumentReference<T>,
  options: { onError?: (err: any) => void } = {}
) {
  const [data, setData] = useState<T | null | undefined>(undefined)
  const [isLoading, setLoading] = useState(true)

  const onError = useStableCallback(
    (err: any) => {
      if (options.onError) {
        options.onError(err)
      } else {
        console.error("[useDocumentSub]", err)
      }
    },
    [options.onError]
  )

  useEffect(() => {
    const unsub = ref.onSnapshot({
      next: (snapshot) => {
        if (snapshot.exists) {
          setData(snapshot.data())
        } else {
          setData(null)
        }
        setLoading(false)
      },
      error: (err) => {
        onError(err)
        setLoading(false)
      },
    })

    return () => unsub()
    // ref.path is equivalent to the ref's identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onError, ref.path])

  return {
    data,
    isLoading,
  }
}
