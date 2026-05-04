
// Importa solo lo necesario
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBkXhIzyRBXgzfc7nuOOu1R_TJwGZnpG9U",
  authDomain: "garzastyle-c3cf1.firebaseapp.com",
  projectId: "garzastyle-c3cf1",
  storageBucket: "gs://garzastyle-c3cf1.firebasestorage.app",
  messagingSenderId: "140850231343",
  appId: "1:140850231343:web:f72a76457c861183492eda",
  measurementId: "G-BPLQ7SJEQ6",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;