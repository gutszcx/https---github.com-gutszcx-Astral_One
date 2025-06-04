// src/types/index.ts
import type { CineFormValues } from '@/lib/schemas';
import type { Timestamp } from 'firebase/firestore';

export interface StoredCineItem extends CineFormValues {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
