export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
export const APP_TIMEZONE = import.meta.env.VITE_APP_TIMEZONE ?? 'Asia/Manila';

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// The emails match the seed; the shared passwords are public by design and listed in the README
export const DEMO_ACCOUNTS = {
  volunteer: {
    email: 'demo.volunteer@example.com',
    password: import.meta.env.VITE_DEMO_VOLUNTEER_PASSWORD ?? '',
  },
  admin: {
    email: 'demo.admin@example.com',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? '',
  },
};
