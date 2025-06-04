// src/types/index.ts
import type { CineFormValues } from '@/lib/schemas';
// Firebase Timestamp is not directly used here anymore for client-side typing
// if it was, import type { Timestamp } from 'firebase/firestore'; 

export interface StoredCineItem extends CineFormValues {
  id: string;
  createdAt?: string; // Changed from Timestamp to string (ISO string)
  updatedAt?: string; // Changed from Timestamp to string (ISO string)
}
