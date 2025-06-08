
// src/lib/firebaseService.ts
'use server';

import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, serverTimestamp, query, orderBy, Timestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import type { CineFormValues, VideoSource as FormVideoSource, EpisodeFormValues, SeasonFormValues } from './schemas';
import type { StoredCineItem, StoredMovieItem, StoredSeriesItem, VideoSource as StoredVideoSource, Episode, Season, NewsBannerMessage, UserFeedbackItem, FeedbackStatus } from '@/types';

const CONTENT_COLLECTION = 'contentItems';
const SITE_CONFIGURATION_COLLECTION = 'siteConfiguration';
const NEWS_BANNER_DOC_ID = 'newsBannerControls';
const FEEDBACK_COLLECTION = 'feedbackItems';
const USER_PUSH_TOKENS_COLLECTION = 'userPushTokens';


// Helper to safely map video sources, ensuring all fields are present or defaulted
function mapVideoSources(sourcesFromDb: any[] | undefined): StoredVideoSource[] {
  if (!Array.isArray(sourcesFromDb)) {
    return [];
  }
  return sourcesFromDb.map((vs: any) => ({
    id: vs.id, // id is optional, can be undefined
    serverName: typeof vs.serverName === 'string' ? vs.serverName : '',
    sourceType: (vs.sourceType === 'directUrl' || vs.sourceType === 'embedCode') ? vs.sourceType : 'directUrl', // Default to directUrl if invalid
    content: typeof vs.content === 'string' ? vs.content : '',
  })).filter(vs => vs.content); // Ensure content is not empty
}

// mapEmbedUrls is no longer needed.

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
    videoSources: mapVideoSources(ep.videoSources), // Uses updated mapVideoSources
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
        tmdbId: (data.tmdbId !== undefined && !isNaN(Number(data.tmdbId))) ? Number(data.tmdbId) : null, // Map tmdbId
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

    console.warn("Unknown or missing content type for document ID: " + document.id + ". Data:", data);
    return {
        ...baseMappedItem,
        contentType: 'movie', 
        videoSources: [],
        linkLegendas: '',
    } as StoredMovieItem;
}


export async function addContentItem(itemData: CineFormValues): Promise<string> {
  try {
    const { createdAt, updatedAt, ...dataToSend } = itemData as any;
    dataToSend.tmdbId = itemData.tmdbId || null; // Ensure tmdbId is included

    if (dataToSend.videoSources && Array.isArray(dataToSend.videoSources)) {
      dataToSend.videoSources = dataToSend.videoSources.map((vs: any) => ({
        serverName: vs.serverName || '',
        sourceType: vs.sourceType || 'directUrl',
        content: vs.content || '',
      })).filter((vs: any) => vs.content && vs.serverName);
    }
    if (dataToSend.contentType === 'series' && dataToSend.temporadas && Array.isArray(dataToSend.temporadas)) {
      dataToSend.temporadas = dataToSend.temporadas.map((season: any) => ({
        ...season,
        episodios: (season.episodios || []).map((ep: any) => ({
          ...ep,
          videoSources: (ep.videoSources || []).map((vs: any) => ({
            serverName: vs.serverName || '',
            sourceType: vs.sourceType || 'directUrl',
            content: vs.content || '',
          })).filter((vs: any) => vs.content && vs.serverName),
        })),
      }));
    }

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

    const { createdAt, updatedAt, ...dataToUpdate } = itemData as any;
    dataToUpdate.tmdbId = itemData.tmdbId || null; // Ensure tmdbId is included

    if (dataToUpdate.videoSources && Array.isArray(dataToUpdate.videoSources)) {
      dataToUpdate.videoSources = dataToUpdate.videoSources.map((vs: any) => ({
        serverName: vs.serverName || '',
        sourceType: vs.sourceType || 'directUrl',
        content: vs.content || '',
      })).filter((vs: any) => vs.content && vs.serverName);
    }
     if (dataToUpdate.contentType === 'series' && dataToUpdate.temporadas && Array.isArray(dataToUpdate.temporadas)) {
      dataToUpdate.temporadas = dataToUpdate.temporadas.map((season: any) => ({
        ...season,
        episodios: (season.episodios || []).map((ep: any) => ({
          ...ep,
          videoSources: (ep.videoSources || []).map((vs: any) => ({
            serverName: vs.serverName || '',
            sourceType: vs.sourceType || 'directUrl',
            content: vs.content || '',
          })).filter((vs: any) => vs.content && vs.serverName),
        })),
      }));
    }


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
    return null;
  }
}

// User Feedback Firebase Service Functions
export async function submitUserFeedback(feedbackData: FeedbackFormValues): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
      ...feedbackData,
      status: 'novo' as FeedbackStatus, 
      submittedAt: serverTimestamp(),
      adminResponse: '',
      respondedAt: null,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error submitting user feedback: ", error);
    throw new Error("Failed to submit feedback.");
  }
}

function mapDocToUserFeedbackItem(document: { data: () => any; id: string }): UserFeedbackItem {
  const data = document.data();

  let submittedAtISO: string = new Date().toISOString(); 
  if (data.submittedAt && typeof data.submittedAt.toDate === 'function') {
    submittedAtISO = data.submittedAt.toDate().toISOString();
  } else if (typeof data.submittedAt === 'string') {
    try { submittedAtISO = new Date(data.submittedAt).toISOString(); } catch (e) { /* ignore */ }
  }

  let respondedAtISO: string | undefined = undefined;
  if (data.respondedAt && typeof data.respondedAt.toDate === 'function') {
    respondedAtISO = data.respondedAt.toDate().toISOString();
  } else if (typeof data.respondedAt === 'string') {
    try { respondedAtISO = new Date(data.respondedAt).toISOString(); } catch (e) { /* ignore */ }
  }

  return {
    id: document.id,
    userId: data.userId, 
    contentId: data.contentId,
    contentTitle: data.contentTitle,
    feedbackType: data.feedbackType || 'outro',
    message: data.message || '',
    status: data.status || 'novo',
    adminResponse: data.adminResponse || '',
    submittedAt: submittedAtISO,
    respondedAt: respondedAtISO,
  };
}


export async function getFeedbackItemsAdmin(): Promise<UserFeedbackItem[]> {
  try {
    const q = query(collection(db, FEEDBACK_COLLECTION), orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => mapDocToUserFeedbackItem({ data: () => docSnap.data(), id: docSnap.id }));
  } catch (error) {
    console.error("Error getting feedback items: ", error);
    throw new Error("Failed to get feedback items.");
  }
}

export async function updateFeedbackItemAdmin(feedbackId: string, updates: { adminResponse?: string; status?: FeedbackStatus }): Promise<void> {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    const dataToUpdate: any = { ...updates };
    if (updates.adminResponse !== undefined || updates.status !== undefined) {
      dataToUpdate.respondedAt = serverTimestamp();
    }
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating feedback item: ", error);
    throw new Error("Failed to update feedback item.");
  }
}


// Push Notification Token Management
export async function saveUserPushToken(userId: string, token: string): Promise<void> {
  try {
    const tokensRef = collection(db, USER_PUSH_TOKENS_COLLECTION);
    const q = query(tokensRef, where("userId", "==", userId), where("token", "==", token));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(tokensRef, {
        userId,
        token,
        createdAt: serverTimestamp(),
      });
      console.log("Push token saved for user:", userId);
    } else {
      console.log("Push token already exists for user:", userId);
      querySnapshot.forEach(async (docSnap) => {
        await updateDoc(doc(db, USER_PUSH_TOKENS_COLLECTION, docSnap.id), {
          updatedAt: serverTimestamp() 
        });
      });
    }
  } catch (error) {
    console.error("Error saving user push token: ", error);
  }
}

export async function deleteUserPushToken(token: string): Promise<void> {
  try {
    const tokensRef = collection(db, USER_PUSH_TOKENS_COLLECTION);
    const q = query(tokensRef, where("token", "==", token));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    console.log("Push token deleted:", token);
  } catch (error) {
    console.error("Error deleting user push token: ", error);
  }
}

