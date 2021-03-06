import { useEffect, useState } from "react"
import { functions } from "../firebase"
import { useStableCallback } from "../util"

export type FirebaseFunctions = "qr-get" | "segments-claim" | "qr-claim"

export function useCloudFunction<T>(
  name: FirebaseFunctions,
  params: any,
  options: { onError?: (err: any) => void } = {}
) {
  const [data, setData] = useState<T | null | undefined>(undefined)
  const [errors, setErrors] = useState<any | undefined>(undefined)
  const [isLoading, setLoading] = useState(true)

  const onError = useStableCallback(
    (err: any) => {
      if (options.onError) {
        options.onError(err)
      } else {
        console.error("[useFunction]", name, err)
      }
    },
    [options.onError]
  )

  useEffect(() => {
    const cf = functions.httpsCallable(name)

    setLoading(true)
    cf(params)
      .then((result) => {
        setData(result.data as T)
      })
      .catch((err) => {
        onError(err)
        setErrors(err)
        setLoading(false)
      })
  }, [])

  return {
    data,
    errors,
    isLoading,
  }
}

export function useDelayedCloudFunction<T>(
  name: FirebaseFunctions,
  options: { onError?: (err: any) => void } = {}
): [
  (params: any) => void,
  { errors: any; data: T | null | undefined; isLoading: boolean }
] {
  const [data, setData] = useState<T | null | undefined>(undefined)
  const [isLoading, setLoading] = useState(true)
  const [params, setParams] = useState<any | null>(null)
  const [errors, setErrors] = useState<any | undefined>(undefined)
  const [started, setStarted] = useState(false)

  const onError = useStableCallback(
    (err: any) => {
      if (options.onError) {
        options.onError(err)
      } else {
        console.error("[useFunction]", name, err)
      }
    },
    [options.onError]
  )

  useEffect(() => {
    if (params && !started) {
      setStarted(true)
      const cf = functions.httpsCallable(name)

      setLoading(true)
      cf(params)
        .then((result) => {
          setData(result.data as T)
        })
        .catch((err) => {
          onError(err)
          setErrors(err)
          setLoading(false)
        })
    }
  }, [params, started])

  const handler = (params?: any) => setParams(params)
  return [
    handler,
    {
      errors,
      data,
      isLoading,
    },
  ]
}
