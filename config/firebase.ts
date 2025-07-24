// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtr10JO7xHJF3JsYouH8FtS5d2MiZDO6g",
  authDomain: "expense-tracker-e4d50.firebaseapp.com",
  projectId: "expense-tracker-e4d50",
  storageBucket: "expense-tracker-e4d50.firebasestorage.app",
  messagingSenderId: "1086278392784",
  appId: "1:1086278392784:web:77601091695d26533337d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
// db
export const firestore = getFirestore(app);