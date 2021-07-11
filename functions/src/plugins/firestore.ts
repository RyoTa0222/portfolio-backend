import * as admin from "firebase-admin";

const firebaseApp = admin.initializeApp();

export const db = firebaseApp.firestore();
