import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG } from '../config';

// Firebase only proves identity; the default persistence keeps users signed in across reloads
export const auth = getAuth(initializeApp(FIREBASE_CONFIG));
