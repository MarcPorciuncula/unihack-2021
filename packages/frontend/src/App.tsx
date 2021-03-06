import { BrowserRouter, Route, Switch } from "react-router-dom"

import "./App.css"
import { Draw } from "./draw"
import { firestore } from "./firebase"
import { useDocumentSub } from "./firestore-hooks"
import logo from "./logo.svg"

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
        <Route path="/draw">
          <Draw />
        </Route>
      </Switch>
    </BrowserRouter>
  )
}

export default App