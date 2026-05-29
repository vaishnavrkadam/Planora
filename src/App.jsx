import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Grid } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

// Import our new page components securely
import Login from './pages/Login';
import Preferences from './pages/Preferences';
import Dashboard from './pages/Dashboard';
import DataImporter from './pages/DataImporter';

// Landing Page Content Component
function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ pb: 8 }}>
      {/* FLOATING NAV BAR */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3, px: 2 }}>
        <Paper 
          sx={{ 
            width: '100%', 
            maxWidth: '1200px', 
            px: 3, 
            py: 1.5, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderRadius: '9999px',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#8B5CF6' }} /> Planora
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
            sx={{ 
              backgroundColor: '#8B5CF6', 
              color: '#FFFFFF',
              borderRadius: '9999px',
              px: 3,
              '&:hover': { backgroundColor: '#7c3aed' }
            }}
          >
            Get Started
          </Button>
        </Paper>
      </Box>

      {/* HERO SECTION */}
      <Container maxWidth="md" sx={{ textAlign: 'center', mt: { xs: 8, md: 12 }, mb: 8 }}>
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '36px', md: '56px' }, 
            lineHeight: { xs: '44px', md: '64px' },
            mb: 3 
          }}
        >
          Travel smart. <br />
          Stay strictly within your <span style={{ color: '#d0bcff' }}>Budget</span>.
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#cbc3d7', 
            maxWidth: '600px', 
            mx: 'auto', 
            mb: 5,
            fontSize: '18px' 
          }}
        >
          Planora designs beautiful, tailored itineraries matching your personal vibe, completely mapping every hotel, meal, and travel activity cost automatically down to the last penny.
        </Typography>

        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/login')}
          sx={{ 
            backgroundColor: '#8B5CF6', 
            color: '#FFFFFF',
            borderRadius: '16px',
            px: 5,
            py: 1.8,
            fontSize: '16px',
            boxShadow: '0px 20px 40px rgba(139, 92, 246, 0.2)',
            '&:hover': { backgroundColor: '#7c3aed' }
          }}
        >
          Start Planning Free
        </Button>
      </Container>

      {/* FEATURE GRID */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#adc6ff', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>Budget First</Typography>
              <Typography sx={{ color: '#cbc3d7' }}>
                No hidden financial surprises. Every activity cost baseline is structured straight into your schedule itinerary breakdown.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <AutoAwesomeIcon sx={{ fontSize: 40, color: '#ffafd3', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>Vibe Alignment</Typography>
              <Typography sx={{ color: '#cbc3d7' }}>
                Whether you like historic architecture, deep cultural traditional experiences, or romantic getaways, your trips dynamically match you.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <TravelExploreIcon sx={{ fontSize: 40, color: '#d0bcff', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>Optimal Scheduling</Typography>
              <Typography sx={{ color: '#cbc3d7' }}>
                Activities dynamically prioritize running at their absolute best month or optimized hour of day automatically.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

// Master App Routing Map
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/import-utility" element={<DataImporter />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;