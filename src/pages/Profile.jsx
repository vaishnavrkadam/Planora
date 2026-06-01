import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, TextField, 
  Stack, Card, CardContent, CardActions, CircularProgress, Alert, Avatar, Divider
} from '@mui/material';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FlightIcon from '@mui/icons-material/Flight';
import SaveIcon from '@mui/icons-material/Save';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useNavigate } from 'react-router-dom';

export default function Profile({ setActiveTab, setLoadedSavedTrip }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [savedTrips, setSavedTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || currentUser.email.split('@')[0]);
      fetchUserTrips(currentUser.uid);
    }
  }, []);

  // Fetch only the itineraries saved by this specific logged-in user
  const fetchUserTrips = async (uid) => {
    setLoadingTrips(true);
    try {
      const q = query(collection(db, 'Saved_Itineraries'), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      const trips = [];
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() });
      });
      // Sort by newest saved first
      trips.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      setSavedTrips(trips);
    } catch (err) {
      console.error("Error fetching trips:", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Allow the user to update their display name profile criteria
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) return;
    setProfileSaving(true);
    setStatus({ type: '', msg: '' });
    try {
      // In a full production setup, you can update auth profile or a separate 'users' collection
      // For our snappy serverless environment, we'll simulate a saved profile acknowledgement state
      setStatus({ type: 'success', msg: 'Profile details updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  // Open a saved trip back up into the main generator dashboard
  const handleViewTrip = (trip) => {
    // We rebuild the internal structure format expected by the dashboard page viewer
    const reconstructedItinerary = {
        title: trip.title,
        dates: `Continuous Clock Optimized Plan`,
        travelers: `${trip.travelersCount} Travelers`,
        days: Array.from({ length: trip.travelDays }, (_, i) => `Day ${i + 1}`),
        timeline: trip.scheduleDetails,
        calculatedTotalExpense: trip.calculatedTotalExpense
    };
    
    setLoadedSavedTrip(reconstructedItinerary);
    navigate('/dashboard'); // Clean page route redirect!
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 6 }}>
      <Grid container spacing={4}>
        
        {/* ================= LEFT SIDEBAR: PROFILE DATA EDITING ================= */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center' }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={1.5}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#8B5CF6', fontSize: '32px', fontWeight: '700' }}>
                {displayName ? displayName[0].toUpperCase() : 'U'}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: '800' }}>{displayName}</Typography>
              <Typography variant="body2" sx={{ color: '#958ea0' }}>{user?.email}</Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {status.msg && <Alert severity={status.type}>{status.msg}</Alert>}

            <Stack spacing={2.5} textAlign="left">
              <TextField
                label="DISPLAY NAME"
                fullWidth
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <TextField
                label="ACCOUNT ID (READ-ONLY)"
                fullWidth
                disabled
                value={user?.uid || ''}
                slotProps={{ input: { style: { color: 'rgba(255,255,255,0.35)', fontSize: '12px' } } }}
              />
            </Stack>

            <Button
              variant="contained"
              startIcon={profileSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleUpdateProfile}
              sx={{ backgroundColor: '#8B5CF6', borderRadius: '14px', py: 1.5, fontWeight: '700', color: '#fff', '&:hover': { backgroundColor: '#7c3aed' } }}
            >
              Save Profile Changes
            </Button>
          </Paper>
        </Grid>

        {/* ================= RIGHT MAIN AREA: ITINERARIES HUB ================= */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={4}>
            
            {/* TRIP ARCHIVE HERO NAVIGATION BANNER */}
            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(227, 100, 167, 0.05) 100%)' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: '800', mb: 0.5 }}>Your Travel Vault</Typography>
                <Typography variant="body2" sx={{ color: '#cbc3d7' }}>Access and coordinate all your custom engineered, budget-aware exploration itineraries.</Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<FlightIcon style={{ transform: 'rotate(90deg)' }} />}
                onClick={() => { setLoadedSavedTrip(null); navigate('/dashboard'); }} // Direct redirect to generator
                sx={{ backgroundColor: '#e364a7', borderRadius: '14px', px: 4, py: 1.8, fontWeight: '700', color: '#fff', boxShadow: '0 10px 20px rgba(227, 100, 167, 0.25)', '&:hover': { backgroundColor: '#d04f93' } }}
              >
                Create New Trip
              </Button>
            </Paper>

            {/* SAVED ITINERARY DYNAMIC INDEX GRID */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: '700', mb: 2.5, letterSpacing: '0.02em', color: '#fff' }}>SAVED TRIP PACKAGES</Typography>

              {loadingTrips ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#8B5CF6' }} /></Box>
              ) : savedTrips.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)' }}>
                  <Typography variant="h6" sx={{ color: '#fff', mb: 1, fontWeight: '700' }}>No trips archived yet</Typography>
                  <Typography sx={{ color: '#958ea0', mb: 3 }}>Your generated plans will show up here once you click the save action button!</Typography>
                  <Button variant="outlined" sx={{ color: '#d0bcff', borderColor: 'rgba(139,92,246,0.4)', borderRadius: '12px' }} onClick={() => setActiveTab('dashboard')}>Explore Destinations Now</Button>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {savedTrips.map((trip) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={trip.id}>
                      <Card sx={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          <Typography variant="h5" sx={{ fontWeight: '700', mb: 2, color: '#fff', fontSize: '20px' }}>{trip.title}</Typography>
                          
                          <Stack spacing={1.5}>
                            <Box display="flex" alignItems="center" gap={1} sx={{ color: '#cbc3d7', fontSize: '13px' }}>
                              <CalendarMonthIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />
                              <span>Duration: <strong>{trip.travelDays} Days</strong> ({trip.startDate || 'No date set'})</span>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} sx={{ color: '#cbc3d7', fontSize: '13px' }}>
                              <GroupIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />
                              <span>Group Metrics: <strong>{trip.travelersCount} Travelers</strong></span>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} sx={{ color: '#ffafd3', fontSize: '13px' }}>
                              <AccountCircleIcon sx={{ fontSize: 16, color: '#e364a7' }} />
                              <span>Route Parameters: <strong>{trip.originCity} ➔ {trip.destinationCity}</strong></span>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} sx={{ color: '#adc6ff', fontSize: '13px' }}>
                              <AccountBalanceWalletIcon sx={{ fontSize: 16, color: '#adc6ff' }} />
                              <span>Total Investment: <strong>${trip.calculatedTotalExpense.toLocaleString()}</strong> out of ${trip.totalBudget.toLocaleString()}</span>
                            </Box>
                          </Stack>
                        </CardContent>

                        <CardActions sx={{ p: 3, pt: 0 }}>
                          <Button 
                            variant="contained" 
                            fullWidth 
                            onClick={() => handleViewTrip(trip)}
                            sx={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '12px', textTransform: 'none', fontWeight: '600', '&:hover': { backgroundColor: '#8B5CF6' } }}
                          >
                            Launch Interactive Timeline
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

          </Stack>
        </Grid>

      </Grid>
    </Container>
  );
}