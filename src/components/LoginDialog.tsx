import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(registerEmail, registerPassword, registerUsername);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon />
            <Typography variant="h6">Authentication</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <TabPanel value={tab} index={0}>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !loginEmail || !loginPassword}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Box>
          </form>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <form onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="Username"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              margin="normal"
              required
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              helperText="Must be at least 8 characters"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              error={confirmPassword !== '' && confirmPassword !== registerPassword}
              helperText={
                confirmPassword !== '' && confirmPassword !== registerPassword
                  ? 'Passwords do not match'
                  : ''
              }
            />
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={
                  loading ||
                  !registerEmail ||
                  !registerPassword ||
                  !registerUsername ||
                  !confirmPassword
                }
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Box>
          </form>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Typography variant="caption" color="text.secondary">
          Authentication is optional for viewing public data
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;