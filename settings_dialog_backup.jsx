import React, { useState, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Paper,
  Switch,
  FormControlLabel,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import StorageManager from '../utils/storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SettingsDialog = ({ open, onClose }) => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, text: '', severity: 'info' });
  const [replaceData, setReplaceData] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [storageType, setStorageType] = useState('');
  const fileInputRef = useRef(null);

  // Load storage information when dialog opens
  React.useEffect(() => {
    if (open) {
      refreshStorageInfo();
      checkStorageStatus();
    }
  }, [open]);

  const refreshStorageInfo = async () => {
    try {
      const info = await StorageManager.getStorageInfo();
      setStorageInfo(info);
      
      // Get storage type
      const type = await StorageManager.getStorageType();
      setStorageType(type);
    } catch (error) {
      console.error('Error getting storage info:', error);
    }
  };

  const checkStorageStatus = async () => {
    try {
      // Run the test storage function
      const testResult = await StorageManager.testStorage();
      setDebugInfo(testResult);
    } catch (error) {
      console.error('Error checking storage status:', error);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const success = await StorageManager.exportData();
      if (success) {
        setMessage({
          show: true,
          text: 'Data exported successfully. Download started.',
          severity: 'success'
        });
      } else {
        setMessage({
          show: true,
          text: 'Failed to export data.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        show: true,
        text: `Export failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        const success = await StorageManager.importData(importData, replaceData);
        
        if (success) {
          setMessage({
            show: true,
            text: `Data imported successfully. ${replaceData ? 'All existing data was replaced.' : 'Data was merged with existing data.'}`,
            severity: 'success'
          });
          refreshStorageInfo();
          checkStorageStatus();
          
          // Refresh the page to load the imported data
          // We could instead emit an event that the App component listens for
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage({
            show: true,
            text: 'Failed to import data. Invalid format.',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Import error:', error);
        setMessage({
          show: true,
          text: `Import failed: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
        // Reset file input
        event.target.value = null;
      }
    };
    
    reader.onerror = () => {
      setMessage({
        show: true,
        text: 'Error reading file.',
        severity: 'error'
      });
      setLoading(false);
    };
    
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setLoading(true);
      try {
        const success = await StorageManager.clearAllData();
        
        if (success) {
          setMessage({
            show: true,
            text: 'All data has been cleared. The page will reload.',
            severity: 'success'
          });
          
          // Refresh the page after clearing data
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage({
            show: true,
            text: 'Failed to clear data.',
            severity: 'error'
          });
        }
        
        await refreshStorageInfo();
        await checkStorageStatus();
      } catch (error) {
        console.error('Error clearing data:', error);
        setMessage({
          show: true,
          text: `Error clearing data: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Force a save of test data to storage
  const handleTestStorage = async () => {
    try {
      // Test storing and retrieving data
      const testData = {
        testId: 'test-' + Date.now(),
        timestamp: new Date().toISOString(),
        message: 'This is a test item'
      };
      
      // Get existing threads or create a new array
      const threads = await StorageManager.getThreads() || [];
      
      // Add our test thread
      const testThread = {
        id: 'test-thread-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [{
          role: 'human',
          content: 'Test message',
          timestamp: new Date().toISOString()
        }],
        isAnnotated: false,
        annotations: {},
        testData
      };
      
      threads.push(testThread);
      
      // Save to storage
      const saveResult = await StorageManager.saveThreads(threads);
      
      // Refresh debug info
      await checkStorageStatus();
      await refreshStorageInfo();
      
      setMessage({
        show: true,
        text: saveResult ? 
          `Test data saved successfully to ${storageType}. Try refreshing the page to see if it persists.` : 
          `Failed to save test data to ${storageType}.`,
        severity: saveResult ? 'success' : 'error'
      });
    } catch (error) {
      console.error('Test storage error:', error);
      setMessage({
        show: true,
        text: `Test failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Render storage information based on type
  const renderStorageInfo = () => {
    if (!storageInfo) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (storageType === 'IndexedDB') {
      return (
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Storage Type" 
              secondary="IndexedDB (more durable storage)"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Thread Count" 
              secondary={storageInfo.threadCount}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Storage Limits" 
              secondary="Typically 50MB-2GB (varies by browser)"
            />
          </ListItem>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary', px: 2 }}>
            <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            IndexedDB provides much larger storage capacity than localStorage, with better
            reliability and performance for complex data.
          </Typography>
        </List>
      );
    } else {
      // localStorage info
      return (
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Storage Type" 
              secondary="localStorage (limited browser storage)"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Thread Count" 
              secondary={storageInfo.threadCount}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Total Storage Used" 
              secondary={`${storageInfo.totalSizeKB} KB`}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Threads Storage" 
              secondary={`${storageInfo.threadsSizeKB} KB`}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Settings Storage" 
              secondary={`${storageInfo.settingsSizeKB} KB`}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary="Estimated Remaining Storage" 
              secondary={`${storageInfo.estimatedRemaining} KB`}
            />
          </ListItem>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary', px: 2 }}>
            <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            localStorage has a typical limit of 5MB per domain. If you approach this limit, 
            consider exporting and then clearing some data.
          </Typography>
        </List>
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Settings & Data Management
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {message.show && (
          <Alert 
            severity={message.severity} 
            sx={{ mb: 2 }}
            onClose={() => setMessage({ ...message, show: false })}
          >
            {message.text}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Data Management
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Export & Import</Typography>
          <DialogContentText sx={{ mb: 2 }}>
            Export your data to a file for backup or transfer to another device. 
            You can import previously exported data to restore your threads and annotations.
          </DialogContentText>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />} 
              onClick={handleExportData}
              disabled={loading}
            >
              Export All Data
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadIcon />}
              onClick={handleImportClick}
              disabled={loading}
            >
              Import Data
            </Button>
            
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={replaceData}
                onChange={(e) => setReplaceData(e.target.checked)}
              />
            }
            label="Replace all existing data on import (otherwise merge)"
          />
        </Paper>

        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" color="primary">
              Storage Diagnostics
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" gutterBottom>
              If you're having issues with data not being saved between sessions, use these tools to diagnose the problem.
            </Typography>
            
            <Button 
              variant="outlined"
              color="primary"
              onClick={handleTestStorage}
              sx={{ my: 1 }}
            >
              Test Storage Persistence
            </Button>
            
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              {storageType} Status:
            </Typography>
            
            {debugInfo ? (
              <Box sx={{ mt: 1, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto' }}>
                <Typography variant="body2" component="div">
                  <strong>Available:</strong> {debugInfo.isAvailable ? 'Yes ✅' : 'No ❌'}
                  {debugInfo.isAvailable && (
                    <>
                      <br />
                      <strong>Test Passed:</strong> {(debugInfo.testPassed || debugInfo.isWorking) ? 'Yes ✅' : 'No ❌'}
                      <br />
                      <strong>Storage Type:</strong> {debugInfo.storageType || storageType}
                      {debugInfo.storageType === 'localStorage' && debugInfo.storageContents && (
                        <>
                          <br />
                          <strong>Current localStorage Items:</strong>
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                            {JSON.stringify(debugInfo.storageContents, null, 2)}
                          </pre>
                        </>
                      )}
                    </>
                  )}
                  {!debugInfo.isAvailable && (
                    <>
                      <br />
                      <strong>Error:</strong> {debugInfo.error}
                    </>
                  )}
                </Typography>
              </Box>
            ) : (
              <CircularProgress size={24} sx={{ ml: 2 }} />
            )}
          </AccordionDetails>
        </Accordion>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom color="error">
            Danger Zone
          </Typography>
          
          <DialogContentText sx={{ mb: 2 }}>
            Clearing all data will permanently delete all threads and annotations. This action cannot be undone.
          </DialogContentText>
          
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />} 
            onClick={handleClearData}
            disabled={loading}
          >
            Clear All Data
          </Button>
        </Paper>
        
        <Typography variant="h6" gutterBottom>
          Storage Information
        </Typography>
        
        <Paper sx={{ p: 2 }}>
          {renderStorageInfo()}
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog; 