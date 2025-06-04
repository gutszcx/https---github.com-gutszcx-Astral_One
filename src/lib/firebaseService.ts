// src/lib/firebaseService.ts
'use server';

import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { CineFormValues } from './schemas';
import type { StoredCineItem } from '@/types';

const CONTENT_COLLECTION = 'contentItems';

// Helper to convert Firestore data to StoredCineItem, ensuring all fields from CineFormValues are present
function mapDocToStoredCineItem(document: ReturnType<typeof docSnap.data> & { id: string }): StoredCineItem {
    const data = document as any; // Cast to any to handle potential missing fields before assigning defaults
    // Ensure all base schema fields are present, even if undefined in Firestore, to match CineFormValues
    // This is important if schemas evolve or optional fields are not set.
    // For simplicity, we are directly casting now, assuming data integrity or handling in components.
    // A more robust solution would merge with default values from schemas.
    return {
        id: document.id,
        contentType: data.contentType,
        tmdbSearchQuery: data.tmdbSearchQuery || '',
        tituloOriginal: data.tituloOriginal || '',
        tituloLocalizado: data.tituloLocalizado || '',
        sinopse: data.sinopse || '',
        generos: data.generos || '',
        idiomaOriginal: data.idiomaOriginal || '',
        dublagensDisponiveis: data.dublagensDisponiveis || '',
        anoLancamento: data.anoLancamento !== undefined ? data.anoLancamento : null,
        duracaoMedia: data.duracaoMedia !== undefined ? data.duracaoMedia : null,
        classificacaoIndicativa: data.classificacaoIndicativa || '',
        qualidade: data.qualidade || '',
        capaPoster: data.capaPoster || '',
        bannerFundo: data.bannerFundo || '',
        tags: data.tags || '',
        destaqueHome: data.destaqueHome || false,
        status: data.status || 'ativo',
        linkVideo: data.contentType === 'movie' ? (data.linkVideo || '') : undefined,
        linkLegendas: data.contentType === 'movie' ? (data.linkLegendas || '') : undefined,
        totalTemporadas: data.contentType === 'series' ? (data.totalTemporadas !== undefined ? data.totalTemporadas : null) : undefined,
        temporadas: data.contentType === 'series' ? (data.temporadas || []) : undefined,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
    } as StoredCineItem;
}


// Add a new content item
export async function addContentItem(itemData: CineFormValues): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, CONTENT_COLLECTION), {
      ...itemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Failed to add content item.");
  }
}

// Get all content items
export async function getContentItems(): Promise<StoredCineItem[]> {
  try {
    const q = query(collection(db, CONTENT_COLLECTION), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => mapDocToStoredCineItem({ ...docSnap.data(), id: docSnap.id }));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw new Error("Failed to get content items.");
  }
}

// Get a single content item by ID
export async function getContentItemById(id: string): Promise<StoredCineItem | null> {
  try {
    const docRef = doc(db, CONTENT_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return mapDocToStoredCineItem({ ...docSnap.data(), id: docSnap.id });
    } else {
      console.log("No such document with ID:", id);
      return null;
    }
  } catch (error) {
    console.error("Error getting document by ID: ", error);
    throw new Error("Failed to get content item by ID.");
  }
}

// Update an existing content item
export async function updateContentItem(id: string, itemData: CineFormValues): Promise<void> {
  try {
    const docRef = doc(db, CONTENT_COLLECTION, id);
    // Ensure not to overwrite contentType if it's not part of partial update
    const updatePayload = { ...itemData };
    // delete (updatePayload as any).contentType; // contentType should not change

    await updateDoc(docRef, {
      ...updatePayload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating document: ", error);
    throw new Error("Failed to update content item.");
  }
}

// Delete a content item
export async function deleteContentItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CONTENT_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw new Error("Failed to delete content item.");
  }
}
