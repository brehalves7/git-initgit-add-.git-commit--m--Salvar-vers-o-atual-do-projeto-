
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// As suas credenciais do Firebase são inseridas aqui.
// Em um projeto real, é mais seguro usar variáveis de ambiente.
const firebaseConfig = {
  "projectId": "site-gcs-copia",
  "appId": "1:892557536709:web:a8f7a25dc2924e6b50afac",
  "storageBucket": "site-gcs-copia.appspot.com",
  "apiKey": "AIzaSyCkNpJ97ECuQE7CnUoXurE4Qc7A1RcUiNQ",
  "authDomain": "site-gcs-copia.firebaseapp.com",
  "messagingSenderId": "892557536709"
};


// Inicializa o Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
