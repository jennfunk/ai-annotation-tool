import React, { useState } from 'react';
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
  LinearProgress,
  Alert,
  Paper,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import SubjectIcon from '@mui/icons-material/Subject';
import TagIcon from '@mui/icons-material/Tag';
import MessageIcon from '@mui/icons-material/Message';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ForumIcon from '@mui/icons-material/Forum';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

// CSV format expected:
// message_id,thread_id,role,timestamp,content
// msg_123,thread_123,User,2023-05-01T10:15:00Z,Hello
// msg_124,thread_123,Assistant,2023-05-01T10:16:00Z,How can I help you?
// msg_125,thread_123,Instructions,2023-05-01T10:16:05Z,Run instructions...
// msg_126,thread_123,Tool,2023-05-01T10:16:10Z,search_for_data...
// msg_127,thread_123,Error,2023-05-01T10:16:15Z,Error: ValueError...
// ... and so on

const CsvImportDialog = ({ open, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Clear previous data when switching tabs
    setFile(null);
    setCsvText('');
    setPreview(null);
    setError('');
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      setFile(null);
      setPreview(null);
      return;
    }

    setError('');
    setFile(selectedFile);
    
    // Preview the first few rows
    Papa.parse(selectedFile, {
      preview: 3,
      header: true,
      complete: (results) => {
        setPreview(results.data);
      },
      error: (error) => {
        setError('Error parsing CSV: ' + error.message);
      }
    });
  };

  const handleTextChange = (event) => {
    const text = event.target.value;
    setCsvText(text);
    
    if (!text.trim()) {
      setPreview(null);
      return;
    }
    
    // Preview the first few rows of the pasted content
    Papa.parse(text, {
      preview: 3,
      header: true,
      complete: (results) => {
        setPreview(results.data);
      },
      error: (error) => {
        setError('Error parsing CSV: ' + error.message);
      }
    });
  };

  const handleImport = () => {
    if (activeTab === 0 && !file) {
      setError('Please select a file first');
      return;
    }
    
    if (activeTab === 1 && !csvText.trim()) {
      setError('Please paste CSV content first');
      return;
    }

    setLoading(true);
    setError('');
    
    // Choose the source based on active tab
    const source = activeTab === 0 ? file : csvText;

    Papa.parse(source, {
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setLoading(false);
          return;
        }

        try {
          // Validate and transform the data to match the thread structure
          const importedThreads = [];
          const now = new Date().toISOString();
          
          // Process by conversation threads
          // Group by thread ID
          const threadGroups = {};
          
          results.data.forEach(row => {
            // Skip empty rows
            if (!row.content && !row.message_id) return;
            
            const threadId = row.thread_id || 'default';
            if (!threadGroups[threadId]) {
              threadGroups[threadId] = [];
            }
            threadGroups[threadId].push(row);
          });
          
          // Create thread objects
          Object.keys(threadGroups).forEach(threadId => {
            const messages = threadGroups[threadId]
              .filter(row => row.content || row.message_id)
              .map((row, index) => {
                const content = row.content || '';
                // Map role values: convert "User" to "human" and "Assistant" to "ai"
                let role = (row.role || '').toLowerCase();
                
                // Primary roles
                if (role === 'user') role = 'human';
                if (role === 'assistant') role = 'ai';
                
                // Additional roles - keep as is with lowercase
                // The UI will handle displaying these special roles
                // 'instructions', 'tool', 'error' are now supported as-is
                
                let timestamp = row.timestamp || now;
                
                return {
                  id: row.message_id || `msg_${uuidv4()}`,
                  role: role,
                  content,
                  timestamp,
                  type: 'message'
                };
              });
            
            if (messages.length > 0) {
              importedThreads.push({
                id: threadId === 'default' ? `thread_${uuidv4()}` : threadId,
                createdAt: messages[0].timestamp || now,
                updatedAt: now,
                isAnnotated: false,
                messages,
                annotations: []
              });
            }
          });
          
          onImport(importedThreads);
          setFile(null);
          setCsvText('');
          setPreview(null);
          setLoading(false);
        } catch (err) {
          console.error('CSV import error:', err);
          setError(`Error processing CSV data: ${err.message}`);
          setLoading(false);
        }
      },
      error: (error) => {
        setError('Error parsing CSV: ' + error.message);
        setLoading(false);
      }
    });
  };

  const handleDialogClose = () => {
    setFile(null);
    setCsvText('');
    setPreview(null);
    setError('');
    setActiveTab(0);
    onClose();
  };

  // Column definitions for the format explanation
  const columnDefinitions = [
    { name: 'message_id', description: 'Unique ID for each message', icon: <TagIcon fontSize="small" color="primary" /> },
    { name: 'thread_id', description: 'ID grouping messages into conversations', icon: <ForumIcon fontSize="small" color="primary" /> },
    { name: 'role', description: '"User", "Assistant", "Instructions", "Tool", or "Error"', icon: <MessageIcon fontSize="small" color="primary" /> },
    { name: 'timestamp', description: 'Message timestamp (ISO format preferred)', icon: <AccessTimeIcon fontSize="small" color="primary" /> },
    { name: 'content', description: 'Message text content', icon: <SubjectIcon fontSize="small" color="primary" /> }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
        Import Conversations from CSV
        <IconButton
          aria-label="close"
          onClick={handleDialogClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Upload File" icon={<FileUploadIcon />} iconPosition="start" />
          <Tab label="Paste CSV" icon={<ContentPasteIcon />} iconPosition="start" />
        </Tabs>
        
        {/* File Upload Tab */}
        {activeTab === 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Upload CSV File
            </Typography>
            
            <input
              accept=".csv"
              id="csv-file-input"
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="csv-file-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<FileUploadIcon />}
              >
                Select CSV File
              </Button>
            </label>
            
            {file && (
              <Chip 
                label={file.name}
                variant="outlined" 
                color="primary"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
        )}
        
        {/* Paste CSV Tab */}
        {activeTab === 1 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Paste CSV Content
            </Typography>
            
            <TextField
              label="Paste CSV data here"
              multiline
              rows={8}
              value={csvText}
              onChange={handleTextChange}
              fullWidth
              variant="outlined"
              placeholder="message_id,thread_id,role,timestamp,content
msg_123,thread_abc,User,2023-05-01T10:15:00Z,Hello
msg_124,thread_abc,Assistant,2023-05-01T10:16:00Z,How can I help you?"
              sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {preview && (
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Preview
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(preview[0] || {}).map((key, index) => (
                      <TableCell key={index} sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                        {key}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {typeof cell === 'string' && cell.length > 50 
                            ? cell.substring(0, 50) + '...' 
                            : cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
            <InfoIcon fontSize="small" sx={{ mr: 1 }} color="info" />
            CSV File Format
          </Typography>
          
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Your CSV file should have the following columns:
              </Typography>
              
              <Box component="code" sx={{ 
                display: 'block', 
                p: 1.5, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                overflowX: 'auto',
                mb: 2
              }}>
                message_id,thread_id,role,timestamp,content
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {columnDefinitions.map((col) => (
                      <TableRow key={col.name}>
                        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                          {col.icon}
                          <Box component="span" sx={{ ml: 1, fontFamily: 'monospace' }}>
                            {col.name}
                          </Box>
                        </TableCell>
                        <TableCell>{col.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, display: 'flex', alignItems: 'center' }}>
                <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                Example: <Box component="code" sx={{ mx: 1 }}>msg_123,thread_abc,User,2023-05-01T10:15:00Z,Hello</Box>
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        {loading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Importing data...
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleDialogClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleImport}
          variant="contained" 
          disabled={(activeTab === 0 && !file) || (activeTab === 1 && !csvText.trim()) || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CsvImportDialog; 