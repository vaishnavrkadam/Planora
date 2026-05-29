import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, TextField, Divider, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import GoogleIcon from '@mui/icons-material/Google';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  // Handle standard Email & Password logic
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        // Create user authentication profile
        await createUserWithEmailAndPassword(auth, email, password);
        // New registrations always go to preferences onboarding
        navigate('/preferences');
      } else {
        // Existing users go straight to the dashboard
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  // Handle Google Popup Authentication
  const handleGoogleAuth = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if this is a newly created account via Google
      const isNewUser = result._tokenResponse?.isNewUser;
      
      if (isNewUser) {
        navigate('/preferences');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 6, md: 10 }, mb: 4 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        <Box sx={{ textAlign: 'center' }}>
          <AutoAwesomeIcon sx={{ color: '#8B5CF6', fontSize: 32, mb: 1 }} />
          <Typography variant="h2" sx={{ fontSize: '28px', mb: 1 }}>
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#cbc3d7' }}>
            {isRegistering ? 'Join Planora to map your ideal escape budget.' : 'Access your personalized etheric itineraries.'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ffb4ab' }}>{error}</Alert>}

        <Box component="form" onSubmit={handleEmailAuth} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {isRegistering && (
            <TextField
              label="Full Name"
              type="text"
              fullWidth
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}

          <TextField
            label="Email Address"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: '#8B5CF6',
              py: 1.5,
              fontSize: '15px',
              color: '#FFFFFF',
              '&:hover': { backgroundColor: '#7c3aed' },
            }}
          >
            {isRegistering ? 'Register Account' : 'Sign In'}
          </Button>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" sx={{ color: '#cbc3d7', px: 1 }}>or</Typography>
        </Divider>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={handleGoogleAuth}
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            py: 1.5,
            borderRadius: '16px',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255,255,255,0.02)',
            },
          }}
        >
          Continue with Google
        </Button>

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button
            onClick={() => setIsRegistering(!isRegistering)}
            sx={{ color: '#d0bcff', textTransform: 'none', fontWeight: '500' }}
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register here"}
          </Button>
        </Box>

      </Paper>
    </Container>
  );
}