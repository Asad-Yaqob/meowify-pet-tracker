import { Timestamp } from 'firebase/firestore';

export interface PetRecord {
  id: string;
  name: string;
  gender: string;
  breed: string;
  color: string;
  age: string;
  identification?: string; // Optional for backward compatibility with legacy documents
  tagDisplayName: string;
  ownerName: string;
  ownerAddress: string;
  contactNumber: string;
  imageUrl: string;
  email?: string;
  password?: string;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PetPayload {
  name: string;
  gender: string;
  breed: string;
  color: string;
  age: string;
  tagDisplayName: string;
  ownerName: string;
  ownerAddress: string;
  contactNumber: string;
  imageUrl: string;
  email?: string;
  password?: string;
}
