// import { initializeApp } from "firebase/app";
// import { getMessaging } from "firebase/messaging";

// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//     projectId: import.meta.env.VITE_PROJECT_ID,
//     messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
//     appId: import.meta.env.VITE_APP_ID,
// };

// // Validate required Firebase configuration values
// const requiredConfig = {
//     apiKey: 'VITE_FIREBASE_API_KEY',
//     authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
//     projectId: 'VITE_PROJECT_ID',
//     messagingSenderId: 'VITE_MESSAGING_SENDER_ID',
//     appId: 'VITE_APP_ID'
// };

// const missingConfig = Object.entries(requiredConfig)
//     .filter(([key, envVar]) => !firebaseConfig[key])
//     .map(([key, envVar]) => ({ key, envVar }));

// if (missingConfig.length > 0) {
//     console.error('Missing Firebase configuration values:', missingConfig.map(m => m.key));
//     console.error('Please ensure all required environment variables are set in your .env file:');
//     missingConfig.forEach(({ envVar }) => {
//         console.error(`  - ${envVar}`);
//     });
//     throw new Error(`Missing Firebase configuration: ${missingConfig.map(m => m.key).join(', ')}`);
// }

// export const app = initializeApp(firebaseConfig);
// export const messaging = getMessaging(app);

import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

// Check if we actually have the keys
const hasConfig = !!firebaseConfig.apiKey;

let app = null;
let messaging = null;

if (hasConfig) {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} else {
  // Log a warning instead of THROWING an error
  console.warn(
    "Project is running without Firebase. Notifications will not work.",
  );

  // Provide empty "mock" objects so imports in other files don't fail
  app = {};
  messaging = {};
}

export { app, messaging };
