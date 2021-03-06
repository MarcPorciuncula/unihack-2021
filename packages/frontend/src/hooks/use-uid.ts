import { useMemo } from "react"
import shortid from "shortid"

export function useUID() {
  const uid = useMemo(() => {
    let id = localStorage.getItem("uid")
    if (!id) {
      id = shortid.generate()
      localStorage.setItem("uid", id)
    }
    return id
  }, [])

  return {
    uid,
  }
}
