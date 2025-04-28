import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  ToggleButtonGroup, 
  ToggleButton,
  Paper,
  IconButton,
  ListItemSecondaryAction,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import SortIcon from '@mui/icons-material/Sort';
import PanelHeader from './PanelHeader';
import { formatTimestamp } from '../utils/helpers';

const ThreadList = ({ 
  threads, 
  selectedThreadId, 
  onThreadSelect,
  onRenameThread,
  filter, 
  onFilterChange,
  sortOrder,
  onSortOrderChange,
  onDeleteThread,
  panelTitle = "Threads"
}) => {
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      onFilterChange(newFilter);
    }
  };
  
  const handleSortChange = (event) => {
    onSortOrderChange(event.target.value);
  };
  
  const handleDeleteClick = (event, threadId) => {
    // Stop propagation to prevent the thread selection
    event.stopPropagation();
    event.preventDefault();
    onDeleteThread(threadId);
  };

  const handleRenameClick = (event, thread) => {
    // Stop propagation to prevent the thread selection
    event.stopPropagation();
    event.preventDefault();
    if (onRenameThread) {
      onRenameThread(thread);
    }
  };
  
  return (
    <Box className="thread-list" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PanelHeader title={panelTitle} />
      
      <Paper elevation={0} sx={{ p: 2, borderBottom: '1px solid #ddd', bgcolor: 'white' }}>
        <Typography variant="subtitle2" gutterBottom>
          All Threads {threads.length > 0 && `(${threads.length})`}
        </Typography>
        
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
          sx={{ mb: 2 }}
          fullWidth
        >
          <ToggleButton value="all">ALL</ToggleButton>
          <ToggleButton value="unannotated">SHOW UNANNOTATED</ToggleButton>
        </ToggleButtonGroup>
        
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-order-label">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SortIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Sort by date
                </Box>
              </InputLabel>
              <Select
                labelId="sort-order-label"
                id="sort-order-select"
                value={sortOrder}
                label="Sort by date"
                onChange={handleSortChange}
              >
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      <List disablePadding sx={{ flexGrow: 1, overflow: 'auto' }}>
        {threads.map((thread) => (
          <ListItem
            key={thread.id}
            className={`thread-item ${thread.id === selectedThreadId ? 'selected' : ''}`}
            onClick={() => onThreadSelect(thread.id)}
            divider
            disableGutters
            sx={{ 
              px: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f0f7ff'
              },
              ...(thread.id === selectedThreadId ? {
                backgroundColor: '#e3f2fd',
                borderLeft: '4px solid #2196f3'
              } : {})
            }}
            dense
            selected={thread.id === selectedThreadId}
          >
            <ListItemText
              primary={thread.title || thread.id}
              secondary={
                <Box className="thread-meta">
                  <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mb: 0.5 }}>
                    ID: {thread.id}
                  </Typography>
                  <Typography variant="body2" component="span">
                    Created: {formatTimestamp(thread.createdAt)}
                  </Typography>
                  <br />
                  <Typography variant="body2" component="span">
                    Updated: {formatTimestamp(thread.updatedAt)}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction
              onClick={(e) => e.stopPropagation()}
              sx={{ right: 8 }}
            >
              <Box sx={{ display: 'flex' }}>
                <Tooltip title="Rename thread">
                  <IconButton 
                    edge="end" 
                    aria-label="rename" 
                    onClick={(e) => handleRenameClick(e, thread)}
                    size="small"
                    sx={{ mr: 0.5 }}
                  >
                    <DriveFileRenameOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete thread">
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={(e) => handleDeleteClick(e, thread.id)}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ThreadList; 