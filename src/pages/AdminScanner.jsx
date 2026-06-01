import React, { useState, useEffect, useRef } from 'react';
import { Container, Paper, Typography, Box, Button, Alert, CircularProgress, Stack } from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import SensorDoorIcon from '@mui/icons-material/SensorDoor';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

export default function AdminScanner() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [scanMeta, setScanMeta] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  
  const scannerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize the HTML5 QR Scanner inside the DOM container on mount
    if (cameraActive) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader", 
        { 
          fps: 10,                 // Frames per second scanning frequency rate
          qrbox: { width: 250, height: 250 }, // Square targeting reticle frame dimensions
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      // 2. Bind Success and Failure execution blocks
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    // Cleanup loop on component unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear fail:", err));
      }
    };
  }, [cameraActive]);

  // TRIGGER HOOK UPON SUCCESSFUL QR IMAGE PARSING BOUNDARY
  const onScanSuccess = async (decodedText) => {
    // Temporarily halt multiple continuous capture frames while processing database
    if (loading) return; 
    
    setLoading(true);
    setStatus({ type: '', msg: '' });
    setScanMeta(null);

    try {
      // Parse the incoming scanned text payload back into a structured object
      const parsedTicket = JSON.parse(decodedText.trim());

      // Security check: Reject tokens that lack our explicit auth key signature
      if (parsedTicket.authSignature !== "PLANORA_SECURE_IOT_VALID") {
        throw new Error("Invalid or fraudulent signature match token rejected.");
      }

      setScanMeta(parsedTicket);

      // Stop the webcam stream tracking loops since validation cleared
      if (scannerRef.current) {
        await scannerRef.current.clear();
        setCameraActive(false);
      }

      // Update Firestore: This immediately commands the physical servo to return to 0 degrees flat!
      const slotRef = doc(db, 'Parking_Slots', 'Cubbon_Park_Slot_01');
      await updateDoc(slotRef, {
        isBooked: false,
        barrierState: "HORIZONTAL" 
      });

      setStatus({ 
        type: 'success', 
        msg: `🎉 QR Code Verified! Barrier lowered smoothly for Driver: ${parsedTicket.driver} (${parsedTicket.vehicle}).` 
      });

    } catch (err) {
      setStatus({ 
        type: 'error', 
        msg: `Scan Refused: ${err.message || 'Malformed data string format detected.'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error) => {
    // Silence continuous frame monitoring warnings in console log
  };

  const handleRestartCamera = () => {
    setScanMeta(null);
    setStatus({ type: '', msg: '' });
    setCameraActive(true);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, pb: 6 }}>
      <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3.5, border: '1px solid rgba(255,255,255,0.06)' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <QrCodeScannerIcon sx={{ color: '#e364a7', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '800' }}>Gate Webcam Terminal</Typography>
            <Typography variant="body2" sx={{ color: '#958ea0' }}>Hold up your Planora Checkout ticket pass to your webcam lens.</Typography>
          </Box>
        </Box>

        {status.msg && <Alert severity={status.type} sx={{ borderRadius: '12px' }}>{status.msg}</Alert>}

        {/* WEBCAM RENDERING HUB CONTAINER ELEMENT */}
        {cameraActive ? (
          <Box 
            id="reader" 
            sx={{ 
              width: '100%', 
              overflow: 'hidden', 
              borderRadius: '16px',
              border: 'none !important',
              '& video': { borderRadius: '16px', objectFit: 'cover' },
              '& #html5-qrcode-anchor-scan-region': { border: 'none !important' },
              '& button': {
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #8B5CF6',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '10px',
                textTransform: 'uppercase',
                fontWeight: '700',
                '&:hover': { background: 'rgba(139,92,246,0.1)' }
              }
            }} 
          />
        ) : (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <VideocamOffIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }} />
            <Typography variant="body2" sx={{ color: '#958ea0' }}>Webcam streaming feeds suspended.</Typography>
            <Button variant="outlined" size="small" onClick={handleRestartCamera} sx={{ color: '#e364a7', borderColor: '#e364a7', borderRadius: '8px', textTransform: 'none', fontWeight: '700' }}>
              Re-activate Scanner Feed 🔄
            </Button>
          </Box>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} sx={{ py: 2 }}>
            <CircularProgress size={20} sx={{ color: '#e364a7' }} />
            <Typography variant="caption" sx={{ color: '#cbc3d7' }}>Authenticating digital IoT keys...</Typography>
          </Box>
        )}

        {scanMeta && (
          <Box sx={{ p: 2.5, bgcolor: 'rgba(139,92,246,0.05)', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.15)' }}>
            <Typography variant="caption" sx={{ color: '#8B5CF6', fontWeight: '800', display: 'block', mb: 1, letterSpacing: '0.05em' }}>VERIFIED ARRIVAL METRICS LOGS:</Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ color: '#cbc3d7' }}>🎫 TICKET SIGNATURE: <strong>{scanMeta.ticketId}</strong></Typography>
              <Typography variant="caption" sx={{ color: '#cbc3d7' }}>🚗 RECOGNITION ID: <strong style={{color:'#fff'}}>{scanMeta.vehicle}</strong></Typography>
              <Typography variant="caption" sx={{ color: '#cbc3d7' }}>👤 DRIVER CLEARANCE: <strong>{scanMeta.driver}</strong></Typography>
            </Stack>
          </Box>
        )}
      </Paper>
    </Container>
  );
}