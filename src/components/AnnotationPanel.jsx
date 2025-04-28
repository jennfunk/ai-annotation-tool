import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Chip,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import PanelHeader from './PanelHeader';
import { formatTimestamp } from '../utils/helpers';

const AnnotationPanel = ({ 
  thread, 
  onSave, 
  onPrevious, 
  onNext,
  onDeleteAnnotation,
  hasPrevious = true,
  hasNext = true,
  panelTitle = "Annotations",
  previousTags = []
}) => {
  const [rating, setRating] = useState(null); // 'good', 'bad'
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  
  useEffect(() => {
    // Reset form when thread changes
    if (thread) {
      setRating(null);
      setNotes('');
      setTags([]);
    }
  }, [thread?.id]);
  
  const handleRatingChange = (event, newRating) => {
    if (newRating !== null) {
      setRating(newRating);
    }
  };
  
  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };
  
  const handleNewTagChange = (event) => {
    setNewTag(event.target.value);
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleAddTag();
    }
  };
  
  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleSelectPreviousTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };
  
  const handleSave = () => {
    if (!thread) return;
    
    const annotation = {
      rating,
      notes,
      tags,
      timestamp: new Date().toISOString()
    };
    
    onSave(thread.id, annotation);
    
    // Reset form after saving
    setRating(null);
    setNotes('');
    setTags([]);
  };

  const handleDeleteAnnotation = (index, event) => {
    // Prevent event bubbling up to parent elements
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (thread && onDeleteAnnotation) {
      onDeleteAnnotation(thread.id, index);
    }
  };
  
  if (!thread) {
    return (
      <Box className="annotation-panel" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <PanelHeader title={panelTitle} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Select a thread to annotate
          </Typography>
        </Box>
      </Box>
    );
  }

  // Extract previous annotations - convert from object to array if needed
  let previousAnnotations = [];
  if (thread.annotations) {
    if (Array.isArray(thread.annotations)) {
      previousAnnotations = thread.annotations;
    } else {
      // If annotations is an object, convert it to an array with a single item
      previousAnnotations = [thread.annotations];
    }
  }
  
  // Filter out already selected tags from previous tags
  const availablePreviousTags = previousTags.filter(tag => !tags.includes(tag));

  return (
    <Box className="annotation-panel" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader title={panelTitle} />
      
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {previousAnnotations.length > 0 && (
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Previous Annotations ({previousAnnotations.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List disablePadding>
                {previousAnnotations.map((annotation, index) => (
                  <ListItem 
                    key={index} 
                    divider={index < previousAnnotations.length - 1}
                    sx={{ 
                      flexDirection: 'column', 
                      alignItems: 'flex-start', 
                      py: 1 
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      width: '100%', 
                      justifyContent: 'space-between', 
                      mb: 1
                    }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {annotation.createdBy || annotation.reviewer?.name || 'Anonymous'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                          {formatTimestamp(annotation.timestamp)}
                        </Typography>
                        <Tooltip title="Delete annotation">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(event) => handleDeleteAnnotation(index, event)}
                            sx={{ 
                              p: 0.5,
                              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        icon={annotation.rating === 'good' ? <ThumbUpIcon /> : <ThumbDownIcon />}
                        label={annotation.rating === 'good' ? 'Good' : 'Bad'}
                        color={annotation.rating === 'good' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    {annotation.notes && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {annotation.notes}
                      </Typography>
                    )}
                    
                    {annotation.tags && annotation.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {annotation.tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}
        
        <Typography variant="h6" gutterBottom>
          Rate Conversation
        </Typography>
        
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <ToggleButtonGroup
            value={rating}
            exclusive
            onChange={handleRatingChange}
            aria-label="conversation rating"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton 
              value="good" 
              aria-label="good rating" 
              sx={{ 
                color: rating === 'good' ? 'white' : '#66bb6a',
                bgcolor: rating === 'good' ? '#66bb6a' : 'transparent',
                '&:hover': {
                  bgcolor: rating === 'good' ? '#66bb6a' : 'rgba(102, 187, 106, 0.1)'
                }
              }}
            >
              <ThumbUpIcon sx={{ mr: 1 }} />
              Good
            </ToggleButton>
            <ToggleButton 
              value="bad" 
              aria-label="bad rating"
              sx={{ 
                color: rating === 'bad' ? 'white' : '#f44336',
                bgcolor: rating === 'bad' ? '#f44336' : 'transparent',
                '&:hover': {
                  bgcolor: rating === 'bad' ? '#f44336' : 'rgba(244, 67, 54, 0.1)'
                }
              }}
            >
              <ThumbDownIcon sx={{ mr: 1 }} />
              Bad
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
        
        <Typography variant="h6" gutterBottom>
          Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Add your notes here..."
          variant="outlined"
          value={notes}
          onChange={handleNotesChange}
          sx={{ mb: 3 }}
        />
        
        <Typography variant="h6" gutterBottom>
          Add Tags
        </Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Add tags (press Enter to add)"
            variant="outlined"
            value={newTag}
            onChange={handleNewTagChange}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleAddTag}
                    edge="end"
                    color="primary"
                    disabled={!newTag.trim()}
                  >
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          {availablePreviousTags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Previously used tags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availablePreviousTags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onClick={() => handleSelectPreviousTag(tag)}
                    color="default"
                    variant="outlined"
                    size="small"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={onPrevious}
            disabled={!hasPrevious}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            disabled={!rating}
          >
            Submit Annotation
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={onNext}
            disabled={!hasNext}
            endIcon={<ArrowForwardIcon />}
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AnnotationPanel; 