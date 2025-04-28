import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  IconButton, 
  Collapse 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PanelHeader from './PanelHeader';
import { formatDate, formatTimestamp } from '../utils/helpers';

const CollapsibleSection = ({ children, title, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <Box sx={{ mb: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          py: 0.5,
          borderBottom: '1px solid #eee'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small">
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pt: 1 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

const ConversationView = ({ thread, panelTitle = "Thread Detail" }) => {
  if (!thread) {
    return (
      <Box className="conversation-view" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PanelHeader title={panelTitle} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Select a thread to view the conversation
          </Typography>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box className="conversation-view" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader title={panelTitle} />
      
      <Box className="conversation-content" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {thread.messages && thread.messages.map((message, index) => {
          // Normalize role values to handle different formats
          const normalizedRole = (message.role || '').toLowerCase();
          const isHuman = normalizedRole === 'human' || normalizedRole === 'user';
          const isAI = normalizedRole === 'ai' || normalizedRole === 'assistant';
          const isToolCall = message.type === 'tool_call';
          const isToolResponse = message.type === 'tool_response';
          const isInstructions = normalizedRole === 'instructions';
          const isTool = normalizedRole === 'tool' && !isToolResponse;
          const isError = normalizedRole === 'error';
          
          return (
            <Box key={index} sx={{ mb: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: isHuman ? 'flex-end' : 'flex-start',
                  mb: 0.5
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  color="text.secondary"
                  sx={{ textTransform: 'capitalize' }}
                >
                  {isHuman ? 'User' : isAI ? 'Assistant' : message.role}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ ml: 1 }}
                >
                  {formatTimestamp(message.timestamp)}
                </Typography>
              </Box>
              
              {isHuman && (
                <Paper 
                  className="message human-message" 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#e3f2fd', 
                    maxWidth: '80%', 
                    ml: 'auto'
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                </Paper>
              )}
              
              {isAI && (
                <Paper 
                  className="message ai-message" 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#f5f5f5', 
                    maxWidth: '80%'
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                </Paper>
              )}
              
              {isInstructions && (
                <Paper 
                  className="message instructions-message" 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#fff8e1', 
                    maxWidth: '80%',
                    borderLeft: '4px solid #ffc107'
                  }}
                >
                  <CollapsibleSection title="Instructions" defaultExpanded={false}>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.85rem'
                      }}
                    >
                      {message.content}
                    </Typography>
                  </CollapsibleSection>
                </Paper>
              )}
              
              {isTool && (
                <Paper 
                  className="message tool-message" 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#e8f5e9', 
                    maxWidth: '80%',
                    borderLeft: '4px solid #4caf50',
                    fontFamily: 'monospace'
                  }}
                >
                  <CollapsibleSection title="Tool Call" defaultExpanded={false}>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.85rem'
                      }}
                    >
                      {message.content}
                    </Typography>
                  </CollapsibleSection>
                </Paper>
              )}
              
              {isError && (
                <Paper 
                  className="message error-message" 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#ffebee', 
                    maxWidth: '80%',
                    borderLeft: '4px solid #f44336'
                  }}
                >
                  <CollapsibleSection title="Error" defaultExpanded={false}>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.85rem'
                      }}
                    >
                      {message.content}
                    </Typography>
                  </CollapsibleSection>
                </Paper>
              )}
              
              {isToolCall && (
                <Paper 
                  className="tool-call" 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#f0f7ff', 
                    maxWidth: '80%',
                    fontFamily: 'monospace'
                  }}
                >
                  <CollapsibleSection title="Tool Call" defaultExpanded={false}>
                    <Typography variant="body2" gutterBottom>
                      Call ID: {message.callId}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Tool Name: {message.toolName}
                    </Typography>
                    {message.parameters && (
                      <Box mt={1}>
                        <Typography variant="body2" fontWeight="bold">Parameters:</Typography>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                          {JSON.stringify(message.parameters, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </CollapsibleSection>
                </Paper>
              )}
              
              {isToolResponse && (
                <Paper 
                  className="tool-response" 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: '#f5f5f5', 
                    maxWidth: '80%',
                    borderLeft: '4px solid #4caf50'
                  }}
                >
                  <CollapsibleSection title="Tool Response" defaultExpanded={false}>
                    <Typography variant="body2" component="pre" 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem'
                      }}
                    >
                      {typeof message.content === 'object' 
                        ? JSON.stringify(message.content, null, 2) 
                        : message.content}
                    </Typography>
                  </CollapsibleSection>
                </Paper>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ConversationView; 