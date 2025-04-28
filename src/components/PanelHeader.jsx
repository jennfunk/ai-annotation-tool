import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const PanelHeader = ({ title, children }) => {
  return (
    <Box sx={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 10, 
      bgcolor: 'white', 
      borderBottom: 'none',
      height: '52px', // Fixed height for consistent alignment
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <Box sx={{ 
        px: 2, 
        py: 1.5, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexGrow: 1
      }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
        {children}
      </Box>
      <Divider />
    </Box>
  );
};

export default PanelHeader; 