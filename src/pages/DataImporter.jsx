import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Button, Alert, Box, CircularProgress, 
  Stack, Grid, Divider, Tabs, Tab, Accordion, AccordionSummary, 
  AccordionDetails, TextField, Card, CardContent, Chip, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MapIcon from '@mui/icons-material/Map';
import PaidIcon from '@mui/icons-material/Paid';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];
const COST_TIERS = ["Budget", "Mid-Range", "Luxury"];
const MONTHS_LIST = [
  "Year-round", "January-December", "October-March", "April-September",
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function DataImporter() {
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const [uniqueCities, setUniqueCities] = useState(["Delhi", "Mumbai", "Jaipur", "Agra", "Mysuru", "Tokyo"]);
  const [uniqueCountries, setUniqueCountries] = useState(["India", "Japan", "USA", "France"]);

  const [showCustomCityAct, setShowCustomCityAct] = useState(false);
  const [customCityAct, setCustomCityAct] = useState('');
  const [showCustomCountryAct, setShowCustomCountryAct] = useState(false);
  const [customCountryAct, setCustomCountryAct] = useState('');

  const [showCustomCountryCost, setShowCustomCountryCost] = useState(false);
  const [customCountryCost, setCustomCountryCost] = useState('');

  const [destRows, setDestRows] = useState([]);
  const [destFileName, setDestFileName] = useState('');
  const [costRows, setCostRows] = useState([]);
  const [costFileName, setCostFileName] = useState('');

  const [newAct, setNewAct] = useState({
    city: 'Bengaluru', country: 'India', activityId: '', activityName: '', category: 'Sightseeing',
    estimatedCostPerPerson: 0, costCategory: 'Budget', bestTimeOfDay: 'Morning',
    averageDuration: '2 hours', bestMonthsToVisit: 'Year-round', latitude: '', longitude: '', 
    description: '', image: '' // Added image property field
  });

  const [newCost, setNewCost] = useState({
    city: '', country: 'India', hotelBudgetPerNight: 20, hotelMidRangePerNight: 60, hotelLuxuryPerNight: 150,
    avgMealCostBudget: 10, avgMealCostMidRange: 25, avgMealCostLuxury: 55
  });

  const [activeTab, setActiveTab] = useState(0); 
  const [activitiesData, setActivitiesData] = useState([]);
  const [costsData, setCostsData] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saveLoadingId, setSaveLoadingId] = useState('');

  useEffect(() => {
    extractLiveDropdownOptions();
  }, []);

  const extractLiveDropdownOptions = async () => {
    try {
      const destSnapshot = await getDocs(collection(db, 'Destinations_Activities'));
      const cities = new Set([...uniqueCities]);
      const countries = new Set([...uniqueCountries]);
      
      destSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.city) cities.add(data.city);
        if (data.country) countries.add(data.country);
      });

      setUniqueCities([...cities].sort());
      setUniqueCountries([...countries].sort());
    } catch (err) {
      console.error("Dropdown scanner failed:", err);
    }
  };

  const parseCSV = (file, type) => {
    setStatus({ type: '', msg: '' });
    Papa.parse(file, {
      header: true, skipEmptyLines: true, dynamicTyping: true,
      complete: (results) => {
        if (type === 'destinations') {
          setDestRows(results.data); setDestFileName(file.name);
        } else {
          setCostRows(results.data); setCostFileName(file.name);
        }
      },
      error: (err) => setStatus({ type: 'error', msg: `Parsing failed: ${err.message}` })
    });
  };

  const uploadCollection = async (rows, collectionName, targetFileName) => {
    if (rows.length === 0) return;
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const targetRef = collection(db, collectionName);
      for (const row of rows) { await addDoc(targetRef, row); }
      setStatus({ type: 'success', msg: `🚀 Bulk synced documents from "${targetFileName}" to cloud database!` });
      if (collectionName === 'Destinations_Activities') { setDestRows([]); setDestFileName(''); }
      else { setCostRows([]); setCostFileName(''); }
      extractLiveDropdownOptions();
      if (isDataLoaded) fetchLiveDatabaseRecords(); 
    } catch (err) { setStatus({ type: 'error', msg: `Upload error: ${err.message}` }); }
    finally { setLoading(false); }
  };

  const fetchLiveDatabaseRecords = async () => {
    setDbLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const destSnapshot = await getDocs(collection(db, 'Destinations_Activities'));
      const acts = [];
      destSnapshot.forEach(doc => acts.push({ docId: doc.id, ...doc.data() }));
      setActivitiesData(acts);

      const costSnapshot = await getDocs(collection(db, 'Local_Costs'));
      const costs = [];
      costSnapshot.forEach(doc => costs.push({ docId: doc.id, ...doc.data() }));
      setCostsData(costs);

      setIsDataLoaded(true);
      extractLiveDropdownOptions();
    } catch (err) { setStatus({ type: 'error', msg: `Failed loading records: ${err.message}` }); }
    finally { setDbLoading(false); }
  };

  const handleAddActivitySubmit = async () => {
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const finalCity = showCustomCityAct ? customCityAct.trim() : newAct.city;
    const finalCountry = showCustomCountryAct ? customCountryAct.trim() : newAct.country;

    if (!finalCity || !finalCountry || !newAct.activityName.trim()) {
      setStatus({ type: 'error', msg: 'City, Country, and Activity Name fields are required.' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...newAct,
        city: finalCity,
        country: finalCountry,
        estimatedCostPerPerson: Number(newAct.estimatedCostPerPerson) || 0,
        latitude: newAct.latitude ? Number(newAct.latitude) : null,
        longitude: newAct.longitude ? Number(newAct.longitude) : null,
        image: newAct.image.trim() || "https://images.unsplash.com/photo-1542296332-2e4473fac563?w=500&auto=format&fit=crop&q=60" // Seamless fallback image layout injection
      };

      await addDoc(collection(db, 'Destinations_Activities'), payload);
      setStatus({ type: 'success', msg: `🎉 Successfully published custom activity stop: "${newAct.activityName}"!` });
      
      if (showCustomCityAct) setUniqueCities(prev => [...new Set([...prev, finalCity])].sort());
      if (showCustomCountryAct) setUniqueCountries(prev => [...new Set([...prev, finalCountry])].sort());

      setNewAct({ 
        ...newAct, activityName: '', estimatedCostPerPerson: 0, latitude: '', longitude: '', 
        description: '', image: '', city: finalCity, country: finalCountry 
      });
      setCustomCityAct(''); setCustomCountryAct('');
      setShowCustomCityAct(false); setShowCustomCountryAct(false);
      
      if (isDataLoaded) fetchLiveDatabaseRecords();
    } catch (err) { setStatus({ type: 'error', msg: `Write error: ${err.message}` }); }
    finally { setLoading(false); }
  };

  const handleAddCostSubmit = async () => {
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const finalCity = newCost.city.trim();
    const finalCountry = showCustomCountryCost ? customCountryCost.trim() : newCost.country;

    if (!finalCity || !finalCountry) {
      setStatus({ type: 'error', msg: 'City and Country selection elements are required.' });
      setLoading(false);
      return;
    }

    try {
      const costRef = collection(db, 'Local_Costs');
      const qCheck = query(costRef, where('city', '==', finalCity));
      const snapCheck = await getDocs(qCheck);

      if (!snapCheck.empty) {
        setStatus({ type: 'error', msg: `The city "${finalCity}" already possesses an active cost matrix. Modify it in the live panel editor view.` });
        setLoading(false);
        return;
      }

      await addDoc(costRef, {
        city: finalCity,
        country: finalCountry,
        hotelBudgetPerNight: Number(newCost.hotelBudgetPerNight) || 0,
        hotelMidRangePerNight: Number(newCost.hotelMidRangePerNight) || 0,
        hotelLuxuryPerNight: Number(newCost.hotelLuxuryPerNight) || 0,
        avgMealCostBudget: Number(newCost.avgMealCostBudget) || 0,
        avgMealCostMidRange: Number(newCost.avgMealCostMidRange) || 0,
        avgMealCostLuxury: Number(newCost.avgMealCostLuxury) || 0,
      });

      setStatus({ type: 'success', msg: `🎉 Created fresh base financial matrix log setup for ${finalCity}!` });
      
      setUniqueCities(prev => [...new Set([...prev, finalCity])].sort());
      if (showCustomCountryCost) setUniqueCountries(prev => [...new Set([...prev, finalCountry])].sort());

      setNewCost({ ...newCost, hotelBudgetPerNight: 20, hotelMidRangePerNight: 60, hotelLuxuryPerNight: 150, avgMealCostBudget: 10, avgMealCostMidRange: 25, avgMealCostLuxury: 55, city: finalCity, country: finalCountry });
      setCustomCountryCost('');
      setShowCustomCountryCost(false);

      if (isDataLoaded) fetchLiveDatabaseRecords();
    } catch (err) { setStatus({ type: 'error', msg: `Write error: ${err.message}` }); }
    finally { setLoading(false); }
  };

  const handleUpdateDocument = async (docId, collectionName, updatedFields) => {
    setSaveLoadingId(docId);
    try {
      const docRef = doc(db, collectionName, docId);
      const cleanedData = { ...updatedFields };
      delete cleanedData.docId;
      await updateDoc(docRef, cleanedData);
      setStatus({ type: 'success', msg: `Saved changes directly to data asset!` });
    } catch (err) { setStatus({ type: 'error', msg: `Update failed: ${err.message}` }); }
    finally { setSaveLoadingId(''); }
  };

  const handleFieldChange = (docId, field, value, section) => {
    if (section === 'activities') {
      setActivitiesData(prev => prev.map(item => item.docId === docId ? { ...item, [field]: value } : item));
    } else {
      setCostsData(prev => prev.map(item => item.docId === docId ? { ...item, [field]: value } : item));
    }
  };

  const uniqueActivityCities = [...new Set(activitiesData.map(item => item.city))].filter(Boolean);
  const uniqueCostCities = [...new Set(costsData.map(item => item.city))].filter(Boolean);

  return (
    <Container maxWidth="xl" sx={{ mt: 3, pb: 6 }}>
      
      <Paper sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', gap: 2, background: 'linear-gradient(135deg, rgba(227,100,167,0.1) 0%, rgba(139,92,246,0.05) 100%)' }}>
        <AdminPanelSettingsIcon sx={{ color: '#e364a7', fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: '900', letterSpacing: '-0.02em' }}>Planora Control Deck CMS</Typography>
          <Typography variant="caption" sx={{ color: '#cbc3d7' }}>Manage global destination nodes, real-time logistics baseline structures, and live Firestore sync indexes.</Typography>
        </Box>
      </Paper>

      {status.msg && <Alert severity={status.type} sx={{ mb: 4, borderRadius: '14px' }}>{status.msg}</Alert>}

      <Grid container spacing={4}>
        
        {/* ================= LEFT COLUMN: CREATION DECK WITH DROPDOWNS ================= */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={4}>
            
            {/* MANUALLY INJECT INDIVIDUAL ACTIVITY ASSET NODES */}
            <Paper sx={{ p: 3.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <AddCircleIcon sx={{ color: '#8B5CF6' }} />
                <Typography variant="h6" sx={{ fontWeight: '800' }}>Add Custom Activity Stop</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  {!showCustomCityAct ? (
                    <FormControl fullWidth size="small" variant="filled">
                      <InputLabel id="act-city-select-label">CITY</InputLabel>
                      <Select
                        labelId="act-city-select-label"
                        value={newAct.city}
                        onChange={(e) => {
                          if(e.target.value === 'ADD_NEW') { setShowCustomCityAct(true); }
                          else { setNewAct({ ...newAct, city: e.target.value }); }
                        }}
                      >
                        {uniqueCities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        <MenuItem value="ADD_NEW" sx={{ color: '#ffafd3', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.08)' }}>+ Add New City</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField label="Enter New City Title" fullWidth size="small" value={customCityAct} onChange={(e)=>setCustomCityAct(e.target.value)} placeholder="e.g. Bangalore" helperText={<span style={{cursor:'pointer', color:'#d0bcff'}} onClick={()=>{setShowCustomCityAct(false);setCustomCityAct('');}}>Cancel Custom</span>} />
                  )}
                </Grid>

                <Grid size={{ xs: 6 }}>
                  {!showCustomCountryAct ? (
                    <FormControl fullWidth size="small" variant="filled">
                      <InputLabel id="act-country-select-label">COUNTRY</InputLabel>
                      <Select
                        labelId="act-country-select-label"
                        value={newAct.country}
                        onChange={(e) => {
                          if(e.target.value === 'ADD_NEW') { setShowCustomCountryAct(true); }
                          else { setNewAct({ ...newAct, country: e.target.value }); }
                        }}
                      >
                        {uniqueCountries.map(co => <MenuItem key={co} value={co}>{co}</MenuItem>)}
                        <MenuItem value="ADD_NEW" sx={{ color: '#ffafd3', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.08)' }}>+ Add New Country</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField label="Enter New Country Title" fullWidth size="small" value={customCountryAct} onChange={(e)=>setCustomCountryAct(e.target.value)} placeholder="e.g. Italy" helperText={<span style={{cursor:'pointer', color:'#d0bcff'}} onClick={()=>{setShowCustomCountryAct(false);setCustomCountryAct('');}}>Cancel Custom</span>} />
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}><TextField label="Activity Stop Title Name" fullWidth size="small" value={newAct.activityName} onChange={(e)=>setNewAct({...newAct, activityName: e.target.value})} /></Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}><TextField label="Vibe Category Vibe" fullWidth size="small" value={newAct.category} onChange={(e)=>setNewAct({...newAct, category: e.target.value})} /></Grid>
                <Grid size={{ xs: 4 }}><TextField label="Cost/Person ($)" type="number" fullWidth size="small" value={newAct.estimatedCostPerPerson} onChange={(e)=>setNewAct({...newAct, estimatedCostPerPerson: e.target.value})} /></Grid>
                
                <Grid size={{ xs: 4 }}>
                  <FormControl fullWidth size="small" variant="filled">
                    <InputLabel>COST TIER</InputLabel>
                    <Select value={newAct.costCategory} onChange={(e)=>setNewAct({...newAct, costCategory: e.target.value})}>
                      {COST_TIERS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <FormControl fullWidth size="small" variant="filled">
                    <InputLabel>TIME SLOT</InputLabel>
                    <Select value={newAct.bestTimeOfDay} onChange={(e)=>setNewAct({...newAct, bestTimeOfDay: e.target.value})}>
                      {TIME_SLOTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 4 }}><TextField label="Duration (e.g. 1.5 hours)" fullWidth size="small" value={newAct.averageDuration} onChange={(e)=>setNewAct({...newAct, averageDuration: e.target.value})} /></Grid>
                
                <Grid size={{ xs: 4 }}>
                  <FormControl fullWidth size="small" variant="filled">
                    <InputLabel>MONTHS RECOMMENDED</InputLabel>
                    <Select value={newAct.bestMonthsToVisit} onChange={(e)=>setNewAct({...newAct, bestMonthsToVisit: e.target.value})}>
                      {MONTHS_LIST.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><TextField label="Latitude Coordinate" type="number" fullWidth size="small" value={newAct.latitude} onChange={(e)=>setNewAct({...newAct, latitude: e.target.value})} /></Grid>
                <Grid size={{ xs: 6 }}><TextField label="Longitude Coordinate" type="number" fullWidth size="small" value={newAct.longitude} onChange={(e)=>setNewAct({...newAct, longitude: e.target.value})} /></Grid>
              </Grid>

              {/* INJECTED FORM FIELD: IMAGE LINK INTERACTION */}
              <TextField 
                label="Location Image URL (Unsplash / CDN string link)" 
                fullWidth 
                size="small" 
                value={newAct.image} 
                onChange={(e)=>setNewAct({...newAct, image: e.target.value})} 
                placeholder="https://images.unsplash.com/photo-..."
              />

              <TextField label="Activity Summary Description Context Details" multiline rows={2} fullWidth size="small" value={newAct.description} onChange={(e)=>setNewAct({...newAct, description: e.target.value})} />
              
              <Button variant="contained" disabled={loading} onClick={handleAddActivitySubmit} sx={{ backgroundColor: '#8B5CF6', py: 1.2, borderRadius: '12px', fontWeight: '700' }}>
                Inject Activity to Cloud
              </Button>
            </Paper>

            {/* MANUALLY INJECT SINGLE LOCAL CITY COST PROFILE */}
            <Paper sx={{ p: 3.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <AddCircleIcon sx={{ color: '#e364a7' }} />
                <Typography variant="h6" sx={{ fontWeight: '800' }}>Add Local City Cost Baseline</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      label="New City Name" 
                      fullWidth 
                      size="small" 
                      value={newCost.city} 
                      onChange={(e) => setNewCost({ ...newCost, city: e.target.value })} 
                      placeholder="e.g. Venice"
                    />
                  </Grid>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  {!showCustomCountryCost ? (
                    <FormControl fullWidth size="small" variant="filled">
                      <InputLabel id="cost-country-select-label">COUNTRY</InputLabel>
                      <Select
                        labelId="cost-country-select-label"
                        value={newCost.country}
                        onChange={(e) => {
                          if(e.target.value === 'ADD_NEW') { setShowCustomCountryCost(true); }
                          else { setNewCost({ ...newCost, country: e.target.value }); }
                        }}
                      >
                        {uniqueCountries.map(co => <MenuItem key={co} value={co}>{co}</MenuItem>)}
                        <MenuItem value="ADD_NEW" sx={{ color: '#ffafd3', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.08)' }}>+ Add New Country</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField label="Enter New Country Title" fullWidth size="small" value={customCountryCost} onChange={(e)=>setCustomCountryCost(e.target.value)} placeholder="e.g. Italy" helperText={<span style={{cursor:'pointer', color:'#d0bcff'}} onClick={()=>{setShowCustomCountryCost(false);setCustomCountryCost('');}}>Cancel Custom</span>} />
                  )}
                </Grid>
              </Grid>

              <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '700', letterSpacing: '0.05em', mt: 1 }}>HOTEL NIGHT COSTS ($)</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}><TextField label="Budget Hotel" type="number" fullWidth size="small" value={newCost.hotelBudgetPerNight} onChange={(e)=>setNewCost({...newCost, hotelBudgetPerNight: e.target.value})} /></Grid>
                <Grid size={{ xs: 4 }}><TextField label="Mid Hotel" type="number" fullWidth size="small" value={newCost.hotelMidRangePerNight} onChange={(e)=>setNewCost({...newCost, hotelMidRangePerNight: e.target.value})} /></Grid>
                <Grid size={{ xs: 4 }}><TextField label="Luxury Hotel" type="number" fullWidth size="small" value={newCost.hotelLuxuryPerNight} onChange={(e)=>setNewCost({...newCost, hotelLuxuryPerNight: e.target.value})} /></Grid>
              </Grid>

              <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '700', letterSpacing: '0.05em', mt: 1 }}>DAILY FOOD COSTS ($)</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}><TextField label="Budget Meals" type="number" fullWidth size="small" value={newCost.avgMealCostBudget} onChange={(e)=>setNewCost({...newCost, avgMealCostBudget: e.target.value})} /></Grid>
                <Grid size={{ xs: 4 }}><TextField label="Mid Meals" type="number" fullWidth size="small" value={newCost.avgMealCostMidRange} onChange={(e)=>setNewCost({...newCost, avgMealCostMidRange: e.target.value})} /></Grid>
                <Grid size={{ xs: 4 }}><TextField label="Luxury Meals" type="number" fullWidth size="small" value={newCost.avgMealCostLuxury} onChange={(e)=>setNewCost({...newCost, avgMealCostLuxury: e.target.value})} /></Grid>
              </Grid>

              <Button variant="contained" disabled={loading} onClick={handleAddCostSubmit} sx={{ backgroundColor: '#e364a7', py: 1.2, borderRadius: '12px', fontWeight: '700', '&:hover': { backgroundColor: '#d04f93' } }}>
                Deploy Cost Matrix Log
              </Button>
            </Paper>

            <Paper sx={{ p: 3, display: 'flex', direction: 'row', justifyContent: 'space-between', gap: 2 }}>
              <Button component="label" variant="outlined" size="small" startIcon={<CloudUploadIcon />} sx={{ borderRadius: '10px', textTransform: 'none', color: '#fff', fontSize: '11px', flex: 1 }}>
                {destFileName ? 'Change Sights CSV' : 'Bulk Activities CSV'}
                <input type="file" accept=".csv" hidden onChange={(e) => parseCSV(e.target.files[0], 'destinations')} />
              </Button>
              {destFileName && <Button size="small" variant="contained" onClick={() => uploadCollection(destRows, 'Destinations_Activities', destFileName)} sx={{ bgcolor: '#8B5CF6', fontSize: '11px' }}>Push {destRows.length}</Button>}

              <Button component="label" variant="outlined" size="small" startIcon={<CloudUploadIcon />} sx={{ borderRadius: '10px', textTransform: 'none', color: '#fff', fontSize: '11px', flex: 1 }}>
                {costFileName ? 'Change Costs CSV' : 'Bulk Costs CSV'}
                <input type="file" accept=".csv" hidden onChange={(e) => parseCSV(e.target.files[0], 'costs')} />
              </Button>
              {costFileName && <Button size="small" variant="contained" onClick={() => uploadCollection(costRows, 'Local_Costs', costFileName)} sx={{ bgcolor: '#e364a7', fontSize: '11px' }}>Push {costRows.length}</Button>}
            </Paper>

          </Stack>
        </Grid>

        {/* ================= RIGHT COLUMN: EDITOR CLOUD PANEL ZONE ================= */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, height: '100%', minHeight: '600px' }}>
            
            {!isDataLoaded && !dbLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 10, textAlign: 'center', gap: 2.5 }}>
                <CloudDownloadIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.15)' }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: '800', mb: 1, color: '#fff' }}>Live Database Synchronizer Standby</Typography>
                  <Typography variant="body2" sx={{ color: '#958ea0', maxWidth: '440px', mx: 'auto' }}>
                    To prevent system slow-downs and limit Firestore data read limits, direct synchronization logs remain cached until explicitly called.
                  </Typography>
                </Box>
                <Button 
                  variant="contained" size="large" onClick={fetchLiveDatabaseRecords}
                  sx={{ backgroundColor: '#8B5CF6', px: 4, py: 1.5, fontWeight: '700', borderRadius: '14px', boxShadow: '0px 10px 20px rgba(139,92,246,0.2)' }}
                >
                  Edit Cloud Data ⚡
                </Button>
              </Box>
            ) : dbLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress sx={{ color: '#8B5CF6' }} /></Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EditNoteIcon sx={{ color: '#8B5CF6' }} />
                    <Typography variant="h5" sx={{ fontWeight: '800' }}>Live Cloud Editor Portal</Typography>
                  </Box>
                  <Button size="small" onClick={fetchLiveDatabaseRecords} sx={{ color: '#d0bcff' }}>Re-Sync Data</Button>
                </Box>

                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} sx={{ borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 2.5 }}>
                  <Tab label="Destination Sights" sx={{ fontWeight: '700', fontSize: '12px' }} />
                  <Tab label="Living Baselines Matrix" sx={{ fontWeight: '700', fontSize: '12px' }} />
                </Tabs>

                {activeTab === 0 && (
                  <Stack spacing={2}>
                    {uniqueActivityCities.map(cityName => (
                      <Accordion key={cityName} sx={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px !important', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                          <Typography sx={{ fontWeight: '700', color: '#fff' }}>📍 {cityName} Pool</Typography>
                          <Chip label={`${activitiesData.filter(item => item.city === cityName).length} Sights`} size="small" sx={{ ml: 2, backgroundColor: 'rgba(139,92,246,0.15)', color: '#d0bcff' }} />
                        </AccordionSummary>
                        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {activitiesData.filter(item => item.city === cityName).map((activity) => (
                            <Card key={activity.docId} variant="outlined" sx={{ backgroundColor: '#131c2e', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '14px' }}>
                              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 12, sm: 6 }}><TextField label="Activity Name" fullWidth size="small" value={activity.activityName || ''} onChange={(e) => handleFieldChange(activity.docId, 'activityName', e.target.value, 'activities')} /></Grid>
                                  <Grid size={{ xs: 12, sm: 3 }}><TextField label="Category" fullWidth size="small" value={activity.category || ''} onChange={(e) => handleFieldChange(activity.docId, 'category', e.target.value, 'activities')} /></Grid>
                                  <Grid size={{ xs: 12, sm: 3 }}><TextField label="Code ID" fullWidth size="small" disabled value={activity.activityId || ''} /></Grid>
                                </Grid>
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 6, sm: 3 }}><TextField label="Cost ($)" type="number" fullWidth size="small" value={activity.estimatedCostPerPerson ?? ''} onChange={(e) => handleFieldChange(activity.docId, 'estimatedCostPerPerson', Number(e.target.value), 'activities')} /></Grid>
                                  <Grid size={{ xs: 6, sm: 3 }}><TextField label="Cost Tier" fullWidth size="small" value={activity.costCategory || ''} onChange={(e) => handleFieldChange(activity.docId, 'costCategory', e.target.value, 'activities')} /></Grid>
                                  <Grid size={{ xs: 6, sm: 3 }}><TextField label="Time Slot" fullWidth size="small" value={activity.bestTimeOfDay || ''} onChange={(e) => handleFieldChange(activity.docId, 'bestTimeOfDay', e.target.value, 'activities')} /></Grid>
                                  <Grid size={{ xs: 6, sm: 3 }}><TextField label="Duration" fullWidth size="small" value={activity.averageDuration || ''} onChange={(e) => handleFieldChange(activity.docId, 'averageDuration', e.target.value, 'activities')} /></Grid>
                                </Grid>
                                
                                {/* INJECTED FIELD: EDIT MODE URL ASSET */}
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 12, sm: 4 }}><TextField label="Seasonal Months" fullWidth size="small" value={activity.bestMonthsToVisit || ''} onChange={(e) => handleFieldChange(activity.docId, 'bestMonthsToVisit', e.target.value, 'activities')} /></Grid>
                                  <Grid size={{ xs: 6, sm: 4 }}><TextField label="Latitude" type="number" fullWidth size="small" value={activity.latitude || ''} onChange={(e) => handleFieldChange(activity.docId, 'latitude', Number(e.target.value), 'activities')} /></Grid>
                                  <Grid size={{ xs: 6, sm: 4 }}><TextField label="Longitude" type="number" fullWidth size="small" value={activity.longitude || ''} onChange={(e) => handleFieldChange(activity.docId, 'longitude', Number(e.target.value), 'activities')} /></Grid>
                                </Grid>
                                
                                <TextField label="Location Image URL string" fullWidth size="small" value={activity.image || ''} onChange={(e) => handleFieldChange(activity.docId, 'image', e.target.value, 'activities')} />

                                <TextField label="Description Summary Context" multiline rows={2} fullWidth size="small" value={activity.description || ''} onChange={(e) => handleFieldChange(activity.docId, 'description', e.target.value, 'activities')} />
                                <Box display="flex" justifyContent="flex-end">
                                  <Button variant="contained" size="small" startIcon={saveLoadingId === activity.docId ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />} disabled={saveLoadingId === activity.docId} onClick={() => handleUpdateDocument(activity.docId, 'Destinations_Activities', activity)} sx={{ backgroundColor: '#8B5CF6', textTransform: 'none', borderRadius: '8px', px: 3 }}>Save Activity</Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                )}

                {activeTab === 1 && (
                  <Stack spacing={2}>
                    {uniqueCostCities.map(cityName => (
                      <Accordion key={cityName} sx={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px !important', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
                          <Typography sx={{ fontWeight: '700', color: '#fff' }}>💰 {cityName} Living Matrix</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {costsData.filter(item => item.city === cityName).map((costRow) => (
                            <Card key={costRow.docId} variant="outlined" sx={{ backgroundColor: '#131c2e', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '14px' }}>
                              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '700', letterSpacing: '0.05em' }}>ACCOMMODATION RATES PER ROOM ($)</Typography>
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 4 }}><TextField label="Budget Hotel" type="number" fullWidth size="small" value={costRow.hotelBudgetPerNight ?? ''} onChange={(e) => handleFieldChange(costRow.docId, 'hotelBudgetPerNight', Number(e.target.value), 'costs')} /></Grid>
                                  <Grid size={{ xs: 4 }}><TextField label="Mid Hotel" type="number" fullWidth size="small" value={costRow.hotelMidRangePerNight ?? ''} onChange={(e) => handleFieldChange(costRow.docId, 'hotelMidRangePerNight', Number(e.target.value), 'costs')} /></Grid>
                                  <Grid size={{ xs: 4 }}><TextField label="Luxury Hotel" type="number" fullWidth size="small" value={costRow.hotelLuxuryPerNight ?? ''} onChange={(e) => handleFieldChange(costRow.docId, 'hotelLuxuryPerNight', Number(e.target.value), 'costs')} /></Grid>
                                </Grid>
                                <Typography variant="caption" sx={{ color: '#958ea0', fontWeight: '700', letterSpacing: '0.05em' }}>DAILY DINING TARGET BUFFER ($)</Typography>
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 4 }}><TextField label="Budget Food" type="number" fullWidth size="small" value={costRow.avgMealCostBudget ?? ''} onChange={(e) => handleFieldChange(costRow.docId, 'avgMealCostBudget', Number(e.target.value), 'costs')} /></Grid>
                                  <Grid size={{ xs: 4 }}><TextField label="Mid Food" type="number" fullWidth size="small" value={costRow.avgMealCostMidRange ?? ''} onChange={(e) => handleFieldChange(costRow.docId, 'avgMealCostMidRange', Number(e.target.value), 'costs')} /></Grid>
                                  <Grid size={{ xs: 4 }}><TextField label="Luxury Food" type="number" fullWidth size="small" value={costRow.avgMealCostLuxury ?? ''} onChange={(e) => handleFieldChange(costRow.docId, 'avgMealCostLuxury', Number(e.target.value), 'costs')} /></Grid>
                                </Grid>
                                <Box display="flex" justifyContent="flex-end">
                                  <Button variant="contained" size="small" startIcon={saveLoadingId === costRow.docId ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />} disabled={saveLoadingId === costRow.docId} onClick={() => handleUpdateDocument(costRow.docId, 'Local_Costs', costRow)} sx={{ backgroundColor: '#e364a7', borderRadius: '8px', px: 3, '&:hover': { backgroundColor: '#d04f93' } }}>Save Cost Baseline</Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

          </Paper>
        </Grid>

      </Grid>
    </Container>
  );
}