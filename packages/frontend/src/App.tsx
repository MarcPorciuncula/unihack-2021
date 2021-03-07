import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom"
import "./App.css"
import { firestore } from "./firebase"
import { useDocumentSub } from "./firestore-hooks"
import logo from "./logo.svg"
import { FrameView } from "./routes/frame"
import { DrawPage } from "./routes/draw"
import QRCode from "./routes/qr-codes/qr-code"
import { AuthProvider } from "./contexts/AuthContext"
import React from "react"

const ref = firestore.collection("messages").doc("main")

function App() {
  const { data } = useDocumentSub(ref)

  return (
    <BrowserRouter>
      <AuthProvider>
        <Switch>
          <Route path="/" exact>
            <Redirect to="/frame/demo" />
          </Route>
          <Route path="/frame/:frameId" exact>
            {({ match }) => <FrameView frameId={match!.params.frameId} />}
          </Route>
          <Route path="/frame/:frameId/:segmentId/draw" exact>
            {({ match }) => (
              <DrawPage
                frameId={match!.params.frameId}
                segmentId={match!.params.segmentId}
              />
            )}
          </Route>
          <Route path="/q/:id">
            <QRCode />
          </Route>
        </Switch>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
