// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
//import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "@firebase/firestore"
import { getStorage } from "firebase/storage"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBK11Dp7UpEo2wri4ymJ9RtBiyRBqoZ40o",
  authDomain: "musicmanagerimages.firebaseapp.com",
  projectId: "musicmanagerimages",
  storageBucket: "musicmanagerimages.appspot.com",
  messagingSenderId: "388594868408",
  appId: "1:388594868408:web:9fdf1cb2ae57b369b3d44d",
  measurementId: "G-GS79BY7G7S"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
//const analytics = getAnalytics(app);
export const storage = getStorage(app)
export const firestore = getFirestore(app)