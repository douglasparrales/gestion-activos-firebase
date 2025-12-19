// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJ-tV2i0MqW8dbNOhanmYz7qCPoNDjQo4",
  authDomain: "gestion-activos-7df81.firebaseapp.com",
  projectId: "gestion-activos-7df81",
  storageBucket: "gestion-activos-7df81.firebasestorage.app",
  messagingSenderId: "607939410099",
  appId: "1:607939410099:web:9dce175fc8dd84894b18c6",
  measurementId: "G-8S7ZF5KS85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 AUTH (AGREGADO)
export const auth = getAuth(app);

// 🗄️ FIRESTORE (YA EXISTÍA)
export const db = getFirestore(app);
