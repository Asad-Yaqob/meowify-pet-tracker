import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Lazy Firebase Admin Initialiser ─────────────────────────────────
function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

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
const RATE_LIMIT = 5;
const RATE_WINDOW = 300_000;

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

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { petId, password } = req.body || {};

    if (!petId || typeof petId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid petId.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid password.' });
    }

    if (isRateLimited(petId)) {
      return res.status(429).json({
        error: 'Too many password attempts. Please try again after 5 minutes.',
      });
    }

    const db = getDb();
    const petDoc = await db.collection('pets').doc(petId).get();

    if (!petDoc.exists) {
      return res.status(404).json({ error: 'Pet tag not found.' });
    }

    const pet = petDoc.data()!;

    const credDoc = await db.collection('pets').doc(petId)
      .collection('private').doc('credentials').get();

    const creds = credDoc.exists ? credDoc.data()! : {};
    const storedPassword = creds.password || '';

    if (!storedPassword) {
      return res.status(400).json({
        error: 'This tag has no password set. Please contact support.',
      });
    }

    if (password !== storedPassword) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

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
      },
    });

  } catch (err: any) {
    console.error('Verify password error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error. Please try again later.' });
  }
}
