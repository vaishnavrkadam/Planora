import React, { useState } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Slider, 
  Button, IconButton, Stack, Chip, CardMedia, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, Snackbar
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MapIcon from '@mui/icons-material/Map';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import { generateBudgetItinerary } from '../utils/itineraryEngine';
import TripMap from '../components/TripMap';

const availableCities = [
  { value: 'Delhi', label: 'Delhi, India' },
  { value: 'Mumbai', label: 'Mumbai, India' },
  { value: 'Jaipur', label: 'Jaipur, India' },
  { value: 'Agra', label: 'Agra, India' },
  { value: 'San Francisco', label: 'San Francisco, USA' },
  { value: 'Tokyo', label: 'Tokyo, Japan' },
  { value: 'Bengaluru', label: 'Bengaluru, India' },
  { value: 'Kolkata', label: 'Kolkata, India' },
  { value: 'Kochi', label: 'Kochi, India' },
  { value: 'Goa', label: 'Goa, India' },
  { value: 'Varanasi', label: 'Varanasi, India' },
  { value: 'Udaipur', label: 'Udaipur, India' },
  { value: 'Amritsar', label: 'Amritsar, India' },
  { value: 'Hyderabad', label: 'Hyderabad, India' },
  { value: 'Srinagar', label: 'Srinagar, India' },
  { value: 'Leh Ladakh', label: 'Leh Ladakh, India' },
  { value: 'Munnar', label: 'Munnar, India' },
  { value: 'Darjeeling', label: 'Darjeeling, India' },
  { value: 'Puducherry', label: 'Puducherry, India' },
  { value: 'Hampi', label: 'Hampi, India' },
  { value: 'Mysuru', label: 'Mysuru, India' },
  { value: 'Shimla', label: 'Shimla, India' },
  { value: 'Rishikesh', label: 'Rishikesh, India' }
];

export default function Dashboard({ loadedSavedTrip, setLoadedSavedTrip }) {
  const [fromLocation, setFromLocation] = useState('Goa');
  const [toLocation, setToLocation] = useState('Bengaluru');
  const [budget, setBudget] = useState(1000);
  const [days, setDays] = useState(1); 
  const [travelers, setTravelers] = useState(1);
  const navigate = useNavigate();
  
  // NEW FORM STATE: Standard departure date picker baseline string
  const [startDate, setStartDate] = useState('2026-10-15'); 
  
  const [selectedDay, setSelectedDay] = useState('Day 1');
  const [activePreferences, setActivePreferences] = useState(['History', 'Sightseeing']);
  
  const [itinerary, setItinerary] = useState(loadedSavedTrip || null);
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError, setAlgoError] = useState('');

  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const [mapFocusedCoords, setMapFocusedCoords] = useState(null);
  const [forceMapBounds, setForceMapBounds] = useState(true);

  const preferencesList = ['History', 'Food & Drink', 'Culture', 'Sightseeing', 'Leisure', 'Shopping', 'Nature'];

  const togglePreference = (pref) => {
    setActivePreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleGenerateClick = async () => {
    setAlgoLoading(true);
    setAlgoError('');
    if (!toLocation) {
      setAlgoError("Please select a destination city from the dropdown menu.");
      setAlgoLoading(false);
      return;
    }

    try {
      // PASS RE-ROUTED DATE TO THE LOGIC CORE
      const result = await generateBudgetItinerary(toLocation, budget, days, activePreferences, travelers, startDate);
      if (result.error) {
        setAlgoError(result.error);
        setItinerary(null);
      } else {
        setItinerary(result);
        setSelectedDay('Day 1'); 
        setMapFocusedCoords(null);
        setForceMapBounds(true);
      }
    } catch (err) {
      setAlgoError("Failed to parse live itinerary engine calculations from Firestore.");
      setItinerary(null);
    } finally {
      setAlgoLoading(false);
    }
  };

  const handleSaveItinerary = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setToastMessage("You must be logged in to save itineraries.");
      setToastOpen(true);
      return;
    }

    setSaveLoading(true);
    try {
      const itineraryPayload = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        destinationCity: toLocation,
        originCity: fromLocation,
        totalBudget: budget,
        calculatedTotalExpense: itinerary.calculatedTotalExpense,
        travelDays: days,
        travelersCount: travelers,
        startDate: startDate,
        savedAt: new Date().toISOString(),
        title: itinerary.title,
        scheduleDetails: itinerary.timeline 
      };

      await addDoc(collection(db, 'Saved_Itineraries'), itineraryPayload);
      setToastMessage("🎉 Itinerary successfully saved to your cloud profile!");
      setToastOpen(true);
    } catch (err) {
      setToastMessage(`Error saving to cloud: ${err.message}`);
      setToastOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCardClick = (lat, lng) => {
    if (lat && lng) {
      setForceMapBounds(false);
      setMapFocusedCoords([lat, lng]);
    }
  };

  const handleShowAllLocations = () => {
    setForceMapBounds(true);
    setMapFocusedCoords(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 6 }}>
      <Grid container spacing={4}>
        
        {/* ================= LEFT COLUMN: INPUT FORM ================= */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            
            <Box display="flex" alignItems="center" gap={1}>
              <AutoAwesomeIcon sx={{ color: '#8B5CF6' }} />
              <Typography variant="h5" sx={{ fontWeight: '700' }}>Design Your Escape</Typography>
            </Box>

            <Stack spacing={2.5}>
              <FormControl variant="filled" fullWidth>
                <InputLabel id="from-city-label" sx={{ color: '#958ea0' }}>FROM</InputLabel>
                <Select
                  labelId="from-city-label"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  startAdornment={<LocationOnIcon sx={{ color: '#958ea0', mr: 1, fontSize: 20 }} />}
                  sx={{ borderRadius: '16px', color: '#fff', '& .MuiSelect-select': { py: 2 } }}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: '#171f33', color: '#fff' } } }}
                >
                  {availableCities.map((city) => (
                    <MenuItem key={city.value} value={city.value}>{city.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="filled" fullWidth>
                <InputLabel id="to-city-label" sx={{ color: '#958ea0' }}>TO</InputLabel>
                <Select
                  labelId="to-city-label"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  startAdornment={<FlightTakeoffIcon sx={{ color: '#958ea0', mr: 1, fontSize: 20 }} />}
                  sx={{ borderRadius: '16px', color: '#fff', '& .MuiSelect-select': { py: 2 } }}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: '#171f33', color: '#fff' } } }}
                >
                  {availableCities.map((city) => (
                    <MenuItem key={city.value} value={city.value}>{city.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#958ea0', letterSpacing: '0.05em' }}>ESTIMATED BUDGET</Typography>
                <Typography variant="body1" sx={{ fontWeight: '700', color: '#d0bcff' }}>₹{budget.toLocaleString()}</Typography>
              </Box>
              <Slider value={budget} min={0} max={15000} step={100} onChange={(e, val) => setBudget(val)} sx={{ color: '#8B5CF6', mb: 0.5 }} />
              <Box display="flex" justifyContent="space-between" sx={{ color: '#958ea0', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', px: 0.5 }}>
                <Typography variant="caption">BUDGET</Typography>
                <Typography variant="caption">MID-RANGE</Typography>
                <Typography variant="caption">LUXURY</Typography>
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" gap={2}>
              <Box flex={1}>
                <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '600', display: 'block', mb: 1 }}>DAYS</Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', p: 0.5 }}>
                  <IconButton onClick={() => setDays(d => Math.max(1, d - 1))} sx={{ color: '#fff' }}><RemoveIcon fontSize="small" /></IconButton>
                  <Typography sx={{ fontWeight: '700' }}>{days < 10 ? `0${days}` : days}</Typography>
                  <IconButton onClick={() => setDays(d => d + 1)} sx={{ color: '#fff' }}><AddIcon fontSize="small" /></IconButton>
                </Box>
              </Box>

              <Box flex={1}>
                <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '600', display: 'block', mb: 1 }}>TRAVELERS</Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', p: 0.5 }}>
                  <IconButton onClick={() => setTravelers(t => Math.max(1, t - 1))} sx={{ color: '#fff' }}><RemoveIcon fontSize="small" /></IconButton>
                  <Typography sx={{ fontWeight: '700' }}>{travelers < 10 ? `0${travelers}` : travelers}</Typography>
                  <IconButton onClick={() => setTravelers(t => t + 1)} sx={{ color: '#fff' }}><AddIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
            </Box>

            {/* NEW START DATE FORM PICKER CONTROL */}
            <Box>
              <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '600', display: 'block', mb: 1 }}>DEPARTURE DATE</Typography>
              <TextField
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ input: { startAdornment: <CalendarMonthIcon sx={{ color: '#958ea0', mr: 1 }} /> } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '600', display: 'block', mb: 1.5, letterSpacing: '0.05em' }}>TRAVEL PREFERENCES</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {preferencesList.map(pref => {
                  const isSelected = activePreferences.includes(pref);
                  return (
                    <Chip key={pref} label={pref} onClick={() => togglePreference(pref)}
                      sx={{ borderRadius: '9999px', backgroundColor: isSelected ? '#8B5CF6' : 'transparent', borderColor: isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid', fontSize: '12px', fontWeight: '500' }}
                    />
                  );
                })}
              </Box>
            </Box>

            <Button variant="contained" fullWidth disabled={algoLoading} onClick={handleGenerateClick}
              sx={{ backgroundColor: '#8B5CF6', color: '#fff', py: 2, borderRadius: '16px', fontSize: '16px', fontWeight: '700', boxShadow: '0px 20px 40px rgba(139, 92, 246, 0.2)', '&:hover': { backgroundColor: '#7c3aed' } }}
            >
              {algoLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Itinerary ⚡'}
            </Button>
          </Paper>
        </Grid>

        {/* ================= RIGHT COLUMN: TIMELINE + INTERACTIVE MAP ================= */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {algoError && <Alert severity="warning" sx={{ mb: 3 }}>{algoError}</Alert>}
          
          {!itinerary && !algoLoading && (
            <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.12)' }}>
              <Typography variant="h5" sx={{ color: '#fff', mb: 1, fontWeight: '700' }}>Ready to explore?</Typography>
              <Typography sx={{ color: '#958ea0' }}>Choose a destination from the dropdown on the left and tap generate to pull your live data.</Typography>
            </Paper>
          )}

          {algoLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '300px' }}>
              <CircularProgress sx={{ color: '#8B5CF6' }} />
            </Box>
          )}

          {itinerary && (
            <Box display="flex" flexDirection="column" gap={3}>
              
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h2" sx={{ fontSize: '32px', fontWeight: '800', mb: 0.5 }}>{itinerary.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#cbc3d7', display: 'flex', gap: 1.5 }}>
                    <span>{itinerary.dates}</span> • <span style={{ color: '#ffafd3', fontWeight: '600' }}>Cost Profile Total: ${itinerary.calculatedTotalExpense}</span>
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  disabled={saveLoading}
                  startIcon={saveLoading ? <CircularProgress size={16} color="inherit" /> : <BookmarkAddIcon />}
                  onClick={handleSaveItinerary}
                  sx={{ backgroundColor: '#e364a7', borderRadius: '14px', px: 3, py: 1.2, fontWeight: '700', color: '#fff', '&:hover': { backgroundColor: '#d04f93' } }}
                >
                  {saveLoading ? 'Saving Plan...' : 'Save Itinerary'}
                </Button>
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                {itinerary.days.map((day) => (
                  <Chip key={day} label={day}
                    onClick={() => { setSelectedDay(day); setMapFocusedCoords(null); setForceMapBounds(true); }}
                    sx={{ px: 1.5, py: 2, fontSize: '13px', fontWeight: '600', borderRadius: '9999px', backgroundColor: selectedDay === day ? '#fff' : 'rgba(255,255,255,0.04)', color: selectedDay === day ? '#0b1326' : '#cbc3d7' }}
                  />
                ))}
              </Stack>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '700', letterSpacing: '0.05em' }}>
                    {forceMapBounds ? '💡 VISUALIZING ALL STOPS THIS DAY' : '📍 FOCUSED SELECTION EXPLORER'}
                  </Typography>
                  <Button 
                    size="small" variant="outlined" startIcon={<MapIcon />} onClick={handleShowAllLocations}
                    sx={{ borderRadius: '12px', color: '#d0bcff', borderColor: 'rgba(139, 92, 246, 0.3)', textTransform: 'none', '&:hover': { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.05)' } }}
                  >
                    Show All Locations
                  </Button>
                </Box>
                
                <TripMap 
                  timeline={itinerary.timeline.filter(item => item.day === selectedDay)} 
                  focusedCoords={mapFocusedCoords}
                  forceFitBounds={forceMapBounds}
                />
              </Box>

              <Box sx={{ position: 'relative', pl: 5, mt: 1 }}>
                <Box sx={{ position: 'absolute', left: '6px', top: '24px', bottom: '24px', width: '2px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

                {itinerary.timeline
                  .filter(item => item.day === selectedDay)
                  .map((item, idx) => (
                    <Box key={idx} sx={{ position: 'relative', mb: 4 }}>
                      <Box sx={{ position: 'absolute', left: '-44px', top: '24px', transform: 'translateY(-50%)', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8B5CF6', border: '3px solid #0b1326', boxShadow: '0 0 10px #8B5CF6', zIndex: 2 }} />

                      <Paper 
                        onClick={() => handleCardClick(item.latitude, item.longitude)}
                        sx={{ 
                          p: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, cursor: 'pointer', transition: 'all 0.2s ease',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: '#8B5CF6', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }
                        }}
                      >
                        <CardMedia component="img" image={item.image} alt={item.title} sx={{ width: { xs: '100%', sm: 120 }, height: 120, borderRadius: '16px', objectFit: 'cover' }} />
                        <Box flex={1}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '700', letterSpacing: '0.05em' }}>{item.time} — <span style={{ color: '#adc6ff' }}>{item.type}</span></Typography>
                            <Typography variant="h6" sx={{ fontWeight: '800', color: '#fff', fontSize: '18px' }}>{item.cost}</Typography>
                          </Box>
                          <Typography variant="h5" sx={{ fontSize: '20px', fontWeight: '700', mb: 1, color: '#fff' }}>{item.title}</Typography>
                          <Typography variant="body2" sx={{ color: '#cbc3d7', mb: 2, lineHeight: 1.6 }}>{item.description}</Typography>

                          <Stack direction="row" spacing={1}>{item.tags.map((t, i) => (<Chip key={i} label={t} size="small" sx={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#d0bcff', fontSize: '11px' }} />))}</Stack>

                          {/* DYNAMIC IOT PARKING BOOKING ANCHOR BUTTON */}
                          {item.title === "Cubbon Park Heritage Walk & Coffee" && (
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<LocalParkingIcon />}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevents the card's map click function from firing!
                                  navigate(`/park-checkout?slotId=CUBBON_01&title=${encodeURIComponent(item.title)}`);
                                }}
                                sx={{ 
                                  backgroundColor: '#8B5CF6', 
                                  borderRadius: '10px', 
                                  textTransform: 'none', 
                                  fontWeight: '700',
                                  color: '#fff',
                                  '&:hover': { backgroundColor: '#7c3aed' }
                                }}
                              >
                                Book Parking Slot 🚗
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Box>
                ))}
              </Box>

            </Box>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}