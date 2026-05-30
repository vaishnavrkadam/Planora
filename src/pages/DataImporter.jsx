import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Alert, Box, CircularProgress, Stack } from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StorageIcon from '@mui/icons-material/Storage';

export default function DataImporter() {
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  // 1. Handle File Selection and Parsing
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatus({ type: '', msg: '' });

    Papa.parse(file, {
      header: true,         // Automatically treats the first row as columns/keys
      skipEmptyLines: true, // Ignores blank lines at the bottom
      dynamicTyping: true,  // Automatically converts numbers like 28.6139 out of strings
      complete: (results) => {
        setParsedRows(results.data);
        setStatus({
          type: 'info',
          msg: `Detected ${results.data.length} structural rows in "${file.name}". Ready to push.`
        });
      },
      error: (error) => {
        setStatus({ type: 'error', msg: `CSV Parsing failed: ${error.message}` });
      }
    });
  };

  // 2. Upload Parsed Data to Firestore
  const handleUploadToFirestore = async () => {
    if (parsedRows.length === 0) {
      setStatus({ type: 'error', msg: 'No data available to upload. Please select a CSV file first.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const targetCollection = collection(db, 'Local_Costs');
      let uploadedCount = 0;

      for (const row of parsedRows) {
        // Pushes the row objects matching your exact spreadsheet header keys
        await addDoc(targetCollection, row);
        uploadedCount++;
      }

      setStatus({
        type: 'success',
        msg: `Successfully imported ${uploadedCount} custom records from "${fileName}" straight into Firestore!`
      });
      setParsedRows([]);
      setFileName('');
    } catch (err) {
      setStatus({ type: 'error', msg: `Database upload broken: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper sx={{ p: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        <Box>
          <StorageIcon sx={{ color: '#8B5CF6', fontSize: 40, mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: '800', mb: 1 }}>CSV Data Portal</Typography>
          <Typography variant="body2" sx={{ color: '#cbc3d7' }}>
            Export your sheet as a .csv file, load it here, and push it directly to your live NoSQL Firestore database.
          </Typography>
        </Box>

        {status.msg && <Alert severity={status.type} sx={{ textAlign: 'left' }}>{status.msg}</Alert>}

        {/* Hidden File Input Element wrapped by a Stylized Button */}
        <Stack direction="column" spacing={2} alignItems="center">
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              px: 4, py: 2,
              borderRadius: '16px',
              textTransform: 'none',
              '&:hover': { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)' }
            }}
          >
            {fileName ? 'Change CSV File' : 'Select CSV File'}
            <input type="file" accept=".csv" hidden onChange={handleFileChange} />
          </Button>
          
          {fileName && (
            <Typography variant="caption" sx={{ color: '#d0bcff', fontWeight: '600' }}>
              Selected: {fileName}
            </Typography>
          )}
        </Stack>

        <Button
          variant="contained"
          size="large"
          disabled={loading || parsedRows.length === 0}
          onClick={handleUploadToFirestore}
          sx={{
            backgroundColor: '#8B5CF6',
            py: 1.8,
            borderRadius: '16px',
            fontWeight: '700',
            color: '#fff',
            boxShadow: parsedRows.length > 0 ? '0px 20px 40px rgba(139, 92, 246, 0.2)' : 'none',
            '&:hover': { backgroundColor: '#7c3aed' }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Push Data to Firestore'}
        </Button>

      </Paper>
    </Container>
  );
}