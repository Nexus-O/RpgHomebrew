import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);