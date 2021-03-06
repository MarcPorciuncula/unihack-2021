import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import { register as qrRegister } from "./functions/qr"
import { register as segmentsRegister } from "./functions/segments"

const australia = () => functions.region("australia-southeast1")

admin.initializeApp()

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = australia().https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true })
  response.send("Hello from Firebase!")
})

export const qr = qrRegister(australia())
export const segments = segmentsRegister(australia())
