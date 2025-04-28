/**
 * Enhanced Storage Utility
 * 
 * Provides methods for storing and retrieving data using IndexedDB (primary) with localStorage fallback:
 * - Thread data (conversations)
 * - Annotation data (ratings, notes, tags)
 * - Export/import functionality
 */

import IndexedDBStorage from './indexedDBStorage';

// Debug mode - set to true to enable console logging
const DEBUG = true;

// Log helper
const log = (message, data) => {
  if (DEBUG) {
    console.log(`[StorageManager] ${message}`, data || '');
  }
};

const STORAGE_KEYS = {
  THREADS: 'threads',
  SETTINGS: 'settings'
};

// Check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    log('localStorage is not available', e);
    return false;
  }
};

// Check if IndexedDB is available
const isIndexedDBAvailable = async () => {
  try {
    // Try to initialize IndexedDB
    await IndexedDBStorage.init();
    const testResult = await IndexedDBStorage.testStorage();
    return testResult.isAvailable && testResult.isWorking;
  } catch (e) {
    log('IndexedDB is not available', e);
    return false;
  }
};

// Main storage API
const StorageManager = {
  // Track which storage is being used
  _usingIndexedDB: null,
  
  /**
   * Initialize the storage system, preferring IndexedDB if available
   * @returns {Promise<boolean>} Promise resolving to true if initialized successfully
   */
  init: async () => {
    try {
      if (StorageManager._usingIndexedDB !== null) {
        return StorageManager._usingIndexedDB;
      }
      
      const indexedDBAvailable = await isIndexedDBAvailable();
      StorageManager._usingIndexedDB = indexedDBAvailable;
      
      log(`Storage initialized using ${indexedDBAvailable ? 'IndexedDB' : 'localStorage'}`);
      return true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      StorageManager._usingIndexedDB = false;
      return false;
    }
  },
  
  /**
   * Get all conversation threads
   * @returns {Promise<Array>} Promise resolving to array of thread objects
   */
  getThreads: async () => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.getThreads();
      }
      
      // Fallback to localStorage
      const threadsJson = localStorage.getItem(STORAGE_KEYS.THREADS);
      return threadsJson ? JSON.parse(threadsJson) : [];
    } catch (error) {
      console.error('Error getting threads from storage:', error);
      return [];
    }
  },

  /**
   * Save all conversation threads
   * @param {Array} threads Array of thread objects
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  saveThreads: async (threads) => {
    if (!threads || !Array.isArray(threads)) {
      console.error('Invalid threads data provided to saveThreads');
      return false;
    }

    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Safety check - make sure it's an array and remove any undefined/null items
      const cleanedThreads = threads.filter(thread => thread && typeof thread === 'object');
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.saveThreads(cleanedThreads);
      }
      
      // Fallback to localStorage
      const threadsJson = JSON.stringify(cleanedThreads);
      localStorage.setItem(STORAGE_KEYS.THREADS, threadsJson);
      
      // Verify the save was successful
      const savedData = localStorage.getItem(STORAGE_KEYS.THREADS);
      if (!savedData) {
        console.error('Failed to verify thread save - no data retrieved after save');
        return false;
      }
      
      try {
        // Parse the saved data to ensure it's valid JSON
        const parsedData = JSON.parse(savedData);
        if (!Array.isArray(parsedData)) {
          console.error('Saved threads data is not an array');
          return false;
        }
        
        // Extra validation for important save operations
        if (parsedData.length !== cleanedThreads.length) {
          console.warn(`Thread count mismatch after save: ${parsedData.length} vs ${cleanedThreads.length}`);
        }
        
        return true;
      } catch (parseError) {
        console.error('Error parsing saved threads data:', parseError);
        return false;
      }
    } catch (error) {
      console.error('Error saving threads to storage:', error);
      return false;
    }
  },

  /**
   * Get a specific thread by ID
   * @param {string} threadId The ID of the thread to retrieve
   * @returns {Promise<Object|null>} Promise resolving to the thread object or null
   */
  getThreadById: async (threadId) => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.getThreadById(threadId);
      }
      
      // Fallback to localStorage
      const threads = await StorageManager.getThreads();
      return threads.find(thread => thread.id === threadId) || null;
    } catch (error) {
      console.error(`Error getting thread ${threadId}:`, error);
      return null;
    }
  },

  /**
   * Save or update a specific thread
   * @param {Object} thread The thread object to save
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  saveThread: async (thread) => {
    if (!thread || !thread.id) {
      console.error('Cannot save thread: Invalid thread object');
      return false;
    }

    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.saveThread(thread);
      }
      
      // Fallback to localStorage
      const threads = await StorageManager.getThreads();
      const existingIndex = threads.findIndex(t => t.id === thread.id);
      
      if (existingIndex >= 0) {
        // Update existing thread
        threads[existingIndex] = thread;
        log(`Updated thread with ID ${thread.id}`);
      } else {
        // Add new thread
        threads.push(thread);
        log(`Added new thread with ID ${thread.id}`);
      }

      return await StorageManager.saveThreads(threads);
    } catch (error) {
      console.error(`Error saving thread ${thread.id}:`, error);
      return false;
    }
  },

  /**
   * Delete a thread by ID
   * @param {string} threadId The ID of the thread to delete
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  deleteThread: async (threadId) => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.deleteThread(threadId);
      }
      
      // Fallback to localStorage
      const threads = await StorageManager.getThreads();
      const filteredThreads = threads.filter(thread => thread.id !== threadId);
      
      if (filteredThreads.length === threads.length) {
        // Thread not found
        log(`Thread with ID ${threadId} not found for deletion`);
        return false;
      }
      
      log(`Deleting thread with ID ${threadId}`);
      return await StorageManager.saveThreads(filteredThreads);
    } catch (error) {
      console.error(`Error deleting thread ${threadId}:`, error);
      return false;
    }
  },

  /**
   * Update annotations for a specific thread
   * @param {string} threadId The ID of the thread to update
   * @param {Object} annotationData Data containing rating, notes, and/or tags
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  updateAnnotation: async (threadId, annotationData) => {
    try {
      const thread = await StorageManager.getThreadById(threadId);
      if (!thread) {
        console.error(`Thread with ID ${threadId} not found`);
        return false;
      }

      // Update the thread's annotations
      thread.isAnnotated = true;
      
      // Get existing annotations or create empty array
      const existingAnnotations = Array.isArray(thread.annotations) 
        ? thread.annotations 
        : thread.annotations ? [thread.annotations] : [];
      
      // Add the new annotation to the array
      thread.annotations = [
        ...existingAnnotations,
        {
          ...annotationData,
          timestamp: new Date().toISOString()
        }
      ];

      log(`Updated annotations for thread ${threadId}`, thread.annotations);
      return await StorageManager.saveThread(thread);
    } catch (error) {
      console.error(`Error updating annotations for thread ${threadId}:`, error);
      return false;
    }
  },

  /**
   * Export all data as a JSON file download
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  exportData: async () => {
    try {
      const threads = await StorageManager.getThreads();
      const settings = await StorageManager.getSettings();
      
      const exportData = {
        threads,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      // Create a download link and trigger it
      const exportFileName = `ai-annotation-data-${new Date().toISOString().slice(0, 10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.style.display = 'none';
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      
      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  },

  /**
   * Import data from a JSON file
   * @param {Object} importData The parsed data object to import
   * @param {boolean} replace Whether to replace all existing data or merge
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  importData: async (importData, replace = false) => {
    try {
      if (!importData || !importData.threads) {
        console.error('Invalid import data format');
        return false;
      }
      
      if (replace) {
        // Replace all existing data
        await StorageManager.saveThreads(importData.threads);
        if (importData.settings) {
          await StorageManager.saveSettings(importData.settings);
        }
      } else {
        // Merge with existing data
        const existingThreads = await StorageManager.getThreads();
        const mergedThreads = [...existingThreads];
        
        // Add or update threads from import data
        importData.threads.forEach(importThread => {
          const existingIndex = mergedThreads.findIndex(t => t.id === importThread.id);
          if (existingIndex >= 0) {
            // Update existing thread
            mergedThreads[existingIndex] = importThread;
          } else {
            // Add new thread
            mergedThreads.push(importThread);
          }
        });
        
        await StorageManager.saveThreads(mergedThreads);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  /**
   * Get application settings
   * @returns {Promise<Object>} Promise resolving to settings object
   */
  getSettings: async () => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.getSettings();
      }
      
      // Fallback to localStorage
      if (!isLocalStorageAvailable()) {
        return {};
      }
      
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : {};
    } catch (error) {
      console.error('Error retrieving settings:', error);
      return {};
    }
  },

  /**
   * Save application settings
   * @param {Object} settings Settings object
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  saveSettings: async (settings) => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.saveSettings(settings);
      }
      
      // Fallback to localStorage
      if (!isLocalStorageAvailable()) {
        return false;
      }
      
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  /**
   * Clear all stored data
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  clearAllData: async () => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.clearAllData();
      }
      
      // Fallback to localStorage
      if (!isLocalStorageAvailable()) {
        return false;
      }
      
      localStorage.removeItem(STORAGE_KEYS.THREADS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Promise resolving to storage information
   */
  getStorageInfo: async () => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        return await IndexedDBStorage.getStorageInfo();
      }
      
      // Fallback to localStorage
      if (!isLocalStorageAvailable()) {
        return {
          error: 'localStorage is not available'
        };
      }
      
      // Calculate localStorage usage
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += (item.length * 2) / 1024; // Size in KB (UTF-16 is 2 bytes per char)
          }
        }
      }
      
      const threadsSize = (localStorage.getItem(STORAGE_KEYS.THREADS)?.length || 0) * 2 / 1024;
      const settingsSize = (localStorage.getItem(STORAGE_KEYS.SETTINGS)?.length || 0) * 2 / 1024;
      
      const threads = await StorageManager.getThreads();
      
      return {
        totalSizeKB: totalSize.toFixed(2),
        threadsSizeKB: threadsSize.toFixed(2),
        settingsSizeKB: settingsSize.toFixed(2),
        threadCount: threads.length,
        estimatedRemaining: Math.max(0, (5120 - totalSize)).toFixed(2), // Estimate 5MB remaining (common localStorage limit)
        storageType: 'localStorage'
      };
    } catch (error) {
      console.error('Error calculating storage info:', error);
      return {
        error: 'Failed to calculate storage info'
      };
    }
  },
  
  /**
   * Test function to check storage availability and functionality
   * @returns {Promise<Object>} Promise resolving to test results
   */
  testStorage: async () => {
    try {
      // Initialize storage if not already done
      await StorageManager.init();
      
      // Use IndexedDB if available
      if (StorageManager._usingIndexedDB) {
        const testResult = await IndexedDBStorage.testStorage();
        return {
          ...testResult,
          storageType: 'IndexedDB'
        };
      }
      
      // Fallback to localStorage
      try {
        // Test setting and getting data
        localStorage.setItem('test_storage', 'test_value');
        const testValue = localStorage.getItem('test_storage');
        localStorage.removeItem('test_storage');
        
        // Get current storage contents
        const storageContents = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          storageContents[key] = value?.length > 50 ? 
            value.substring(0, 50) + '... (truncated)' : 
            value;
        }
        
        return {
          isAvailable: true,
          testPassed: testValue === 'test_value',
          storageContents,
          storageType: 'localStorage'
        };
      } catch (error) {
        return {
          isAvailable: false,
          error: error.message,
          storageType: 'localStorage'
        };
      }
    } catch (error) {
      console.error('Error testing storage:', error);
      return {
        isAvailable: false,
        error: error.message
      };
    }
  },
  
  /**
   * Get the type of storage being used
   * @returns {Promise<string>} Promise resolving to the storage type
   */
  getStorageType: async () => {
    await StorageManager.init();
    return StorageManager._usingIndexedDB ? 'IndexedDB' : 'localStorage';
  },

  /**
   * Delete an annotation from a thread
   * @param {string} threadId The ID of the thread
   * @param {number} annotationIndex The index of the annotation to delete
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  deleteAnnotation: async (threadId, annotationIndex) => {
    try {
      const thread = await StorageManager.getThreadById(threadId);
      if (!thread) {
        console.error(`Thread with ID ${threadId} not found`);
        return false;
      }

      // Ensure annotations is an array
      if (!Array.isArray(thread.annotations)) {
        if (!thread.annotations) {
          return true; // Nothing to delete
        }
        thread.annotations = [thread.annotations];
      }

      // Check if index is valid
      if (annotationIndex < 0 || annotationIndex >= thread.annotations.length) {
        console.error(`Invalid annotation index: ${annotationIndex}`);
        return false;
      }

      // Remove the annotation at the specified index
      thread.annotations.splice(annotationIndex, 1);
      
      // Update isAnnotated flag
      thread.isAnnotated = thread.annotations.length > 0;

      log(`Deleted annotation ${annotationIndex} from thread ${threadId}`);
      return await StorageManager.saveThread(thread);
    } catch (error) {
      console.error(`Error deleting annotation from thread ${threadId}:`, error);
      return false;
    }
  },
};

// Initialize storage on module load
StorageManager.init().catch(err => console.error('Failed to initialize storage:', err));

export default StorageManager; 