
// src/lib/firebaseService.ts
'use server';

import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, query, orderBy, Timestamp, setDoc } from 'firebase/firestore';
import type { CineFormValues, VideoSource as FormVideoSource, EpisodeFormValues, SeasonFormValues } from './schemas';
import type { StoredCineItem, StoredMovieItem, StoredSeriesItem, VideoSource as StoredVideoSource, Episode, Season, NewsBannerMessage } from '@/types';

const CONTENT_COLLECTION = 'contentItems';
const SITE_CONFIGURATION_COLLECTION = 'siteConfiguration';
const NEWS_BANNER_DOC_ID = 'newsBannerControls';


// Helper to safely map video sources, ensuring all fields are present or defaulted
function mapVideoSources(sourcesFromDb: any[] | undefined): StoredVideoSource[] {
  if (!Array.isArray(sourcesFromDb)) {
    return [];
  }
  return sourcesFromDb.map((vs: any) => ({
    id: vs.id, // id is optional, can be undefined
    serverName: typeof vs.serverName === 'string' ? vs.serverName : '',
    url: typeof vs.url === 'string' ? vs.url : '',
  }));
}

// Helper to safely map episodes
function mapEpisodes(episodesFromDb: any[] | undefined): Episode[] {
  if (!Array.isArray(episodesFromDb)) {
    return [];
  }
  return episodesFromDb.map((ep: any) => ({
    id: ep.id, // id is optional
    titulo: typeof ep.titulo === 'string' ? ep.titulo : '',
    descricao: typeof ep.descricao === 'string' ? ep.descricao : '',
    duracao: (ep.duracao !== undefined && ep.duracao !== null && !isNaN(Number(ep.duracao))) ? Number(ep.duracao) : null,
    videoSources: mapVideoSources(ep.videoSources),
    linkLegenda: typeof ep.linkLegenda === 'string' ? ep.linkLegenda : '',
  }));
}

// Helper to safely map seasons
function mapSeasons(seasonsFromDb: any[] | undefined): Season[] {
  if (!Array.isArray(seasonsFromDb)) {
    return [];
  }
  return seasonsFromDb.map((season: any) => ({
    id: season.id, // id is optional
    numeroTemporada: (season.numeroTemporada !== undefined && !isNaN(Number(season.numeroTemporada))) ? Number(season.numeroTemporada) : 0,
    episodios: mapEpisodes(season.episodios),
  }));
}


function mapDocToStoredCineItem(document: { data: () => any; id: string }): StoredCineItem {
    const data = document.data(); 
    
    let createdAtISO: string | undefined = undefined;
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      createdAtISO = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === 'string') {
      // Handle cases where it might already be an ISO string (e.g., from a previous incorrect save)
      try {
        createdAtISO = new Date(data.createdAt).toISOString();
      } catch (e) { /* ignore if invalid date string */ }
    }

    let updatedAtISO: string | undefined = undefined;
    if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
      updatedAtISO = data.updatedAt.toDate().toISOString();
    } else if (typeof data.updatedAt === 'string') {
      try {
        updatedAtISO = new Date(data.updatedAt).toISOString();
      } catch (e) { /* ignore if invalid date string */ }
    }
    
    const baseMappedItem = {
        id: document.id,
        tmdbSearchQuery: typeof data.tmdbSearchQuery === 'string' ? data.tmdbSearchQuery : '',
        tituloOriginal: typeof data.tituloOriginal === 'string' ? data.tituloOriginal : '',
        tituloLocalizado: typeof data.tituloLocalizado === 'string' ? data.tituloLocalizado : '',
        sinopse: typeof data.sinopse === 'string' ? data.sinopse : '',
        generos: typeof data.generos === 'string' ? data.generos : '',
        idiomaOriginal: typeof data.idiomaOriginal === 'string' ? data.idiomaOriginal : '',
        dublagensDisponiveis: typeof data.dublagensDisponiveis === 'string' ? data.dublagensDisponiveis : '',
        anoLancamento: (data.anoLancamento !== undefined && data.anoLancamento !== null && !isNaN(Number(data.anoLancamento))) ? Number(data.anoLancamento) : null,
        duracaoMedia: (data.duracaoMedia !== undefined && data.duracaoMedia !== null && !isNaN(Number(data.duracaoMedia))) ? Number(data.duracaoMedia) : null,
        classificacaoIndicativa: typeof data.classificacaoIndicativa === 'string' ? data.classificacaoIndicativa : '',
        qualidade: typeof data.qualidade === 'string' ? data.qualidade : '',
        capaPoster: typeof data.capaPoster === 'string' ? data.capaPoster : '',
        bannerFundo: typeof data.bannerFundo === 'string' ? data.bannerFundo : '',
        tags: typeof data.tags === 'string' ? data.tags : '',
        destaqueHome: typeof data.destaqueHome === 'boolean' ? data.destaqueHome : false,
        status: (data.status === 'ativo' || data.status === 'inativo') ? data.status : 'ativo',
        createdAt: createdAtISO,
        updatedAt: updatedAtISO,
    };

    if (data.contentType === 'movie') {
        return {
            ...baseMappedItem,
            contentType: 'movie',
            videoSources: mapVideoSources(data.videoSources),
            linkLegendas: typeof data.linkLegendas === 'string' ? data.linkLegendas : '',
        } as StoredMovieItem;
    } else if (data.contentType === 'series') {
        return {
            ...baseMappedItem,
            contentType: 'series',
            totalTemporadas: (data.totalTemporadas !== undefined && data.totalTemporadas !== null && !isNaN(Number(data.totalTemporadas))) ? Number(data.totalTemporadas) : null,
            temporadas: mapSeasons(data.temporadas),
        } as StoredSeriesItem;
    }
    
    console.warn(`Unknown or missing content type for document ID: ${document.id}. Data:`, data);
    // Fallback: return a structure that won't break things too badly, or consider if this should throw.
    // For now, try to map as a movie with minimal data if contentType is unrecognized.
    // This helps prevent app crashes but might hide data issues.
     return {
        ...baseMappedItem,
        contentType: 'movie', // Defaulting to movie might be problematic; consider logging this case.
        videoSources: [],
        linkLegendas: '',
    } as StoredMovieItem;
}


export async function addContentItem(itemData: CineFormValues): Promise<string> {
  try {
    // Ensure timestamps are not explicitly set to allow serverTimestamp to work
    const { createdAt, updatedAt, ...dataToSend } = itemData as any;

    const docRef = await addDoc(collection(db, CONTENT_COLLECTION), {
      ...dataToSend,
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
    return querySnapshot.docs.map(docSnap => mapDocToStoredCineItem({ data: () => docSnap.data(), id: docSnap.id }));
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
      return mapDocToStoredCineItem({ data: () => docSnap.data(), id: docSnap.id });
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
    // Ensure timestamps are not explicitly set to allow serverTimestamp to work
    const { createdAt, updatedAt, ...dataToUpdate } = itemData as any;

    await updateDoc(docRef, {
      ...dataToUpdate,
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

// News Banner Firebase Service Functions
export async function setNewsBannerMessage(data: Omit<NewsBannerMessage, 'id' | 'updatedAt'>): Promise<void> {
  try {
    const docRef = doc(db, SITE_CONFIGURATION_COLLECTION, NEWS_BANNER_DOC_ID);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error setting news banner message: ", error);
    throw new Error("Failed to set news banner message.");
  }
}

export async function getNewsBannerMessage(): Promise<NewsBannerMessage | null> {
  try {
    const docRef = doc(db, SITE_CONFIGURATION_COLLECTION, NEWS_BANNER_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let updatedAtISO: string | undefined = undefined;
      if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
        updatedAtISO = data.updatedAt.toDate().toISOString();
      } else if (typeof data.updatedAt === 'string') {
         try { updatedAtISO = new Date(data.updatedAt).toISOString(); } catch (e) { /* ignore */ }
      }
      return {
        id: docSnap.id,
        message: data.message || '',
        type: data.type || 'none',
        isActive: typeof data.isActive === 'boolean' ? data.isActive : false,
        link: data.link || undefined,
        linkText: data.linkText || undefined,
        updatedAt: updatedAtISO,
      } as NewsBannerMessage;
    }
    return null;
  } catch (error) {
    console.error("Error getting news banner message: ", error);
    // It's okay if it fails silently on the client, banner just won't show.
    // For admin, errors might be more critical.
    return null; 
  }
}
    
