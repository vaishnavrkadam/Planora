import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, Stack, Chip, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import FlightIcon from '@mui/icons-material/Flight';
import TrainIcon from '@mui/icons-material/Train';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PublicIcon from '@mui/icons-material/Public';

export default function Preferences() {
  const navigate = useNavigate();
  const [travelMode, setTravelMode] = useState('No Preference');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableStyles = ['Traditional', 'Romantic', 'Historic', 'Adventure', 'Nature', 'Relaxation'];

  // Handle selection styling toggle behavior for array configurations
  const toggleStyle = (style) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((item) => item !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  // Submit profile preferences metrics direct to Firebase Firestore backend
  const handleSubmitProfile = async () => {
    setError('');
    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      setError('Session timed out. Please register or sign in again.');
      setLoading(false);
      return;
    }

    try {
      // Maps to the exact structured format planned in Excel Step #1
      await setDoc(doc(db, 'Users', user.uid), {
        userId: user.uid,
        email: user.email,
        createdAt: new Date().toISOString(),
        travelPreference: travelMode,
        tripStyles: selectedStyles,
      });

      // Route onward to dashboard space
      navigate('/dashboard');
    } catch (err) {
      setError('Could not save choices to database: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 4, md: 8 }, mb: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        <Box>
          <Typography variant="h2" sx={{ fontSize: '32px', mb: 1, fontWeight: '800' }}>Tailor Your Vibe</Typography>
          <Typography sx={{ color: '#cbc3d7' }}>Tell us what you love so our engine can balance your budget plans.</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ffb4ab' }}>{error}</Alert>}

        {/* SECTION A: TRAVEL MODE SELECTION */}
        <Box>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: '600', mb: 2, letterSpacing: '0.05em', color: '#FFFFFF' }}>
            PREFERRED MODE OF TRAVEL
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {[
              { label: 'Flight', icon: <FlightIcon /> },
              { label: 'Train', icon: <TrainIcon /> },
              { label: 'Bus', icon: <DirectionsBusIcon /> },
              { label: 'No Preference', icon: <PublicIcon /> }
            ].map((mode) => (
              <Button
                key={mode.label}
                variant="outlined"
                fullWidth
                startIcon={mode.icon}
                onClick={() => setTravelMode(mode.label)}
                sx={{
                  py: 1.8,
                  borderRadius: '16px',
                  borderColor: travelMode === mode.label ? '#8B5CF6' : 'rgba(255,255,255,0.08)',
                  backgroundColor: travelMode === mode.label ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                  color: travelMode === mode.label ? '#d0bcff' : '#cbc3d7',
                  boxShadow: travelMode === mode.label ? '0 0 12px rgba(139, 92, 246, 0.2)' : 'none',
                  '&:hover': {
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                  }
                }}
              >
                {mode.label}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* SECTION B: TRAVEL STYLES CHIPS */}
        <Box>
          <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: '600', mb: 2, letterSpacing: '0.05em', color: '#FFFFFF' }}>
            TRIP EXPERIENCES & STYLES (SELECT ALL THAT APPLY)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {availableStyles.map((style) => {
              const isSelected = selectedStyles.includes(style);
              return (
                <Chip
                  key={style}
                  label={style}
                  onClick={() => toggleStyle(style)}
                  sx={{
                    px: 2,
                    py: 2.5,
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.12)',
                    backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#8B5CF6',
                      backgroundColor: isSelected ? '#7c3aed' : 'rgba(139, 92, 246, 0.1)',
                    }
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* ACTIONS */}
        <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleSubmitProfile}
            sx={{
              backgroundColor: '#8B5CF6',
              color: '#FFFFFF',
              px: 5,
              py: 1.5,
              fontSize: '15px',
              borderRadius: '16px',
              '&:hover': { backgroundColor: '#7c3aed' }
            }}
          >
            {loading ? 'Saving Profile...' : 'Complete Registration'}
          </Button>
        </Box>

      </Paper>
    </Container>
  );
}