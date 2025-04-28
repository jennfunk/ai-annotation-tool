import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, Chip, Menu, MenuItem, Divider } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import BugReportIcon from '@mui/icons-material/BugReport';
import DownloadIcon from '@mui/icons-material/Download';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const Header = ({ 
  onImportClick, 
  onSettingsClick, 
  onAddThread,
  onRunDiagnostics,
  onForceSave,
  isDebugMode, 
  setIsDebugMode,
  onExportAnnotations,
  storageType,
  isAuthenticated,
  onLogout,
  onSync,
  onSetupHelp,
  currentUser
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleDebugToggle = () => {
    setIsDebugMode(!isDebugMode);
    handleMenuClose();
  };
  
  const handleRunDiagnostics = () => {
    onRunDiagnostics();
    handleMenuClose();
  };
  
  const handleForceSave = () => {
    onForceSave();
    handleMenuClose();
  };
  
  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar sx={{ px: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          AI Annotation Tool
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            color="primary" 
            startIcon={<FileUploadIcon />}
            onClick={onImportClick}
          >
            Import
          </Button>
          
          <Button 
            color="primary" 
            startIcon={<DownloadIcon />}
            onClick={onExportAnnotations}
          >
            Export
          </Button>
          
          <Button
            color="primary"
            startIcon={<SettingsIcon />}
            onClick={onSettingsClick}
          >
            Settings
          </Button>
          
          {isAuthenticated ? (
            <>
              <Chip
                icon={<AccountCircleIcon />}
                label={currentUser}
                variant="outlined"
                color="primary"
                onClick={handleMenuOpen}
              />
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    Signed in as {currentUser}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={onLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
                
                {isDebugMode && (
                  <>
                    <Divider />
                    <MenuItem onClick={handleRunDiagnostics}>
                      Run Diagnostics
                    </MenuItem>
                    <MenuItem onClick={handleForceSave}>
                      Force Save
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <Chip
              icon={<CloudOffIcon />}
              label="Local Storage Only"
              variant="outlined"
              color="default"
            />
          )}
          
          <Tooltip title={isDebugMode ? "Disable Debug Mode" : "Enable Debug Mode"}>
            <IconButton 
              color={isDebugMode ? "error" : "default"}
              onClick={handleDebugToggle}
              size="small"
            >
              <BugReportIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 