import * as functions from "firebase-functions";

const australia = () => functions.region("australia-southeast1")

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = australia().https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});