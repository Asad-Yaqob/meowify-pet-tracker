import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
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

export const createPet = async (payload: PetPayload, createdBy: string) => {
  await withTimeout(
    addDoc(petsCollection, {
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
