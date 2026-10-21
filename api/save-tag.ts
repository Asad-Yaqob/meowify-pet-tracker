import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ── Lazy Firebase Admin Initialiser ─────────────────────────────────
function getDb() {
  if (!getApps().length) {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'react-with-firebase-48bff';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

    // Strip surrounding quotes if wrapped in quotes in Vercel UI
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        `Missing Firebase Admin environment variables on Vercel: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`
      );
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return getFirestore();
}

// ── Rate-limiter (in-memory) ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 8;
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
function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// ── Handler ──────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  // Preflight must return immediately with 200/204
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const db = getDb();
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
  } catch (err: any) {
    console.error('Save tag error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while saving tag.' });
  }
}
