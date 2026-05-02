import { Timestamp } from 'firebase/firestore';

export interface PetRecord {
  id: string;
  name: string;
  gender: string;
  breed: string;
  color: string;
  age: string;
  identification: string;
  tagDisplayName: string;
  ownerName: string;
  ownerAddress: string;
  contactNumber: string;
  imageUrl: string;
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
  identification: string;
  tagDisplayName: string;
  ownerName: string;
  ownerAddress: string;
  contactNumber: string;
  imageUrl: string;
}
