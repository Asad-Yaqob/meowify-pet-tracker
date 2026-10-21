import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firestoreDb } from '../firebase/firebaseConfig';
import { PetPayload, PetRecord } from '../../types/petTypes';

const petsCollection = collection(firestoreDb, 'pets');

/** Wraps a Firestore promise with a timeout so it fails fast instead of hanging. */
const withTimeout = <T,>(promise: Promise<T>, ms = 10_000): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timed out after ${ms / 1000}s. Check your Firestore security rules and network.`)),
        ms,
      ),
    ),
  ]);

/** Generates a candidate pet ID with the format MFY-XXXXXX (always 6 digits). */
const generatePetId = (): string => {
  const number = Math.floor(Math.random() * 900_000) + 100_000; // 100000–999999
  return `MFY-${number}`;
};

/**
 * Finds a pet ID that does not yet exist in Firestore.
 * Retries up to `maxAttempts` times before throwing.
 */
const generateUniquePetId = async (maxAttempts = 10): Promise<string> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const petId = generatePetId();
    const petRef = doc(firestoreDb, 'pets', petId);
    const snapshot = await withTimeout(getDoc(petRef));
    if (!snapshot.exists()) {
      return petId;
    }
    console.warn(`Pet ID collision on "${petId}" (attempt ${attempt}/${maxAttempts}), retrying…`);
  }
  throw new Error(`Failed to generate a unique pet ID after ${maxAttempts} attempts.`);
};

/**
 * Separates sensitive credentials (email, password) from public pet data.
 * Credentials go into a private subcollection; public data stays in the main document.
 */
const splitPayload = (payload: PetPayload) => {
  const { email, password, ...publicData } = payload;
  const credentials: Record<string, string> = {};
  if (email !== undefined) credentials.email = email;
  if (password !== undefined) credentials.password = password;
  return { publicData, credentials };
};

export const createPet = async (payload: PetPayload, createdBy: string) => {
  const petId = await generateUniquePetId();
  const petRef = doc(firestoreDb, 'pets', petId);
  const { publicData, credentials } = splitPayload(payload);

  // Write public pet profile
  await withTimeout(
    setDoc(petRef, {
      ...publicData,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );

  // Write private credentials to subcollection
  if (Object.keys(credentials).length > 0) {
    const credRef = doc(firestoreDb, 'pets', petId, 'private', 'credentials');
    await withTimeout(setDoc(credRef, credentials));
  }
};

export const listPets = async () => {
  const petQuery = query(petsCollection, orderBy('createdAt', 'desc'));
  const snapshot = await withTimeout(getDocs(petQuery));
  return snapshot.docs.map(
    (item) =>
      ({
        id: item.id,
        ...item.data(),
      }) as PetRecord,
  );
};

export const getPetById = async (id: string) => {
  const snapshot = await withTimeout(getDoc(doc(firestoreDb, 'pets', id)));
  if (!snapshot.exists()) {
    return null;
  }

  const petData = { id: snapshot.id, ...snapshot.data() } as PetRecord;

  // Attempt to read private credentials for admin form display
  try {
    const credSnap = await withTimeout(
      getDoc(doc(firestoreDb, 'pets', id, 'private', 'credentials')),
    );
    if (credSnap.exists()) {
      const creds = credSnap.data();
      petData.email = creds.email || '';
      petData.password = creds.password || '';
    }
  } catch {
    // If security rules block client read, credentials simply won't populate.
    // The admin can still set/update them via updatePet().
    console.warn(`Could not read private credentials for ${id} (may be blocked by security rules).`);
  }

  return petData;
};

export const updatePet = async (id: string, payload: PetPayload) => {
  const { publicData, credentials } = splitPayload(payload);

  // Update public pet profile
  await withTimeout(
    updateDoc(doc(firestoreDb, 'pets', id), {
      ...publicData,
      updatedAt: serverTimestamp(),
    }),
  );

  // Update private credentials in subcollection
  if (Object.keys(credentials).length > 0) {
    const credRef = doc(firestoreDb, 'pets', id, 'private', 'credentials');
    await withTimeout(
      setDoc(credRef, credentials, { merge: true }),
    );
  }
};

export const deletePet = async (id: string) => {
  // Delete private credentials first
  try {
    await withTimeout(deleteDoc(doc(firestoreDb, 'pets', id, 'private', 'credentials')));
  } catch {
    // Subcollection may not exist for legacy records — ignore
  }
  // Delete the main pet document
  await withTimeout(deleteDoc(doc(firestoreDb, 'pets', id)));
};
