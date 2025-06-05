// src/lib/firebaseService.ts
'use server';

import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { CineFormValues, VideoSource, EpisodeFormValues, SeasonFormValues } from './schemas';
import type { StoredCineItem, StoredMovieItem, StoredSeriesItem } from '@/types';

const CONTENT_COLLECTION = 'contentItems';

function mapDocToStoredCineItem(document: ReturnType<typeof docSnap.data> & { id: string }): StoredCineItem {
    const data = document as any; 
    
    let createdAtISO: string | undefined = undefined;
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      createdAtISO = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === 'string') {
      createdAtISO = data.createdAt;
    }

    let updatedAtISO: string | undefined = undefined;
    if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
      updatedAtISO = data.updatedAt.toDate().toISOString();
    } else if (typeof data.updatedAt === 'string') {
      updatedAtISO = data.updatedAt;
    }
    
    const baseMappedItem = {
        id: document.id,
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
        createdAt: createdAtISO,
        updatedAt: updatedAtISO,
    };

    if (data.contentType === 'movie') {
        return {
            ...baseMappedItem,
            contentType: 'movie',
            videoSources: (data.videoSources || []) as VideoSource[],
            linkLegendas: data.linkLegendas || '',
        } as StoredMovieItem;
    } else if (data.contentType === 'series') {
        const mappedTemporadas = (Array.isArray(data.temporadas) ? data.temporadas : []).map((season: any) => ({
            id: season.id || undefined,
            numeroTemporada: season.numeroTemporada || 0,
            episodios: (Array.isArray(season.episodios) ? season.episodios : []).map((ep: any) => ({
                id: ep.id || undefined,
                titulo: ep.titulo || '',
                descricao: ep.descricao || '',
                duracao: ep.duracao !== undefined ? ep.duracao : null,
                videoSources: (ep.videoSources || []) as VideoSource[],
                linkLegenda: ep.linkLegenda || '',
            })),
        }));
        return {
            ...baseMappedItem,
            contentType: 'series',
            totalTemporadas: data.totalTemporadas !== undefined ? data.totalTemporadas : null,
            temporadas: mappedTemporadas,
        } as StoredSeriesItem;
    }
    // Fallback for unknown or missing contentType, though schema should prevent this
    // For safety, we can return a base structure or throw an error.
    // Here, we'll assume contentType is always 'movie' or 'series'.
    // To satisfy TypeScript, we need a default or throw. Let's throw for clarity on bad data.
    throw new Error(`Unknown content type: ${data.contentType} for document ID: ${document.id}`);
}


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

export async function updateContentItem(id: string, itemData: CineFormValues): Promise<void> {
  try {
    const docRef = doc(db, CONTENT_COLLECTION, id);
    const updatePayload = { ...itemData };

    await updateDoc(docRef, {
      ...updatePayload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating document: ", error);
    throw new Error("Failed to update content item.");
  }
}

export async function deleteContentItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CONTENT_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw new Error("Failed to delete content item.");
  }
}