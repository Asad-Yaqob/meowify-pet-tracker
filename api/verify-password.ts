import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Firebase Admin (initialise once per cold start) ──────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

// ── Rate-limiter (in-memory, per cold-start instance) ────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;        // max attempts
const RATE_WINDOW = 300_000; // 5 minutes

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// ── CORS helpers ─────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://meowify.pk',
  'https://www.meowify.pk',
  process.env.VITE_APP_BASE_URL,
].filter(Boolean);

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.myshopify.com') ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Handler ──────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { petId, password } = req.body || {};

    // ── Validate input ───────────────────────────────────────────────
    if (!petId || typeof petId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid petId.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid password.' });
    }

    // ── Rate-limit by petId ──────────────────────────────────────────
    if (isRateLimited(petId)) {
      return res.status(429).json({
        error: 'Too many password attempts. Please try again after 5 minutes.',
      });
    }

    // ── Fetch public pet document from Firestore ─────────────────────
    const petDoc = await db.collection('pets').doc(petId).get();

    if (!petDoc.exists) {
      return res.status(404).json({ error: 'Pet tag not found.' });
    }

    const pet = petDoc.data()!;

    // ── Fetch private credentials from subcollection ─────────────────
    const credDoc = await db.collection('pets').doc(petId)
      .collection('private').doc('credentials').get();

    const creds = credDoc.exists ? credDoc.data()! : {};
    const storedPassword = creds.password || '';

    if (!storedPassword) {
      return res.status(400).json({
        error: 'This tag has no password set. Please contact support.',
      });
    }

    // ── Verify password match ────────────────────────────────────────
    if (password !== storedPassword) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // ── Success — return ONLY non-sensitive edit data ─────────────────
    // The password itself is NEVER returned to the browser
    return res.status(200).json({
      success: true,
      pet: {
        id: petDoc.id,
        name: pet.name || '',
        gender: pet.gender || '',
        age: pet.age || '',
        breed: pet.breed || '',
        color: pet.color || '',
        ownerName: pet.ownerName || '',
        ownerAddress: pet.ownerAddress || '',
        contactNumber: pet.contactNumber || '',
        imageUrl: pet.imageUrl || '',
        tagDisplayName: pet.tagDisplayName || '',
        email: creds.email || '',
        // NOTE: password is deliberately NOT included here
      },
    });

  } catch (err) {
    console.error('Verify password error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}
