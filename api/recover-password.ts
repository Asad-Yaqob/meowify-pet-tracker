import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

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
const RATE_LIMIT = 3;
const RATE_WINDOW = 600_000;

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
    const { petId, email } = req.body || {};

    if (!petId || typeof petId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid petId.' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid email.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isRateLimited(petId)) {
      return res.status(429).json({
        error: 'Too many recovery attempts. Please try again after 10 minutes.',
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
    const registeredEmail = (creds.email || '').trim().toLowerCase();

    if (!registeredEmail) {
      return res.status(400).json({
        error: 'No recovery email on file for this tag. Please contact support via WhatsApp: 0339-1252725.',
      });
    }

    if (cleanEmail !== registeredEmail) {
      return res.status(400).json({
        error: 'Email does not match our records for this tag.',
      });
    }

    const petName = pet.name || 'Your Pet';
    const ownerName = pet.ownerName || 'Pet Owner';
    const petPassword = creds.password || '';
    const petUrl = `https://meowify.pk/pages/pet-tag?id=${encodeURIComponent(petId)}`;

    if (!process.env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY on Vercel.');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Meowify <notifications@meowify.pk>',
      to: [registeredEmail],
      subject: `Meowify Pet Tag Password Recovery — ${petName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #FFE3D6; border-radius: 20px; background-color: #FFF8F5;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 42px;">🐾</span>
            <h2 style="color: #2D2438; margin: 12px 0 4px; font-size: 22px;">Password Recovery</h2>
            <p style="color: rgba(45,36,56,0.6); font-size: 14px; margin: 0;">Meowify Pet Tag System</p>
          </div>

          <p style="color: #2D2438; font-size: 15px; line-height: 1.6;">
            Hi <strong>${ownerName}</strong>,
          </p>
          <p style="color: #2D2438; font-size: 15px; line-height: 1.6;">
            You requested password recovery for <strong>${petName}</strong>'s Meowify tag (ID: <code>${petId}</code>).
          </p>

          <div style="background: #ffffff; border: 2px dashed #FF9B7B; border-radius: 14px; padding: 18px 24px; text-align: center; margin: 24px 0;">
            <p style="margin: 0 0 6px; font-size: 12px; color: rgba(45,36,56,0.6); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Your Tag Password</p>
            <p style="margin: 0; font-size: 24px; font-weight: 800; color: #2D2438; font-family: monospace; letter-spacing: 2px;">${petPassword}</p>
          </div>

          <p style="color: #2D2438; font-size: 14px; line-height: 1.6;">
            You can use this password to edit ${petName}'s profile anytime at:
          </p>
          <p style="text-align: center; margin: 16px 0;">
            <a href="${petUrl}" style="background: #FF9B7B; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Pet Tag Profile</a>
          </p>

          <hr style="border: none; border-top: 1px solid rgba(255,155,123,0.3); margin: 24px 0;" />
          <p style="color: rgba(45,36,56,0.5); font-size: 12px; text-align: center; margin: 0;">
            If you did not request this recovery, you can safely ignore this email.<br/>
            Need help? Contact WhatsApp: <strong>0339-1252725</strong>
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return res.status(500).json({ error: 'Failed to send recovery email. Please try again.' });
    }

    const masked = cleanEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c);

    return res.status(200).json({
      success: true,
      message: `Recovery email sent to ${masked}. Please check your inbox.`,
    });

  } catch (err: any) {
    console.error('Recover password error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error. Please try again later.' });
  }
}
