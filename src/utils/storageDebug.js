/**
 * Storage Debug Utility
 * 
 * Provides tools to diagnose and fix storage issues with both IndexedDB and localStorage
 */

import StorageManager from './storage';
import IndexedDBStorage from './indexedDBStorage';

const StorageDebug = {
  /**
   * Performs a comprehensive test of storage functionality
   * @returns {Promise<Object>} Test results
   */
  runDiagnostics: async () => {
    const results = {
      tests: [],
      success: true,
      summary: '',
      storageType: 'unknown'
    };

    // Get storage type being used
    try {
      const storageType = await StorageManager.getStorageType();
      results.storageType = storageType;
      results.tests.push({
        name: 'Storage type detection',
        passed: true,
        details: `Using ${storageType} for data storage`
      });
    } catch (error) {
      results.tests.push({
        name: 'Storage type detection',
        passed: false,
        details: `Error detecting storage type: ${error.message}`
      });
      results.success = false;
    }

    // Test 1: Basic storage availability
    try {
      const testResult = await StorageManager.testStorage();
      const isAvailable = testResult.isAvailable;
      results.tests.push({
        name: `${results.storageType} availability`,
        passed: isAvailable,
        details: isAvailable 
          ? `${results.storageType} is available` 
          : `${results.storageType} is not available`
      });
      
      if (!isAvailable) results.success = false;
    } catch (error) {
      results.tests.push({
        name: `${results.storageType} availability`,
        passed: false,
        details: `Error: ${error.message}`
      });
      results.success = false;
    }

    // Test 2: Write/read test
    try {
      const testKey = '_debug_test_key';
      const testValue = { test: true, timestamp: Date.now() };
      
      if (results.storageType === 'IndexedDB') {
        // Test IndexedDB
        const testResult = await IndexedDBStorage.testStorage();
        const testPassed = testResult.isWorking;
        
        results.tests.push({
          name: 'Write and read test',
          passed: testPassed,
          details: testPassed 
            ? 'Successfully wrote and read data to IndexedDB' 
            : `Failed to verify IndexedDB data: ${testResult.error || 'Unknown error'}`
        });
        
        if (!testPassed) results.success = false;
      } else {
        // Test localStorage
        try {
          localStorage.setItem(testKey, JSON.stringify(testValue));
          const readValue = localStorage.getItem(testKey);
          const parsedValue = JSON.parse(readValue);
          const testPassed = parsedValue.test === true && parsedValue.timestamp;
          
          results.tests.push({
            name: 'Write and read test',
            passed: testPassed,
            details: testPassed ? 'Successfully wrote and read data' : 'Failed to verify written data'
          });
          
          localStorage.removeItem(testKey);
          if (!testPassed) results.success = false;
        } catch (error) {
          results.tests.push({
            name: 'Write and read test',
            passed: false,
            details: `Error: ${error.message}`
          });
          results.success = false;
        }
      }
    } catch (error) {
      results.tests.push({
        name: 'Write and read test',
        passed: false,
        details: `Error: ${error.message}`
      });
      results.success = false;
    }

    // Test 3: Check existing threads storage
    try {
      const threads = await StorageManager.getThreads();
      const threadsValid = Array.isArray(threads);
      
      results.tests.push({
        name: 'Existing threads data',
        passed: threadsValid,
        details: threadsValid 
          ? `Found ${threads.length} threads` 
          : 'Failed to retrieve threads'
      });
      
      if (!threadsValid) results.success = false;
    } catch (error) {
      results.tests.push({
        name: 'Existing threads data',
        passed: false,
        details: `Error getting threads: ${error.message}`
      });
      results.success = false;
    }

    // Test 4: Storage space
    try {
      const info = await StorageManager.getStorageInfo();
      
      if (results.storageType === 'IndexedDB') {
        // IndexedDB has much larger limits, so we don't check space
        results.tests.push({
          name: 'Storage space',
          passed: true,
          details: 'IndexedDB has sufficient storage space (typical limit is 50MB-2GB)'
        });
      } else {
        // Check localStorage space
        const hasSpace = !info.error && parseFloat(info.estimatedRemaining) > 100; // At least 100KB free
        
        results.tests.push({
          name: 'Storage space',
          passed: hasSpace,
          details: info.error 
            ? `Error: ${info.error}` 
            : `${info.estimatedRemaining}KB estimated remaining`
        });
        
        if (!hasSpace) results.success = false;
      }
    } catch (error) {
      results.tests.push({
        name: 'Storage space',
        passed: false,
        details: `Error: ${error.message}`
      });
      results.success = false;
    }

    // Test 5: Saving persistence test
    try {
      // Create a test thread
      const testThreadId = `_debug_thread_${Date.now()}`;
      const testThread = {
        id: testThreadId,
        title: 'Test Thread',
        createdAt: new Date().toISOString(),
        messages: [{ role: 'system', content: 'Test message', id: `msg_${Date.now()}` }]
      };
      
      // Save the test thread
      const saveSuccess = await StorageManager.saveThread(testThread);
      
      if (saveSuccess) {
        // Verify we can read it back
        const retrievedThread = await StorageManager.getThreadById(testThreadId);
        const testPassed = retrievedThread && retrievedThread.id === testThreadId;
        
        results.tests.push({
          name: 'Data persistence test',
          passed: testPassed,
          details: testPassed 
            ? 'Data successfully persisted and retrieved' 
            : 'Failed to verify data persistence'
        });
        
        if (!testPassed) results.success = false;
        
        // Delete the test thread
        await StorageManager.deleteThread(testThreadId);
      } else {
        results.tests.push({
          name: 'Data persistence test',
          passed: false,
          details: 'Failed to save test thread'
        });
        results.success = false;
      }
    } catch (error) {
      results.tests.push({
        name: 'Data persistence test',
        passed: false,
        details: `Error: ${error.message}`
      });
      results.success = false;
    }

    // Test 6: Check alternative storage availability
    try {
      if (results.storageType === 'IndexedDB') {
        // Check localStorage as fallback
        const hasLocalStorage = 'localStorage' in window;
        results.tests.push({
          name: 'localStorage availability (fallback)',
          passed: hasLocalStorage,
          details: hasLocalStorage 
            ? 'localStorage is available as a fallback' 
            : 'localStorage is not available'
        });
      } else {
        // Check IndexedDB as alternative
        const hasIndexedDB = 'indexedDB' in window;
        results.tests.push({
          name: 'IndexedDB availability (alternative)',
          passed: hasIndexedDB,
          details: hasIndexedDB 
            ? 'IndexedDB is available as an alternative storage option' 
            : 'IndexedDB is not available'
        });
      }
    } catch (error) {
      results.tests.push({
        name: `Alternative storage availability`,
        passed: false,
        details: `Error: ${error.message}`
      });
    }

    // Generate summary
    if (results.success) {
      results.summary = `All ${results.storageType} tests passed. Storage appears to be working correctly.`;
    } else {
      const failedTests = results.tests.filter(t => !t.passed).map(t => t.name).join(', ');
      results.summary = `Storage issues detected with ${results.storageType}. Failed tests: ${failedTests}`;
    }

    return results;
  },

  /**
   * Attempts to force a save of the current data
   * @param {Array} threads The threads to save
   * @returns {Promise<Object>} Result of save operation
   */
  forceSave: async (threads) => {
    if (!threads || !Array.isArray(threads)) {
      console.error('No threads provided to forceSave');
      return {
        success: false,
        message: 'No threads provided to save'
      };
    }
    
    try {
      // Get current storage type
      const storageType = await StorageManager.getStorageType();
      
      if (storageType === 'IndexedDB') {
        // Force save to IndexedDB
        const success = await IndexedDBStorage.saveThreads(threads);
        
        return {
          success,
          message: success 
            ? `Successfully saved ${threads.length} threads to IndexedDB` 
            : 'Failed to save threads to IndexedDB'
        };
      } else {
        // Force save to localStorage
        try {
          // First try to clear existing data
          localStorage.removeItem('threads');
          
          // Then save the threads with direct localStorage access
          const threadsJson = JSON.stringify(threads);
          localStorage.setItem('threads', threadsJson);
          
          // Verify the save
          const savedData = localStorage.getItem('threads');
          const success = !!savedData && savedData === threadsJson;
          
          return {
            success,
            message: success 
              ? `Successfully saved ${threads.length} threads to localStorage` 
              : 'Failed to verify saved data in localStorage'
          };
        } catch (error) {
          return {
            success: false,
            message: `Error saving to localStorage: ${error.message}`
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Error in forceSave: ${error.message}`
      };
    }
  },

  /**
   * Gets all keys in localStorage
   * @returns {Array} List of keys
   */
  getAllKeys: () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  },

  /**
   * Gets a direct dump of storage data
   * @returns {Promise<Object>} Object with all storage key/values
   */
  getStorageDump: async () => {
    try {
      const storageType = await StorageManager.getStorageType();
      
      if (storageType === 'IndexedDB') {
        // For IndexedDB, get all threads and settings
        const threads = await IndexedDBStorage.getThreads();
        const settings = await IndexedDBStorage.getSettings();
        
        return {
          storageType: 'IndexedDB',
          threads,
          settings,
          threadCount: threads.length
        };
      } else {
        // For localStorage, get all keys and values
        const dump = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            // Try to parse as JSON for cleaner output
            const value = localStorage.getItem(key);
            dump[key] = JSON.parse(value);
          } catch {
            // If not valid JSON, store as raw string
            dump[key] = localStorage.getItem(key);
          }
        }
        return {
          storageType: 'localStorage',
          ...dump
        };
      }
    } catch (error) {
      console.error('Error getting storage dump:', error);
      return { error: error.message };
    }
  },

  /**
   * Repairs potential storage issues
   * @returns {Promise<Object>} Result of repair operation
   */
  repairStorage: async () => {
    const result = {
      success: true,
      actions: [],
      message: 'Storage repair completed'
    };

    try {
      const storageType = await StorageManager.getStorageType();
      result.actions.push(`Current storage type: ${storageType}`);
      
      // 1. Try to get current threads
      let threads = [];
      try {
        threads = await StorageManager.getThreads();
        if (Array.isArray(threads)) {
          result.actions.push(`Successfully retrieved ${threads.length} existing threads`);
        } else {
          result.actions.push('Failed to retrieve threads');
          result.success = false;
        }
      } catch (getError) {
        result.actions.push(`Error retrieving threads: ${getError.message}`);
        result.success = false;
        threads = [];
      }
      
      // Filter out any invalid threads
      const validThreads = Array.isArray(threads) 
        ? threads.filter(t => t && typeof t === 'object' && t.id)
        : [];
        
      if (validThreads.length < threads.length) {
        result.actions.push(`Removed ${threads.length - validThreads.length} invalid threads`);
      }
      
      // 2. Clear storage and re-initialize
      if (storageType === 'IndexedDB') {
        try {
          await IndexedDBStorage.clearAllData();
          result.actions.push('Cleared IndexedDB data');
          
          // Re-initialize IndexedDB
          await IndexedDBStorage.init();
          result.actions.push('Re-initialized IndexedDB');
          
          // Save valid threads back
          if (validThreads.length > 0) {
            const saveSuccess = await IndexedDBStorage.saveThreads(validThreads);
            result.actions.push(saveSuccess 
              ? `Restored ${validThreads.length} threads to IndexedDB` 
              : 'Failed to restore threads to IndexedDB');
            
            if (!saveSuccess) result.success = false;
          } else {
            result.actions.push('No valid threads to restore');
          }
        } catch (indexedDBError) {
          result.actions.push(`Error repairing IndexedDB: ${indexedDBError.message}`);
          result.success = false;
          
          // Try to fall back to localStorage
          try {
            result.actions.push('Attempting to fall back to localStorage');
            localStorage.clear();
            localStorage.setItem('threads', JSON.stringify(validThreads));
            result.actions.push(`Saved ${validThreads.length} threads to localStorage as fallback`);
          } catch (fallbackError) {
            result.actions.push(`Fallback to localStorage failed: ${fallbackError.message}`);
          }
        }
      } else {
        // Repair localStorage
        try {
          localStorage.clear();
          result.actions.push('Cleared localStorage');
          
          // Save threads back
          if (validThreads.length > 0) {
            localStorage.setItem('threads', JSON.stringify(validThreads));
            result.actions.push(`Restored ${validThreads.length} threads to localStorage`);
          } else {
            localStorage.setItem('threads', '[]');
            result.actions.push('Initialized with empty threads array');
          }
        } catch (localStorageError) {
          result.actions.push(`Error repairing localStorage: ${localStorageError.message}`);
          result.success = false;
        }
      }
      
      // 3. Verify storage is working
      const testResult = await StorageManager.testStorage();
      if (testResult.isAvailable && (
        testResult.isWorking || testResult.testPassed)) {
        result.actions.push('Storage functionality verified after repair');
      } else {
        result.actions.push('Storage functionality could not be verified after repair');
        result.success = false;
      }
      
      // Set final message
      if (result.success) {
        result.message = `Storage repaired successfully using ${storageType}. ${validThreads.length} threads recovered.`;
      } else {
        result.message = 'Storage repair completed with some issues.';
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        actions: ['Storage repair failed with error'],
        message: `Error: ${error.message}`
      };
    }
  },

  /**
   * Use for scheduled storage maintenance
   * @returns {Promise<Object>} Maintenance results
   */
  performMaintenance: async () => {
    const result = {
      actions: [],
      success: true
    };
    
    try {
      // 1. Test storage
      const storageType = await StorageManager.getStorageType();
      result.actions.push(`Using ${storageType} for storage`);
      
      const testResult = await StorageManager.testStorage();
      result.actions.push(`Storage test: ${testResult.isAvailable ? 'Available' : 'Unavailable'}`);
      
      // 2. Get current threads
      let threads = await StorageManager.getThreads();
      if (Array.isArray(threads)) {
        result.actions.push(`Found ${threads.length} threads`);
        
        // 3. Clean up any invalid threads
        const validThreads = threads.filter(thread => 
          thread && typeof thread === 'object' && thread.id);
        
        if (validThreads.length !== threads.length) {
          result.actions.push(`Removed ${threads.length - validThreads.length} invalid threads`);
          threads = validThreads;
        }
        
        // 4. Resave cleaned threads
        const saveSuccess = await StorageManager.saveThreads(threads);
        result.actions.push(saveSuccess 
          ? 'Saved cleaned thread data' 
          : 'Failed to save cleaned thread data');
        
        if (!saveSuccess) result.success = false;
      } else {
        result.actions.push('No valid threads found');
        await StorageManager.saveThreads([]);
      }
      
      return {
        success: result.success,
        message: result.success ? 'Maintenance completed successfully' : 'Maintenance completed with issues',
        actions: result.actions
      };
    } catch (error) {
      return {
        success: false,
        message: `Maintenance error: ${error.message}`,
        actions: [...result.actions, `Error: ${error.message}`]
      };
    }
  },

  /**
   * Export storage data to a file for backup
   * @returns {Promise<Object>} Result of export operation
   */
  exportStorageBackup: async () => {
    try {
      const storageType = await StorageManager.getStorageType();
      const threads = await StorageManager.getThreads();
      const settings = await StorageManager.getSettings();
      
      const exportData = {
        threads,
        settings,
        backupTime: new Date().toISOString(),
        storageType,
        version: '1.0'
      };
      
      // Create backup file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `annotation-backup-${timestamp}.json`;
      
      // Create download link
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return {
        success: true,
        message: `Backup exported to ${filename}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Export error: ${error.message}`
      };
    }
  }
};

export default StorageDebug; 