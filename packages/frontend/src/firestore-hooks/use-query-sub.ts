import { useEffect, useState } from "react"
import { firebase } from "../firebase"
import { useStableCallback } from "../util"

export function useQuerySub<T = firebase.firestore.DocumentData>(
  ref: firebase.firestore.Query<T>,
  options: { onError?: (err: any) => void } = {}
) {
  const [data, setData] = useState<T[] | undefined>(undefined)
  const [changes, setChanges] = useState<
    firebase.firestore.DocumentChange<T>[]
  >([])
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
        setData(snapshot.docs.map((item) => item.data()))
        setChanges(snapshot.docChanges())
        setLoading(false)
      },
      error: (err) => {
        onError(err)
        setLoading(false)
      },
    })

    return () => unsub()
  }, [onError, ref])

  return {
    data,
    changes,
    isLoading,
  }
}
