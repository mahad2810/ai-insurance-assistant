import { type FirebaseApp, initializeApp, getApps } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Analytics, getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAFqJGSy4KuK76MU1IrcF3Y70G1SGwSL-8",
  authDomain: "ai-insurance-assistant.firebaseapp.com",
  projectId: "ai-insurance-assistant",
  storageBucket: "ai-insurance-assistant.firebasestorage.app",
  messagingSenderId: "1073989879534",
  appId: "1:1073989879534:web:ca621e8f74807ac76455ff",
  measurementId: "G-GL0M6GDCPP"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
let analytics: Analytics | undefined;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, analytics };
