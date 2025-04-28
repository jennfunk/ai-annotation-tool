import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert, TextField, Button as MuiButton, Typography, CircularProgress, IconButton } from '@mui/material';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from 'react-resizable-panels';
import ThreadList from './components/ThreadList';
import ConversationView from './components/ConversationView';
import AnnotationPanel from './components/AnnotationPanel';
import Header from './components/Header';
import { mockThreads } from './utils/mockData';
import CsvImportDialog from './components/CsvImportDialog';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import SettingsDialog from './components/SettingsDialog';
import Login from './components/Login';
import * as storageService from './utils/storageService';
import { initStorage, isAuthenticated, signOut, syncToRemote, getCurrentUser } from './utils/storageService';
import { v4 as uuidv4 } from 'uuid';
import StorageDebug from './utils/storageDebug';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon, ImportExport as ImportExportIcon, CloudUpload as CloudUploadIcon, Close as CloseIcon } from '@mui/icons-material';
import { convertAnnotationsToCSV } from './utils/helpers';
import { auth } from './utils/firebase';

// Custom resize handle component
const ResizeHandle = () => (
  <PanelResizeHandle
    className="resize-handle"
    style={{
      width: '8px',
      background: '#f0f0f0',
      cursor: 'col-resize',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <div
      style={{
        width: '4px',
        height: '30px',
        background: '#ccc',
        borderRadius: '2px',
      }}
    />
  </PanelResizeHandle>
);

const App = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'annotated', 'unannotated'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
  const [csvImportDialogOpen, setCsvImportDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [storageType, setStorageType] = useState('Initializing...');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [threadToRename, setThreadToRename] = useState(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [setupHelpOpen, setSetupHelpOpen] = useState(false);
  
  // Initialize storage
  useEffect(() => {
    initStorage();
  }, []);

  // Check authentication state
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isAuthenticated();
      console.log('Auth check:', isAuth);
      setAuthenticated(isAuth);
      setAuthLoading(false);
    };
    
    // Use Firebase's auth state observer to get reliable auth state updates
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
      setAuthenticated(!!user);
      setAuthLoading(false);
    });
    
    // Check immediately too
    checkAuth();
    
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    // Load threads using storage service
    const loadThreads = async () => {
      try {
        console.log("Loading threads...");
        const storedThreads = await storageService.getThreads();
        const currentStorageType = 'Hybrid (IndexedDB/Firebase)';
        setStorageType(currentStorageType);
        
        if (storedThreads && storedThreads.length > 0) {
          console.log(`Loaded ${storedThreads.length} threads successfully`);
          setThreads(storedThreads);
          setSelectedThread(storedThreads[0]);
          setSelectedThreadIndex(0);
        } else {
          console.log("No threads found, using mock data");
          // Load mock threads if no stored threads found
          loadMockThreads();
        }
      } catch (error) {
        console.error('Error loading threads:', error);
        showNotification('Error loading data from Firebase. This might be due to missing database setup or permissions. Click "Setup Help" for instructions.', 'error');
        loadMockThreads();
      }
    };
    
    if (authenticated || !isAuthenticated()) {
      loadThreads();
    }
  }, [authenticated]);
  
  const loadMockThreads = () => {
    setThreads(mockThreads);
    if (mockThreads.length > 0) {
      setSelectedThread(mockThreads[0]);
      setSelectedThreadIndex(0);
    }
  };
  
  // Save threads to storage whenever they change
  useEffect(() => {
    const saveData = async () => {
      if (threads.length > 0) {
        try {
          // Save each thread individually to avoid overwriting
          for (const thread of threads) {
            await storageService.saveThread(thread);
          }
        } catch (error) {
          console.error('Error saving threads:', error);
        }
      }
    };
    
    saveData();
  }, [threads]);

  // Handle keyboard navigation (j/k keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return; // Don't capture keyboard if user is typing
      }
      
      if (e.key === 'j') {
        handleNavigateNext();
      } else if (e.key === 'k') {
        handleNavigatePrevious();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedThreadIndex]);
  
  // Filter threads based on current filter setting
  let filteredThreads = threads.filter(thread => {
    if (filter === 'all') return true;
    if (filter === 'annotated') return thread.isAnnotated;
    if (filter === 'unannotated') return !thread.isAnnotated;
    return true;
  });
  
  // Sort threads based on current sort order
  filteredThreads = [...filteredThreads].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    
    if (sortOrder === 'newest') {
      return dateB - dateA; // Newest first (descending)
    } else {
      return dateA - dateB; // Oldest first (ascending)
    }
  });

  const handleSortOrderChange = (newSortOrder) => {
    if (newSortOrder !== sortOrder) {
      setSortOrder(newSortOrder);
      
      // Update selectedThreadIndex since the order has changed
      if (selectedThread) {
        const newIndex = filteredThreads.findIndex(t => t.id === selectedThread.id);
        if (newIndex !== -1) {
          setSelectedThreadIndex(newIndex);
        }
      }
    }
  };
  
  const handleThreadSelect = (threadId) => {
    console.log(`Thread select called with ID: ${threadId}`);
    
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      console.log(`Found thread:`, thread.title || thread.id);
      setSelectedThread(thread);
      const index = filteredThreads.findIndex(t => t.id === threadId);
      if (index !== -1) {
        setSelectedThreadIndex(index);
        console.log(`Set selected thread index to: ${index}`);
      }
    } else {
      console.warn(`Thread with ID ${threadId} not found`);
    }
  };
  
  const handleAnnotationSave = async (threadId, annotationData) => {
    try {
      // Get current user info
      const currentUser = getCurrentUser();
      const userEmail = currentUser?.email || 'Anonymous';
      const userId = currentUser?.uid || 'anonymous';
      
      // Update thread with annotation data
      const updatedThreads = threads.map(thread => {
        if (thread.id === threadId) {
          // Update the thread
          const updatedThread = {
            ...thread,
            isAnnotated: true,
            annotations: [...(thread.annotations || []), {
              id: uuidv4(),
              timestamp: new Date().toISOString(),
              createdBy: userEmail,
              createdByUid: userId,
              ...annotationData
            }]
          };
          
          // Save to storage
          storageService.updateThread(threadId, updatedThread);
          
          return updatedThread;
        }
        return thread;
      });
      
      setThreads(updatedThreads);
      showNotification('Annotation saved', 'success');
    } catch (error) {
      console.error('Error saving annotation:', error);
      showNotification('Error saving annotation', 'error');
    }
  };
  
  const handleNavigateNext = () => {
    if (filteredThreads.length === 0 || selectedThreadIndex >= filteredThreads.length - 1) {
      return;
    }
    
    const nextIndex = selectedThreadIndex + 1;
    setSelectedThreadIndex(nextIndex);
    setSelectedThread(filteredThreads[nextIndex]);
  };
  
  const handleNavigatePrevious = () => {
    if (filteredThreads.length === 0 || selectedThreadIndex <= 0) {
      return;
    }
    
    const prevIndex = selectedThreadIndex - 1;
    setSelectedThreadIndex(prevIndex);
    setSelectedThread(filteredThreads[prevIndex]);
  };
  
  // Import dialog handlers
  const handleImportClick = () => {
    setCsvImportDialogOpen(true);
  };
  
  const handleImportClose = () => {
    setCsvImportDialogOpen(false);
  };
  
  // Settings dialog handlers
  const handleSettingsClick = () => {
    setSettingsDialogOpen(true);
  };
  
  const handleSettingsClose = () => {
    setSettingsDialogOpen(false);
  };
  
  const handleImportThreads = async (importedThreads) => {
    if (!importedThreads || importedThreads.length === 0) {
      setNotification({
        open: true,
        message: 'No threads imported',
        severity: 'info'
      });
      return;
    }
    
    try {
      // Always add imported threads as new threads with unique IDs
      const combinedThreads = [...threads];
      let addedCount = 0;
      
      importedThreads.forEach(importedThread => {
        // Assign a new unique ID to each imported thread
        const newThread = {
          ...importedThread,
          id: uuidv4(), // Generate new UUID
          createdAt: importedThread.createdAt || new Date().toISOString(),
          isAnnotated: importedThread.isAnnotated || false
        };
        
        // Add as a new thread
        combinedThreads.push(newThread);
        addedCount++;
      });
      
      setThreads(combinedThreads);
      
      // If we don't already have a selected thread, select the first imported one
      if (!selectedThread && importedThreads.length > 0) {
        const lastImportedIndex = combinedThreads.length - importedThreads.length;
        setSelectedThread(combinedThreads[lastImportedIndex]);
        setSelectedThreadIndex(lastImportedIndex);
      }
      
      // Save to storage
      await storageService.saveThreads(combinedThreads);
      
      // Close dialog and show success notification
      setCsvImportDialogOpen(false);
      setNotification({
        open: true,
        message: `Import successful: ${addedCount} threads added`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error importing threads:', error);
      setNotification({
        open: true,
        message: 'Error importing threads',
        severity: 'error'
      });
    }
  };
  
  // Handle notifications
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({...notification, open: false});
  };
  
  // Delete thread handlers
  const handleDeleteThread = (threadId) => {
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setThreadToDelete(null);
  };
  
  const handleConfirmDelete = async () => {
    const threadId = threadToDelete;
    
    try {
      // Remove from state
      const updatedThreads = threads.filter(thread => thread.id !== threadId);
      setThreads(updatedThreads);
      
      // Also remove from storage
      await storageService.deleteThread(threadId);
      
      // Select a new thread if needed
      if (selectedThread && selectedThread.id === threadId) {
        if (updatedThreads.length > 0) {
          // Select an adjacent thread if possible
          const newIndex = Math.min(selectedThreadIndex, updatedThreads.length - 1);
          setSelectedThreadIndex(newIndex);
          setSelectedThread(updatedThreads[newIndex]);
        } else {
          // No threads left
          setSelectedThread(null);
          setSelectedThreadIndex(0);
        }
      }
      
      // Close dialog and show notification
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
      setNotification({
        open: true,
        message: 'Thread deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      setNotification({
        open: true,
        message: 'Error deleting thread',
        severity: 'error'
      });
    }
  };
  
  // Handle deleting a specific annotation
  const handleDeleteAnnotation = async (threadId, annotationIndex) => {
    try {
      console.log(`Deleting annotation at index ${annotationIndex} from thread ${threadId}`);
      
      // Use the dedicated storage method for deleting annotations
      const result = await storageService.deleteAnnotation(threadId, annotationIndex);
      
      if (!result) {
        console.error('Failed to delete annotation using storage manager');
        setNotification({
          open: true,
          message: 'Error deleting annotation',
          severity: 'error'
        });
        return;
      }
      
      // Update local state if storage update was successful
      const updatedThreads = threads.map(thread => {
        if (thread.id === threadId) {
          // Create a copy of annotations without the deleted one
          const updatedAnnotations = Array.isArray(thread.annotations) 
            ? [...thread.annotations] 
            : thread.annotations ? [thread.annotations] : [];
          
          if (updatedAnnotations.length > annotationIndex) {
            updatedAnnotations.splice(annotationIndex, 1);
          }
          
          return {
            ...thread,
            annotations: updatedAnnotations,
            isAnnotated: updatedAnnotations.length > 0
          };
        }
        return thread;
      });
      
      // Update state
      setThreads(updatedThreads);
      
      // If the selected thread is the one being updated, update it
      if (selectedThread && selectedThread.id === threadId) {
        const updatedThread = updatedThreads.find(t => t.id === threadId);
        setSelectedThread(updatedThread);
      }
      
      // Show notification
      setNotification({
        open: true,
        message: 'Annotation deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting annotation:', error);
      setNotification({
        open: true,
        message: 'Error deleting annotation',
        severity: 'error'
      });
    }
  };
  
  // Helper function to show notifications
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message: message,
      severity: severity
    });
    
    // If it's an error message related to Firebase, offer setup help
    if (severity === 'error' && message.includes('Firebase')) {
      // Show setup help button after a short delay
      setTimeout(() => {
        setSetupHelpOpen(true);
      }, 1000);
    }
  };

  // Handle adding a new thread with improved storage handling
  const handleAddThread = async () => {
    // Feature disabled
    console.log("Adding new threads is disabled");
    return;
  };

  // Run storage diagnostics
  const runStorageDiagnostics = async () => {
    try {
      const results = await StorageDebug.runDiagnostics();
      setDebugInfo(results);
      showNotification(results.summary, results.success ? 'info' : 'warning');
      console.log('Storage diagnostics results:', results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      showNotification('Error running storage diagnostics', 'error');
    }
  };

  // Force save all data
  const forceStorageSave = async () => {
    try {
      const result = await StorageDebug.forceSave(threads);
      showNotification(result.message, result.success ? 'success' : 'error');
      console.log('Force save result:', result);
    } catch (error) {
      console.error('Error forcing save:', error);
      showNotification('Error forcing save', 'error');
    }
  };

  // Debug panel
  const renderDebugPanel = () => {
    if (!isDebugMode) return null;
    
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        backgroundColor: '#f5f5f5', 
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        zIndex: 1000,
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Storage Debug ({storageType})</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={runStorageDiagnostics}
          >
            Run Diagnostics
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={forceStorageSave}
          >
            Force Save
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            color="error" 
            onClick={() => setIsDebugMode(false)}
          >
            Close
          </Button>
        </div>
        
        {debugInfo && (
          <div style={{ fontSize: '12px' }}>
            <div><strong>Status:</strong> {debugInfo.success ? '✅ OK' : '❌ Issues detected'}</div>
            <div><strong>Storage:</strong> {debugInfo.storageType}</div>
            <div><strong>Summary:</strong> {debugInfo.summary}</div>
            <h4 style={{ margin: '10px 0 5px 0' }}>Test Results:</h4>
            {debugInfo.tests.map((test, i) => (
              <div key={i} style={{ marginBottom: '5px' }}>
                <div>{test.passed ? '✅' : '❌'} <strong>{test.name}</strong></div>
                <div style={{ paddingLeft: '20px', color: '#666' }}>{test.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Handle thread rename request
  const handleRenameThread = (thread) => {
    if (thread) {
      setThreadToRename(thread);
      setNewThreadTitle(thread.title || '');
      setRenameDialogOpen(true);
    }
  };
  
  // Close rename dialog
  const handleCloseRenameDialog = () => {
    setRenameDialogOpen(false);
    setThreadToRename(null);
    setNewThreadTitle('');
  };
  
  // Confirm and save thread rename
  const handleConfirmRename = async () => {
    if (!threadToRename || !newThreadTitle.trim()) {
      return;
    }
    
    try {
      const updatedThreads = threads.map(thread => {
        if (thread.id === threadToRename.id) {
          return {
            ...thread,
            title: newThreadTitle.trim()
          };
        }
        return thread;
      });
      
      setThreads(updatedThreads);
      
      // Update selected thread if it's the one being renamed
      if (selectedThread && selectedThread.id === threadToRename.id) {
        const updatedThread = updatedThreads.find(t => t.id === threadToRename.id);
        setSelectedThread(updatedThread);
      }
      
      // Save to storage
      const saveResult = await storageService.saveThreads(updatedThreads);
      if (!saveResult) {
        showNotification('Warning: Thread renamed but may not be saved', 'warning');
      } else {
        showNotification('Thread renamed successfully', 'success');
      }
    } catch (error) {
      console.error('Error renaming thread:', error);
      showNotification('Error renaming thread', 'error');
    } finally {
      handleCloseRenameDialog();
    }
  };

  const handleExportAllAnnotations = () => {
    try {
      // Filter out threads without annotations
      const annotatedThreads = threads.filter(thread => 
        thread.annotations && 
        (Array.isArray(thread.annotations) ? thread.annotations.length > 0 : true)
      );
      
      if (annotatedThreads.length === 0) {
        showNotification('No annotations found to export', 'warning');
        return;
      }
      
      // Convert to CSV
      const csvContent = convertAnnotationsToCSV(annotatedThreads);
      
      // Create a download link
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const exportFileName = `all-annotations-${new Date().toISOString().slice(0, 10)}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      
      showNotification('Annotations exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting annotations:', error);
      showNotification('Failed to export annotations', 'error');
    }
  };

  // Extract all unique tags from all thread annotations
  const getAllUniqueTags = () => {
    const allTags = new Set();
    
    threads.forEach(thread => {
      if (!thread.annotations) return;
      
      const annotations = Array.isArray(thread.annotations) 
        ? thread.annotations 
        : [thread.annotations];
      
      annotations.forEach(annotation => {
        if (annotation.tags && Array.isArray(annotation.tags)) {
          annotation.tags.forEach(tag => allTags.add(tag));
        }
      });
    });
    
    return Array.from(allTags);
  };

  const handleLogin = () => {
    setAuthenticated(true);
    showNotification('Successfully logged in!', 'success');
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      setAuthenticated(false);
      showNotification('Successfully logged out', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error logging out: ' + error.message, 'error');
    }
  };
  
  const handleSyncToRemote = async () => {
    if (!isAuthenticated()) {
      showNotification('You must be logged in to sync data', 'warning');
      return;
    }
    
    setSyncStatus('syncing');
    setSyncDialogOpen(true);
    
    try {
      const syncCount = await syncToRemote();
      setSyncStatus('success');
      setTimeout(() => {
        setSyncDialogOpen(false);
        showNotification(`Successfully synced ${syncCount} threads to the cloud`, 'success');
      }, 1500);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setTimeout(() => {
        setSyncDialogOpen(false);
        showNotification('Error syncing data: ' + error.message, 'error');
      }, 1500);
    }
  };

  // Function to show setup help
  const showSetupHelp = () => {
    setSetupHelpOpen(true);
  };

  // Helper dialog component
  const renderSetupHelp = () => {
    return (
      <Dialog
        open={setupHelpOpen}
        onClose={() => setSetupHelpOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Firebase Setup Instructions
          <IconButton
            aria-label="close"
            onClick={() => setSetupHelpOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            It looks like you need to set up your Firestore database in Firebase. Follow these steps:
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
            1. Create a Firestore Database
          </Typography>
          <Typography variant="body2" paragraph>
            - Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a>
            <br />
            - Select your project "mysidewalk-llm-grader"
            <br />
            - In the left sidebar, click on "Firestore Database"
            <br />
            - Click "Create database" button
            <br />
            - Choose "Start in test mode" for now (you can secure it later)
            <br />
            - Select a database location closest to your users
            <br />
            - Click "Enable"
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
            2. Set Up Security Rules
          </Typography>
          <Typography variant="body2" paragraph>
            Once your database is created, go to the "Rules" tab and set the following rules:
          </Typography>
          
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.85rem',
            mb: 2
          }}>
            {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /threads/{threadId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Other collections
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
          </Box>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
            3. After Setup
          </Typography>
          <Typography variant="body2" paragraph>
            After completing setup, close this dialog and refresh the page. You should now be able to use cloud storage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupHelpOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              window.open('https://console.firebase.google.com/', '_blank');
            }}
          >
            Open Firebase Console
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Only show the login screen if we're sure the user is not authenticated
  // Show a loading spinner while authentication is being checked
  if (authLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header 
        onImportClick={handleImportClick} 
        onSettingsClick={handleSettingsClick}
        onAddThread={handleAddThread}
        onRunDiagnostics={runStorageDiagnostics}
        onForceSave={forceStorageSave}
        isDebugMode={isDebugMode}
        setIsDebugMode={setIsDebugMode}
        onExportAnnotations={handleExportAllAnnotations}
        storageType={storageType}
        isAuthenticated={authenticated}
        onLogout={handleLogout}
        onSync={handleSyncToRemote}
        onSetupHelp={() => setSetupHelpOpen(true)}
        currentUser={getCurrentUser()?.email || 'Guest'}
      />
      
      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} maxWidth="xs" fullWidth>
        <DialogTitle>Syncing Data to Cloud</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            {syncStatus === 'syncing' && (
              <>
                <Box sx={{ mb: 2 }}>
                  <CloudUploadIcon color="primary" sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="body1" gutterBottom>
                  Syncing your data to the cloud...
                </Typography>
              </>
            )}
            
            {syncStatus === 'success' && (
              <>
                <Box sx={{ mb: 2, color: 'success.main' }}>
                  <CloudUploadIcon color="success" sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="body1" gutterBottom>
                  Data successfully synced!
                </Typography>
              </>
            )}
            
            {syncStatus === 'error' && (
              <>
                <Box sx={{ mb: 2, color: 'error.main' }}>
                  <CloudUploadIcon color="error" sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="body1" gutterBottom>
                  Error syncing data.
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>
      
      <Box className="app-container" sx={{ flexGrow: 1 }}>
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ThreadList 
                threads={filteredThreads} 
                selectedThreadId={selectedThread?.id} 
                onThreadSelect={handleThreadSelect}
                filter={filter}
                onFilterChange={setFilter}
                sortOrder={sortOrder}
                onSortOrderChange={handleSortOrderChange}
                onDeleteThread={handleDeleteThread}
                onRenameThread={handleRenameThread}
                panelTitle="Threads"
              />
            </Box>
          </Panel>
          
          <ResizeHandle />
          
          <Panel defaultSize={50} minSize={30}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ConversationView 
                thread={selectedThread} 
                panelTitle="Thread Detail"
              />
            </Box>
          </Panel>
          
          <ResizeHandle />
          
          <Panel defaultSize={30} minSize={20}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <AnnotationPanel 
                thread={selectedThread}
                onSave={handleAnnotationSave}
                onPrevious={handleNavigatePrevious}
                onNext={handleNavigateNext}
                onDeleteAnnotation={handleDeleteAnnotation}
                hasPrevious={filteredThreads.length > 0 && selectedThreadIndex > 0}
                hasNext={filteredThreads.length > 0 && selectedThreadIndex < filteredThreads.length - 1}
                panelTitle="Annotations"
                previousTags={getAllUniqueTags()}
              />
            </Box>
          </Panel>
        </PanelGroup>
      </Box>

      <CsvImportDialog
        open={csvImportDialogOpen}
        onClose={handleImportClose}
        onImport={handleImportThreads}
      />

      <SettingsDialog
        open={settingsDialogOpen}
        onClose={handleSettingsClose}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        threadId={threadToDelete}
      />

      {/* Rename Thread Dialog */}
      <Dialog open={renameDialogOpen} onClose={handleCloseRenameDialog}>
        <DialogTitle>Rename Thread</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Thread Title"
            type="text"
            fullWidth
            variant="outlined"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRenameDialog}>Cancel</Button>
          <Button onClick={handleConfirmRename} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
          action={
            notification.severity === 'error' && notification.message.includes('Firebase') ? (
              <Button color="inherit" size="small" onClick={() => setSetupHelpOpen(true)}>
                Setup Help
              </Button>
            ) : undefined
          }
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {renderDebugPanel()}

      {renderSetupHelp()}
    </Box>
  );
};

export default App; 