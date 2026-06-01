import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, TextField, Button, Stack, Grid, CircularProgress, Alert, Divider} from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QRCodeSVG } from 'qrcode.react';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NoCrashIcon from '@mui/icons-material/NoCrash';

export default function ParkingCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const slotId = searchParams.get('slotId') || 'CUBBON_01';
  const activityTitle = searchParams.get('title') || 'Cubbon Park Heritage Walk';

  // Form Field Mappings
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [contact, setContact] = useState('');
  
  // Fake Sandbox Payment Details
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('321');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!driverName.trim() || !vehicleNo.trim() || !contact.trim()) {
      setErrorMsg('Please populate all driver details fields before proceeding.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Point directly to your physical ESP32 document path in Firestore
      const slotRef = doc(db, 'Parking_Slots', 'Cubbon_Park_Slot_01');
      
      // 2. Commit transaction updates. This instantly prompts the ESP32 to rotate the Servo!
      await updateDoc(slotRef, {
        isBooked: true,
        barrierState: "VERTICAL", 
        currentDriver: driverName,
        currentVehicle: vehicleNo
      });

      // 3. Encapsulate verification signatures into a clean, unforgeable string token map
      const uniquePassToken = JSON.stringify({
        ticketId: "PLANORA_" + Math.floor(Math.random() * 900000 + 100000),
        slotTarget: slotId,
        vehicle: vehicleNo.toUpperCase(),
        driver: driverName,
        authSignature: "PLANORA_SECURE_IOT_VALID"
      });

      setQrToken(uniquePassToken);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(`IoT Sync Fault: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, pb: 6 }}>
      {!success ? (
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <NoCrashIcon sx={{ color: '#8B5CF6', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: '800' }}>IoT Smart Space Reservation</Typography>
              <Typography variant="caption" sx={{ color: '#958ea0' }}>Securing a physical robotic barrier parking space for: <strong>{activityTitle}</strong></Typography>
            </Box>
          </Box>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <form onSubmit={handleProcessPayment}>
            <Stack spacing={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: '700', letterSpacing: '0.05em', color: '#8B5CF6' }}>1. DRIVER & VEHICLE CREDENTIALS</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label="DRIVER NAME" fullWidth required value={driverName} onChange={(e)=>setDriverName(e.target.value)} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label="VEHICLE NUMBER (e.g. KA-03-HA-1234)" fullWidth required value={vehicleNo} onChange={(e)=>setVehicleNo(e.target.value)} /></Grid>
                <Grid size={{ xs: 12 }}><TextField label="CONTACT PHONE NUMBER" fullWidth required value={contact} onChange={(e)=>setContact(e.target.value)} /></Grid>
              </Grid>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: '700', letterSpacing: '0.05em', color: '#e364a7' }}>2. NO-COST SANDBOX SMART PAYMENT CHECKOUT</Typography>
              <Alert severity="info" sx={{ background: 'rgba(139, 92, 246, 0.05)', color: '#cbc3d7', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                🔒 Sandbox Mode Active. Simulated ledger pricing: <strong>$2.50 (Free / No Cost Test Card Wired)</strong>
              </Alert>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}><TextField label="TEST CARD NUMBER" fullWidth value={cardNumber} onChange={(e)=>setCardNumber(e.target.value)} slotProps={{ input: { startAdornment: <CreditCardIcon sx={{ color: '#e364a7', mr: 1 }} /> } }} /></Grid>
                <Grid size={{ xs: 6 }}><TextField label="EXPIRY" fullWidth value={expiry} onChange={(e)=>setExpiry(e.target.value)} /></Grid>
                <Grid size={{ xs: 6 }}><TextField label="CVV SECURE CODE" fullWidth value={cvv} onChange={(e)=>setCvv(e.target.value)} /></Grid>
              </Grid>

              <Button
                type="submit" variant="contained" disabled={loading}
                sx={{ backgroundColor: '#8B5CF6', py: 1.5, borderRadius: '14px', fontWeight: '800', color: '#fff', boxShadow: '0 10px 20px rgba(139,92,246,0.15)', '&:hover': { backgroundColor: '#7c3aed' } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Process Sandbox Payment & Lock Slot'}
              </Button>
            </Stack>
          </form>
        </Paper>
      ) : (
        // ================= REVENUE SUCCESS AND PASSPORT QR GENERATION CANVAS =================
        <Paper sx={{ p: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3.5 }}>
          <CheckCircleIcon sx={{ color: '#4BB543', fontSize: 64 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#fff', mb: 0.5 }}>Slot Secured & Locked! 🔒</Typography>
            <Typography variant="body2" sx={{ color: '#cbc3d7' }}>Your physical parking barrier plate at Cubbon Park has swung <strong>VERTICAL</strong>.</Typography>
          </Box>

          <Box sx={{ background: '#fff', p: 2.5, borderRadius: '20px', display: 'inline-block', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <QRCodeSVG value={qrToken} size={220} />
          </Box>

          <Stack spacing={1} sx={{ maxWidth: '400px', width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.02)', p: 2.5, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="caption" sx={{ color: '#958ea0' }}>ASSIGNED GATE: <strong>{slotId}</strong></Typography>
            <Typography variant="caption" sx={{ color: '#958ea0' }}>VEHICLE RECOGNITION: <strong style={{color:'#fff'}}>{vehicleNo.toUpperCase()}</strong></Typography>
            <Typography variant="caption" sx={{ color: '#958ea0' }}>DRIVER RECORDED: <strong>{driverName}</strong></Typography>
          </Stack>

          <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ color: '#d0bcff', borderColor: 'rgba(139,92,246,0.3)', borderRadius: '12px', px: 4 }}>
            Return to Itinerary Timeline
          </Button>
        </Paper>
      )}
    </Container>
  );
}