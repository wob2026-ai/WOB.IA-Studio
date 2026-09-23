import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = (firebaseConfig as any).firestoreDatabaseId;

export const db = firestoreDatabaseId 
  ? getFirestore(app, firestoreDatabaseId) 
  : getFirestore(app);

export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGooglePopup = async () => {
  return await signInWithPopup(auth, googleAuthProvider);
};

export const logoutAuth = async () => {
  return await signOut(auth);
};
