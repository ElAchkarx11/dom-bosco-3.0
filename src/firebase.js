
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  //Dados do firebase
  apiKey: "AIzaSyDudtVDc6ZGqqR2Dg3ThLqVtfpYm0Gyqzo",
  authDomain: "dombosco-c219c.firebaseapp.com",
  databaseURL: "https://dombosco-c219c-default-rtdb.firebaseio.com",
  projectId: "dombosco-c219c",
  storageBucket: "dombosco-c219c.appspot.com",
  messagingSenderId: "1075399281802",
  appId: "1:1075399281802:web:045e4973b793efab8cf173",
  measurementId: "G-KCC40RS17L"
}

const app = initializeApp(firebaseConfig);

// Configurando a persistência da autenticação
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Obtendo a referência do Firestore
const db = getFirestore(app);

export { auth, db };