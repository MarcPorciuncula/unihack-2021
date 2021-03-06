import { BrowserRouter, Route, Switch } from "react-router-dom"
import "./App.css"
import { firestore } from "./firebase"
import { useDocumentSub } from "./firestore-hooks"
import logo from "./logo.svg"
import { FrameView } from "./routes/frame"
import { DrawPage } from "./routes/frame/draw"
import QRCode from "./routes/qr-codes/qr-code"

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
        <Route path="/frame/:frameId" exact>
          {({ match }) => <FrameView frameId={match!.params.frameId} />}
        </Route>
        <Route path="/frame/:frameId/draw" exact>
          {({ match }) => <DrawPage frameId={match!.params.frameId} />}
        </Route>
        <Route path="/q/:id">
          <QRCode />
        </Route>
      </Switch>
    </BrowserRouter>
  )
}

export default App
