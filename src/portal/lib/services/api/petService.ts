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

export const createPet = async (payload: PetPayload, createdBy: string) => {
  const petId = await generateUniquePetId();
  const petRef = doc(firestoreDb, 'pets', petId);
  await withTimeout(
    setDoc(petRef, {
      ...payload,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
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
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as PetRecord;
};

export const updatePet = async (id: string, payload: PetPayload) => {
  await withTimeout(
    updateDoc(doc(firestoreDb, 'pets', id), {
      ...payload,
      updatedAt: serverTimestamp(),
    }),
  );
};

export const deletePet = async (id: string) => {
  await withTimeout(deleteDoc(doc(firestoreDb, 'pets', id)));
};
