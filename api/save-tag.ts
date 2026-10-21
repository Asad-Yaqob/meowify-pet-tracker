import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

// ── Rate-limiter (in-memory) ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 6;
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

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { petId, currentPassword, payload } = req.body || {};

    if (!petId || typeof petId !== 'string') {
      return res.status(400).json({ error: 'Missing petId.' });
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Missing profile payload.' });
    }

    if (isRateLimited(petId)) {
      return res.status(429).json({ error: 'Too many save attempts. Please wait 5 minutes.' });
    }

    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) {
      return res.status(404).json({ error: 'Pet tag not found.' });
    }

    const credRef = petRef.collection('private').doc('credentials');
    const credDoc = await credRef.get();
    const storedCreds = credDoc.exists ? credDoc.data()! : {};
    const storedPassword = storedCreds.password || '';

    // If tag was already activated, verify currentPassword before allowing changes
    if (storedPassword) {
      if (!currentPassword || currentPassword !== storedPassword) {
        return res.status(401).json({ error: 'Unauthorized: Current password is required to save changes.' });
      }
    }

    // Prepare public pet document data
    const publicUpdate: Record<string, any> = {
      name: (payload.name || '').trim(),
      gender: (payload.gender || '').trim(),
      age: (payload.age || '').trim(),
      breed: (payload.breed || '').trim(),
      color: (payload.color || '').trim(),
      ownerName: (payload.ownerName || '').trim(),
      contactNumber: (payload.contactNumber || '').trim(),
      ownerAddress: (payload.ownerAddress || '').trim(),
      imageUrl: (payload.imageUrl || '').trim(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // If first time activation, also set createdAt if not present
    if (!petDoc.data()?.createdAt) {
      publicUpdate.createdAt = FieldValue.serverTimestamp();
    }

    await petRef.set(publicUpdate, { merge: true });

    // Prepare private credentials update
    const credUpdate: Record<string, any> = {};
    if (payload.email) {
      credUpdate.email = String(payload.email).trim().toLowerCase();
    }
    if (payload.password && String(payload.password).trim() !== '') {
      credUpdate.password = String(payload.password).trim();
    }

    if (Object.keys(credUpdate).length > 0) {
      await credRef.set(credUpdate, { merge: true });
    }

    return res.status(200).json({ success: true, message: 'Pet tag saved successfully.' });
  } catch (err) {
    console.error('Save tag error:', err);
    return res.status(500).json({ error: 'Internal server error while saving tag.' });
  }
}
