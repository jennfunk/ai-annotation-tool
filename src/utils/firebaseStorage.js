import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

// Debug mode
const DEBUG = true;

// Log helper
const log = (message, data) => {
  if (DEBUG) {
    console.log(`[FirebaseStorage] ${message}`, data || '');
  }
};

// Collection names
const THREADS_COLLECTION = 'threads';
const ANNOTATIONS_COLLECTION = 'annotations';

// User authentication
export const signIn = (email, password) => {
  log(`Signing in user: ${email}`);
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = (email, password) => {
  log(`Creating new user: ${email}`);
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = () => {
  log('Signing out user');
  return firebaseSignOut(auth);
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

// Thread operations - modified for shared access
export const saveThread = async (thread) => {
  if (!auth.currentUser) {
    log('User not authenticated during saveThread');
    throw new Error('User not authenticated');
  }
  
  try {
    log(`Saving thread ${thread.id}`);
    
    const threadRef = doc(db, THREADS_COLLECTION, thread.id);
    
    // Add last modified user and timestamp but don't restrict by user
    const threadWithMeta = {
      ...thread,
      lastModifiedBy: auth.currentUser.email,
      lastModifiedByUid: auth.currentUser.uid,
      updatedAt: serverTimestamp(),
      createdAt: thread.createdAt || serverTimestamp()
    };
    
    await setDoc(threadRef, threadWithMeta);
    log(`Thread ${thread.id} saved successfully`);
    return threadWithMeta;
  } catch (error) {
    console.error(`Error saving thread ${thread?.id}:`, error);
    throw error;
  }
};

export const getThreads = async () => {
  if (!auth.currentUser) {
    log('User not authenticated during getThreads');
    throw new Error('User not authenticated');
  }
  
  try {
    log('Getting all threads (shared access)');
    
    // Get all threads without filtering by user
    const threadsQuery = query(
      collection(db, THREADS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(threadsQuery);
    const threads = snapshot.docs.map(doc => doc.data());
    log(`Retrieved ${threads.length} threads`);
    return threads;
  } catch (error) {
    console.error('Error getting threads:', error);
    throw error;
  }
};

export const getThread = async (threadId) => {
  if (!auth.currentUser) {
    log('User not authenticated during getThread');
    throw new Error('User not authenticated');
  }
  
  try {
    log(`Getting thread ${threadId}`);
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      log(`Thread ${threadId} not found`);
      return null;
    }
    
    const threadData = threadSnap.data();
    log(`Thread ${threadId} retrieved successfully`);
    return threadData;
  } catch (error) {
    console.error(`Error getting thread ${threadId}:`, error);
    throw error;
  }
};

export const updateThread = async (threadId, updates) => {
  if (!auth.currentUser) {
    log('User not authenticated during updateThread');
    throw new Error('User not authenticated');
  }
  
  try {
    log(`Updating thread ${threadId}`);
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      log(`Thread ${threadId} not found for update`);
      throw new Error('Thread not found');
    }
    
    const updateData = {
      ...updates,
      lastModifiedBy: auth.currentUser.email,
      lastModifiedByUid: auth.currentUser.uid,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(threadRef, updateData);
    log(`Thread ${threadId} updated successfully`);
    return true;
  } catch (error) {
    console.error(`Error updating thread ${threadId}:`, error);
    throw error;
  }
};

export const deleteThread = async (threadId) => {
  if (!auth.currentUser) {
    log('User not authenticated during deleteThread');
    throw new Error('User not authenticated');
  }
  
  try {
    log(`Deleting thread ${threadId}`);
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      log(`Thread ${threadId} not found for deletion`);
      throw new Error('Thread not found');
    }
    
    await deleteDoc(threadRef);
    log(`Thread ${threadId} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`Error deleting thread ${threadId}:`, error);
    throw error;
  }
};

// Import multiple threads
export const importThreads = async (threads) => {
  if (!auth.currentUser) {
    log('User not authenticated during importThreads');
    throw new Error('User not authenticated');
  }
  
  try {
    log(`Importing ${threads.length} threads for shared access`);
    
    const results = [];
    
    for (const thread of threads) {
      const threadWithMeta = {
        ...thread,
        importedBy: auth.currentUser.email,
        importedByUid: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
        createdAt: thread.createdAt || serverTimestamp()
      };
      
      const threadRef = doc(db, THREADS_COLLECTION, thread.id);
      await setDoc(threadRef, threadWithMeta);
      results.push(threadWithMeta);
    }
    
    log(`Successfully imported ${results.length} threads`);
    return results;
  } catch (error) {
    console.error(`Error importing threads:`, error);
    throw error;
  }
}; 