import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Grid, Stack, AppBar, Toolbar, CircularProgress, IconButton } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Login from './pages/Login';
import Preferences from './pages/Preferences';
import Dashboard from './pages/Dashboard';
import DataImporter from './pages/DataImporter';
import Profile from './pages/Profile';
import ParkingCheckout from './pages/ParkingCheckout';
import AdminScanner from './pages/AdminScanner';

const ADMIN_EMAIL = "vaishnavkadam57@gmail.com"; 

function LandingPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3, px: 2 }}>
        <Paper sx={{ width: '100%', maxWidth: '1200px', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '9999px' }}>
          <Typography variant="h6" sx={{ fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#8B5CF6' }} /> Planora
          </Typography>
          <Button variant="contained" onClick={() => navigate('/login')} sx={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', borderRadius: '9999px', px: 3, '&:hover': { backgroundColor: '#7c3aed' } }}>
            Get Started
          </Button>
        </Paper>
      </Box>

      <Container maxWidth="md" sx={{ textAlign: 'center', mt: { xs: 8, md: 12 }, mb: 8 }}>
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '36px', md: '56px' }, lineHeight: { xs: '44px', md: '64px' }, mb: 3 }}>
          Travel smart. <br /> Stay strictly within your <span style={{ color: '#d0bcff' }}>Budget</span>.
        </Typography>
        <Typography variant="body1" sx={{ color: '#cbc3d7', maxWidth: '600px', mx: 'auto', mb: 5, fontSize: '18px' }}>
          Planora designs beautiful, tailored itineraries matching your personal vibe, completely mapping every hotel, meal, and travel activity cost automatically down to the last penny.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/login')} sx={{ backgroundColor: '#8B5CF6', color: '#FFFFFF', borderRadius: '16px', px: 5, py: 1.8, fontSize: '16px', boxShadow: '0px 20px 40px rgba(139, 92, 246, 0.2)', '&:hover': { backgroundColor: '#7c3aed' } }}>
          Start Planning Free
        </Button>
      </Container>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 40, color: '#adc6ff', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>Budget First</Typography>
              <Typography sx={{ color: '#cbc3d7' }}>No hidden financial surprises. Every activity cost baseline is structured straight into your schedule itinerary breakdown.</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <AutoAwesomeIcon sx={{ fontSize: 40, color: '#ffafd3', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>Vibe Alignment</Typography>
              <Typography sx={{ color: '#cbc3d7' }}>Whether you like historic architecture, deep cultural traditional experiences, or romantic getaways, your trips dynamically match you.</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <TravelExploreIcon sx={{ fontSize: 40, color: '#d0bcff', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>Optimal Scheduling</Typography>
              <Typography sx={{ color: '#cbc3d7' }}>Activities dynamically prioritize running at their absolute best month or optimized hour of day automatically.</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function NavigationLayout({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  if (currentPath === '/' || currentPath === '/login' || currentPath === '/preferences') {
    return <>{children}</>;
  }

  const isAdmin = user && user.email === ADMIN_EMAIL;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0b1326' }}>
      <AppBar position="static" sx={{ backgroundColor: 'rgba(23, 31, 51, 0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', boxShadow: 'none' }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', px: '0 !important' }}>
            <Typography variant="h5" sx={{ fontWeight: '900', letterSpacing: '-0.03em', background: 'linear-gradient(45deg, #8B5CF6, #e364a7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              planora.
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button startIcon={<AccountCircleIcon />} onClick={() => navigate('/profile')} sx={{ color: '#fff', borderRadius: '12px', px: 2, backgroundColor: currentPath === '/profile' ? 'rgba(139, 92, 246, 0.15)' : 'transparent' }}>
                Profile Hub
              </Button>
              
              <Button startIcon={<FlightTakeoffIcon />} onClick={() => navigate('/dashboard')} sx={{ color: '#fff', borderRadius: '12px', px: 2, backgroundColor: currentPath === '/dashboard' ? 'rgba(139, 92, 246, 0.15)' : 'transparent' }}>
                Trip Builder
              </Button>

              {isAdmin && (
                <>
                  <Button startIcon={<QrCodeScannerIcon />} onClick={() => navigate('/gate-scanner')} sx={{ color: '#fff', borderRadius: '12px', px: 2, backgroundColor: currentPath === '/gate-scanner' ? 'rgba(139, 92, 246, 0.15)' : 'transparent' }}>
                    Gate Scanner
                  </Button>
                  <Button startIcon={<AdminPanelSettingsIcon />} onClick={() => navigate('/import-utility')} sx={{ color: '#fff', borderRadius: '12px', px: 2, backgroundColor: currentPath === '/import-utility' ? 'rgba(139, 92, 246, 0.15)' : 'transparent' }}>
                    Admin Panel
                  </Button>
                </>
              )}

              <IconButton onClick={handleLogout} sx={{ color: '#ffafd3', ml: 1 }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadedSavedTrip, setLoadedSavedTrip] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0b1326' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  const isAuthenticated = !!user;
  const isAdmin = user && user.email === ADMIN_EMAIL;

  return (
    <Router>
      <NavigationLayout user={user}>
        <Routes>
          {/* Public Platform Anchors */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Authenticated Traveler Operations */}
          <Route path="/preferences" element={isAuthenticated ? <Preferences /> : <Navigate to="/login" replace />} />
          <Route path="/park-checkout" element={isAuthenticated ? <ParkingCheckout /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isAuthenticated ? <Profile setLoadedSavedTrip={setLoadedSavedTrip} /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard loadedSavedTrip={loadedSavedTrip} setLoadedSavedTrip={setLoadedSavedTrip} /> : <Navigate to="/login" replace />} />
          
          {/* Secure Admin Control System Interceptors */}
          <Route 
            path="/gate-scanner" 
            element={isAdmin ? <AdminScanner /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/import-utility" 
            element={isAdmin ? <DataImporter /> : <Navigate to="/profile" replace />} 
          />

          {/* Catch-all Routing Strategy */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NavigationLayout>
    </Router>
  );
}

export default App;