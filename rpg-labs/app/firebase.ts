import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyB05qSKADcpSxtLiRpYdZ-fE_K7-cZvoi4",
  authDomain: "nexus-carmesin.firebaseapp.com",
  databaseURL: "https://nexus-carmesin-default-rtdb.firebaseio.com",
  projectId: "nexus-carmesin",
  storageBucket: "nexus-carmesin.firebasestorage.app",
  messagingSenderId: "678117680506",
  appId: "1:678117680506:web:ede3aff84beb3767f162c3",
  measurementId: "G-XJRK70S0J4"
};

// 🔥 Evita reinicializar no Next.js (ESSENCIAL)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🔥 Serviços
export const auth = getAuth(app);
export const db = getFirestore(app);