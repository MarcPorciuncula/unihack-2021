import { useEffect, useState } from "react"
import { BrowserRouter, Route, Switch } from "react-router-dom"

import "./App.css"
import { firebase, firestore } from "./firebase"
import logo from "./logo.svg"
import { useStableCallback } from "./util"

const ref = firestore.collection("messages").doc("main")

function App() {
  const { data } = useDocumentSub(ref)

  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact>
          <div className="App">
            <header className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              {data !== undefined ? (
                data?.message ? (
                  <p>{data.message}</p>
                ) : (
                  <pre className="text-sm">
                    Please add an object at ref `messages/main` with a string
                    property `message`
                  </pre>
                )
              ) : null}
            </header>
          </div>
        </Route>
      </Switch>
    </BrowserRouter>
  )
}

export default App

function useDocumentSub<T = firebase.firestore.DocumentData>(
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
