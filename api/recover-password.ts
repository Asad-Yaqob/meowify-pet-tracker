import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';

// ── Firebase Admin (initialise once per cold start) ──────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores multi-line env vars with escaped newlines
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Rate-limiter (in-memory, per cold-start instance) ────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;        // max attempts
const RATE_WINDOW = 600_000; // 10 minutes

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
  process.env.VITE_APP_BASE_URL, // dev preview URL
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
    const { petId, email } = req.body || {};

    // ── Validate input ───────────────────────────────────────────────
    if (!petId || typeof petId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid petId.' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid email.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── Rate-limit by petId ──────────────────────────────────────────
    if (isRateLimited(petId)) {
      return res.status(429).json({
        error: 'Too many recovery attempts. Please try again after 10 minutes.',
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
    const registeredEmail = (creds.email || '').trim().toLowerCase();

    if (!registeredEmail) {
      return res.status(400).json({
        error: 'No recovery email on file for this tag. Contact support via WhatsApp: 0339-1252725',
      });
    }

    // ── Verify email match ───────────────────────────────────────────
    if (cleanEmail !== registeredEmail) {
      return res.status(400).json({
        error: 'Email does not match our records for this tag.',
      });
    }

    // ── Send the recovery email via Resend ───────────────────────────
    const petName = pet.name || 'Your Pet';
    const ownerName = pet.ownerName || 'Pet Owner';
    const petPassword = creds.password || '';
    const petUrl = `https://meowify.pk/pages/pet-tag?id=${encodeURIComponent(petId)}`;

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
            You requested your password for <strong>${petName}</strong>'s pet tag
            (ID: <code style="background: #FFE3D6; padding: 2px 8px; border-radius: 6px; font-size: 13px;">${petId}</code>).
          </p>

          <div style="background: #ffffff; border: 2px dashed #FF9B7B; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Your Password</span>
            <strong style="font-size: 24px; color: #2D2438; font-family: 'Courier New', monospace; letter-spacing: 2px;">${petPassword}</strong>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${petUrl}" style="background: #FF9B7B; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(255,155,123,0.4);">
              Go to Pet Profile →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid rgba(45,36,56,0.08); margin: 24px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email.<br>
            Need help? WhatsApp us: <a href="https://wa.me/923391252725" style="color: #FF9B7B;">0339-1252725</a>
          </p>
        </div>
      `,
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return res.status(500).json({ error: 'Failed to send recovery email. Please try again later.' });
    }

    return res.status(200).json({
      success: true,
      message: `Recovery email sent to ${registeredEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`,
    });

  } catch (err) {
    console.error('Recover password error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}
