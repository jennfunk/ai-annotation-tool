/**
 * IndexedDB Storage Utility
 * 
 * Provides a more durable storage alternative to localStorage.
 * IndexedDB advantages:
 * - Larger storage capacity (multi-MB to GB vs localStorage's ~5MB)
 * - Transactional operations for better data integrity
 * - Asynchronous API that doesn't block the main thread
 * - Better persistence across browser sessions
 */

// Debug mode
const DEBUG = true;

// Log helper
const log = (message, data) => {
  if (DEBUG) {
    console.log(`[IndexedDBStorage] ${message}`, data || '');
  }
};

// Database configuration
const DB_CONFIG = {
  NAME: 'annotation-tool-db',
  VERSION: 1,
  STORES: {
    THREADS: 'threads',
    SETTINGS: 'settings'
  }
};

/**
 * IndexedDB Storage Manager
 */
const IndexedDBStorage = {
  db: null,
  
  /**
   * Initialize the database connection
   * @returns {Promise} Promise that resolves when DB is ready
   */
  init: () => {
    return new Promise((resolve, reject) => {
      if (IndexedDBStorage.db) {
        resolve(IndexedDBStorage.db);
        return;
      }
      
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }
      
      const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        IndexedDBStorage.db = event.target.result;
        log('IndexedDB connection established successfully');
        resolve(IndexedDBStorage.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(DB_CONFIG.STORES.THREADS)) {
          const threadsStore = db.createObjectStore(DB_CONFIG.STORES.THREADS, { keyPath: 'id' });
          log('Created threads object store');
        }
        
        if (!db.objectStoreNames.contains(DB_CONFIG.STORES.SETTINGS)) {
          const settingsStore = db.createObjectStore(DB_CONFIG.STORES.SETTINGS, { keyPath: 'id' });
          log('Created settings object store');
        }
      };
    });
  },
  
  /**
   * Get all threads from IndexedDB
   * @returns {Promise<Array>} Promise resolving to an array of threads
   */
  getThreads: async () => {
    try {
      await IndexedDBStorage.init();
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.THREADS], 'readonly');
        const store = transaction.objectStore(DB_CONFIG.STORES.THREADS);
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result || []);
          log(`Retrieved ${request.result ? request.result.length : 0} threads from IndexedDB`);
        };
        
        request.onerror = (event) => {
          console.error('Error getting threads from IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error in getThreads:', error);
      return [];
    }
  },
  
  /**
   * Save all threads to IndexedDB
   * @param {Array} threads Array of thread objects
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  saveThreads: async (threads) => {
    if (!threads || !Array.isArray(threads)) {
      console.error('Invalid threads data provided to saveThreads');
      return false;
    }
    
    try {
      await IndexedDBStorage.init();
      
      // Clean the threads array
      const cleanedThreads = threads.filter(thread => thread && typeof thread === 'object' && thread.id);
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.THREADS], 'readwrite');
        const store = transaction.objectStore(DB_CONFIG.STORES.THREADS);
        
        // Clear existing threads
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          // Add all threads as individual records
          let countAdded = 0;
          
          cleanedThreads.forEach(thread => {
            const addRequest = store.add(thread);
            
            addRequest.onsuccess = () => {
              countAdded++;
              if (countAdded === cleanedThreads.length) {
                log(`Successfully saved ${countAdded} threads to IndexedDB`);
              }
            };
            
            addRequest.onerror = (event) => {
              console.error(`Error adding thread ${thread.id}:`, event.target.error);
            };
          });
        };
        
        transaction.oncomplete = () => {
          resolve(true);
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction error while saving threads:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error in saveThreads:', error);
      return false;
    }
  },
  
  /**
   * Get a specific thread by ID
   * @param {string} threadId The ID of the thread to retrieve
   * @returns {Promise<Object|null>} Promise resolving to thread object or null
   */
  getThreadById: async (threadId) => {
    try {
      await IndexedDBStorage.init();
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.THREADS], 'readonly');
        const store = transaction.objectStore(DB_CONFIG.STORES.THREADS);
        const request = store.get(threadId);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = (event) => {
          console.error(`Error getting thread ${threadId}:`, event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error in getThreadById:', error);
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
      await IndexedDBStorage.init();
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.THREADS], 'readwrite');
        const store = transaction.objectStore(DB_CONFIG.STORES.THREADS);
        
        // Check if thread exists
        const getRequest = store.get(thread.id);
        
        getRequest.onsuccess = () => {
          const existingThread = getRequest.result;
          const request = existingThread ? store.put(thread) : store.add(thread);
          
          request.onsuccess = () => {
            log(`${existingThread ? 'Updated' : 'Added'} thread with ID ${thread.id}`);
            resolve(true);
          };
          
          request.onerror = (event) => {
            console.error(`Error saving thread ${thread.id}:`, event.target.error);
            reject(event.target.error);
          };
        };
        
        getRequest.onerror = (event) => {
          console.error(`Error checking thread ${thread.id}:`, event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error in saveThread:', error);
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
      await IndexedDBStorage.init();
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.THREADS], 'readwrite');
        const store = transaction.objectStore(DB_CONFIG.STORES.THREADS);
        const request = store.delete(threadId);
        
        request.onsuccess = () => {
          log(`Deleted thread with ID ${threadId}`);
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error(`Error deleting thread ${threadId}:`, event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error in deleteThread:', error);
      return false;
    }
  },
  
  /**
   * Get application settings
   * @returns {Promise<Object>} Promise resolving to settings object
   */
  getSettings: async () => {
    try {
      await IndexedDBStorage.init();
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.SETTINGS], 'readonly');
        const store = transaction.objectStore(DB_CONFIG.STORES.SETTINGS);
        const request = store.get('app-settings');
        
        request.onsuccess = () => {
          resolve(request.result?.data || {});
        };
        
        request.onerror = (event) => {
          console.error('Error getting settings:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error in getSettings:', error);
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
      await IndexedDBStorage.init();
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.SETTINGS], 'readwrite');
        const store = transaction.objectStore(DB_CONFIG.STORES.SETTINGS);
        
        const settingsObj = {
          id: 'app-settings',
          data: settings,
          updatedAt: new Date().toISOString()
        };
        
        const request = store.put(settingsObj);
        
        request.onsuccess = () => {
          log('Settings saved successfully');
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error('Error saving settings:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error in saveSettings:', error);
      return false;
    }
  },
  
  /**
   * Clear all stored data
   * @returns {Promise<boolean>} Promise resolving to success state
   */
  clearAllData: async () => {
    try {
      await IndexedDBStorage.init();
      
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction(
          [DB_CONFIG.STORES.THREADS, DB_CONFIG.STORES.SETTINGS], 
          'readwrite'
        );
        
        transaction.onerror = (event) => {
          console.error('Error clearing data:', event.target.error);
          reject(event.target.error);
        };
        
        // Clear threads
        const threadsStore = transaction.objectStore(DB_CONFIG.STORES.THREADS);
        threadsStore.clear().onerror = (event) => {
          console.error('Error clearing threads store:', event.target.error);
        };
        
        // Clear settings
        const settingsStore = transaction.objectStore(DB_CONFIG.STORES.SETTINGS);
        settingsStore.clear().onerror = (event) => {
          console.error('Error clearing settings store:', event.target.error);
        };
        
        transaction.oncomplete = () => {
          log('All data cleared successfully');
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Error in clearAllData:', error);
      return false;
    }
  },
  
  /**
   * Get storage usage information
   * @returns {Promise<Object>} Promise resolving to storage information
   */
  getStorageInfo: async () => {
    try {
      await IndexedDBStorage.init();
      
      const threads = await IndexedDBStorage.getThreads();
      
      return {
        threadCount: threads.length,
        isIndexedDB: true,
        storageType: 'IndexedDB'
      };
    } catch (error) {
      console.error('Error in getStorageInfo:', error);
      return {
        error: 'Failed to get storage info',
        isIndexedDB: true
      };
    }
  },
  
  /**
   * Test if IndexedDB is working properly
   * @returns {Promise<Object>} Promise resolving to test results
   */
  testStorage: async () => {
    try {
      await IndexedDBStorage.init();
      
      // Test data
      const testData = {
        id: 'test-item',
        value: 'test-value',
        timestamp: Date.now()
      };
      
      // Try writing to the database
      return new Promise((resolve, reject) => {
        const transaction = IndexedDBStorage.db.transaction([DB_CONFIG.STORES.THREADS], 'readwrite');
        const store = transaction.objectStore(DB_CONFIG.STORES.THREADS);
        
        // Add test item
        const addRequest = store.put(testData);
        
        addRequest.onerror = (event) => {
          console.error('Error in test write:', event.target.error);
          resolve({
            isAvailable: true,
            isWorking: false,
            error: event.target.error.message
          });
        };
        
        addRequest.onsuccess = () => {
          // Read test item back
          const getRequest = store.get('test-item');
          
          getRequest.onerror = (event) => {
            console.error('Error in test read:', event.target.error);
            resolve({
              isAvailable: true,
              isWorking: false,
              error: event.target.error.message
            });
          };
          
          getRequest.onsuccess = () => {
            const readData = getRequest.result;
            
            // Delete test item
            store.delete('test-item');
            
            resolve({
              isAvailable: true,
              isWorking: !!readData && readData.value === 'test-value',
              testData: readData
            });
          };
        };
      });
    } catch (error) {
      console.error('Error testing IndexedDB:', error);
      return {
        isAvailable: false,
        isWorking: false,
        error: error.message
      };
    }
  }
};

export default IndexedDBStorage; 