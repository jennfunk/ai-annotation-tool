import IndexedDBStorage from './indexedDBStorage';
import * as remoteStorage from './firebaseStorage';
import { auth } from './firebase';

let currentStorage = IndexedDBStorage;

// Initialize storage based on authentication state
export const initStorage = () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentStorage = remoteStorage;
      console.log('Using remote storage (Firebase)');
    } else {
      currentStorage = IndexedDBStorage;
      console.log('Using local storage (IndexedDB)');
    }
  });
};

// User is authenticated
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Authentication methods
export const signIn = remoteStorage.signIn;
export const signUp = remoteStorage.signUp;
export const signOut = remoteStorage.signOut;

// Data access methods - these will use either local or remote storage
// based on authentication state

// Thread operations
export const getThreads = async () => {
  try {
    if (currentStorage === IndexedDBStorage) {
      return await IndexedDBStorage.getThreads();
    } else {
      return await remoteStorage.getThreads();
    }
  } catch (error) {
    console.error('Error getting threads:', error);
    throw error;
  }
};

export const getThread = async (threadId) => {
  try {
    if (currentStorage === IndexedDBStorage) {
      return await IndexedDBStorage.getThreadById(threadId);
    } else {
      return await remoteStorage.getThread(threadId);
    }
  } catch (error) {
    console.error(`Error getting thread ${threadId}:`, error);
    throw error;
  }
};

export const saveThread = async (thread) => {
  try {
    if (currentStorage === IndexedDBStorage) {
      // Since IndexedDB doesn't have a direct saveThread function,
      // we get all existing threads, add/update this one, and save all
      const threads = await IndexedDBStorage.getThreads();
      const index = threads.findIndex(t => t.id === thread.id);
      
      if (index >= 0) {
        threads[index] = thread;
      } else {
        threads.push(thread);
      }
      
      await IndexedDBStorage.saveThreads(threads);
      return thread;
    } else {
      return await remoteStorage.saveThread(thread);
    }
  } catch (error) {
    console.error('Error saving thread:', error);
    throw error;
  }
};

// Save multiple threads at once
export const saveThreads = async (threads) => {
  try {
    if (currentStorage === IndexedDBStorage) {
      return await IndexedDBStorage.saveThreads(threads);
    } else {
      // In case the remote storage doesn't have a bulk save function,
      // we'll implement it by saving each thread individually
      const results = [];
      for (const thread of threads) {
        const result = await remoteStorage.saveThread(thread);
        results.push(result);
      }
      return true;
    }
  } catch (error) {
    console.error('Error saving threads:', error);
    return false;
  }
};

export const updateThread = async (threadId, updates) => {
  try {
    if (currentStorage === IndexedDBStorage) {
      // For IndexedDB, get the thread, update it, then save all threads
      const thread = await IndexedDBStorage.getThreadById(threadId);
      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }
      
      const updatedThread = {
        ...thread,
        ...updates
      };
      
      const threads = await IndexedDBStorage.getThreads();
      const index = threads.findIndex(t => t.id === threadId);
      
      if (index >= 0) {
        threads[index] = updatedThread;
      } else {
        threads.push(updatedThread);
      }
      
      await IndexedDBStorage.saveThreads(threads);
      return true;
    } else {
      return await remoteStorage.updateThread(threadId, updates);
    }
  } catch (error) {
    console.error(`Error updating thread ${threadId}:`, error);
    throw error;
  }
};

export const deleteThread = async (threadId) => {
  try {
    if (currentStorage === IndexedDBStorage) {
      // For IndexedDB, get all threads, remove the one to delete, then save
      const threads = await IndexedDBStorage.getThreads();
      const filteredThreads = threads.filter(t => t.id !== threadId);
      
      // If no thread was removed, it didn't exist
      if (filteredThreads.length === threads.length) {
        return false;
      }
      
      await IndexedDBStorage.saveThreads(filteredThreads);
      return true;
    } else {
      return await remoteStorage.deleteThread(threadId);
    }
  } catch (error) {
    console.error(`Error deleting thread ${threadId}:`, error);
    throw error;
  }
};

export const importThreads = async (threads) => {
  try {
    if (currentStorage === IndexedDBStorage) {
      // For IndexedDB, get all existing threads, add the new ones, then save all
      const existingThreads = await IndexedDBStorage.getThreads();
      const combinedThreads = [...existingThreads, ...threads];
      
      await IndexedDBStorage.saveThreads(combinedThreads);
      return threads;
    } else {
      return await remoteStorage.importThreads(threads);
    }
  } catch (error) {
    console.error('Error importing threads:', error);
    throw error;
  }
};

// For annotation-specific operations
export const updateAnnotation = async (threadId, annotationData) => {
  try {
    // Get the thread first
    const thread = await getThread(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }
    
    // Add the new annotation
    const existingAnnotations = Array.isArray(thread.annotations) 
      ? thread.annotations 
      : thread.annotations ? [thread.annotations] : [];
    
    // Add the new annotation to the array
    const updatedThread = {
      ...thread,
      isAnnotated: true,
      annotations: [
        ...existingAnnotations,
        {
          ...annotationData,
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    // Update the thread
    return await updateThread(threadId, updatedThread);
  } catch (error) {
    console.error(`Error updating annotation for thread ${threadId}:`, error);
    throw error;
  }
};

export const deleteAnnotation = async (threadId, annotationIndex) => {
  try {
    // Get the thread first
    const thread = await getThread(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }
    
    // Create a copy of annotations without the deleted one
    const updatedAnnotations = Array.isArray(thread.annotations) 
      ? [...thread.annotations] 
      : thread.annotations ? [thread.annotations] : [];
    
    if (updatedAnnotations.length > annotationIndex) {
      updatedAnnotations.splice(annotationIndex, 1);
    }
    
    // Update the thread
    const updatedThread = {
      ...thread,
      annotations: updatedAnnotations,
      isAnnotated: updatedAnnotations.length > 0
    };
    
    // Update the thread
    return await updateThread(threadId, updatedThread);
  } catch (error) {
    console.error(`Error deleting annotation for thread ${threadId}:`, error);
    throw error;
  }
};

// For debugging and testing
export const getStorageType = () => {
  return currentStorage === IndexedDBStorage ? 'Local Storage (IndexedDB)' : 'Remote Storage (Firebase)';
};

export const testStorage = async () => {
  try {
    const testId = `test-${Date.now()}`;
    const testData = {
      id: testId,
      message: 'Test data',
      timestamp: new Date().toISOString()
    };
    
    if (currentStorage === IndexedDBStorage) {
      const threads = await IndexedDBStorage.getThreads();
      threads.push(testData);
      await IndexedDBStorage.saveThreads(threads);
      
      const retrievedThreads = await IndexedDBStorage.getThreads();
      const retrieved = retrievedThreads.find(t => t.id === testId);
      
      // Clean up
      const cleanedThreads = retrievedThreads.filter(t => t.id !== testId);
      await IndexedDBStorage.saveThreads(cleanedThreads);
      
      return {
        isAvailable: true,
        testPassed: retrieved && retrieved.id === testId,
        isWorking: true
      };
    } else {
      await remoteStorage.saveThread(testData);
      const retrieved = await remoteStorage.getThread(testId);
      await remoteStorage.deleteThread(testId);
      
      return {
        isAvailable: true,
        testPassed: retrieved && retrieved.id === testId,
        isWorking: true
      };
    }
  } catch (error) {
    console.error('Storage test failed:', error);
    return {
      isAvailable: false,
      testPassed: false,
      isWorking: false,
      error: error.message
    };
  }
};

// Sync data from local to remote storage
export const syncToRemote = async () => {
  if (!isAuthenticated()) {
    throw new Error('User not authenticated');
  }
  
  try {
    // Get all local threads
    const localThreads = await IndexedDBStorage.getThreads();
    
    // Import them to remote storage
    if (localThreads.length > 0) {
      await remoteStorage.importThreads(localThreads);
      console.log(`Synced ${localThreads.length} threads to remote storage`);
    }
    
    return localThreads.length;
  } catch (error) {
    console.error('Error syncing to remote:', error);
    throw error;
  }
}; 