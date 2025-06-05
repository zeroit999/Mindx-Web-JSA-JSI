import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAhWFSE7eXgpoyT1nf0zCE8epn8bNebATM",
  authDomain: "career-compass-3472c.firebaseapp.com",
  projectId: "career-compass-3472c",
  storageBucket: "career-compass-3472c.firebasestorage.app",
  messagingSenderId: "630173821220",
  appId: "1:630173821220:web:5ce4bdde12b49015e7ebb1",
  measurementId: "G-VV5QKRNN13"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  auth,
  db,
  storage,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  storageRef,
  uploadBytes,
  getDownloadURL,
  signOut,
  collection,
  getDocs
};