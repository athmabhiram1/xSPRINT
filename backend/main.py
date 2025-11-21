/**
 * XTHLETE TOURNAMENT ENGINE - COMPLETE BACKEND API
 * Tech Stack: Node.js, Express.js, Firebase Admin SDK
 * 
 * Features:
 * 1. Smart Fixture Generation (Club Avoidance + Byes)
 * 2. Constraint-Based Scheduling (Rest times + Court optimization)
 * 3. Secure Match Code System
 * 4. Real-time Leaderboard Updates
 */

const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- FIREBASE INITIALIZATION ---
// Replace with your Firebase service account key
const serviceAccount = require('./path/to/your/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

// --- CONSTANTS ---
const MATCH_DURATION_MINS = 20; // Default match duration
const REST_TIME_MINS = 10;      // Minimum rest time between matches