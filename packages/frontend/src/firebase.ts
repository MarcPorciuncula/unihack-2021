import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"

const app = firebase.initializeApp({
  apiKey: "AIzaSyCjWW9bW6DmR1Y-LWoPDQBin9p_KYr3FXk",
  authDomain: "unihack-2021.firebaseapp.com",
  projectId: "unihack-2021",
  storageBucket: "unihack-2021.appspot.com",
  messagingSenderId: "382328160132",
  appId: "1:382328160132:web:f3f184b234653bcbeea7d1",
})

const firestore = app.firestore()
const auth = app.auth()

export { app, firebase, firestore, auth }
