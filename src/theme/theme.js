import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d0bcff',
      contrastText: '#3c0091',
    },
    secondary: {
      main: '#adc6ff',
      contrastText: '#002e6a',
    },
    background: {
      default: '#0b1326',
      paper: '#171f33',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#cbc3d7',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontSize: '48px',
      fontWeight: '800',
      lineHeight: '56px',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '40px',
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '24px',
    },
    button: {
      textTransform: 'none',
      fontWeight: '600',
      borderRadius: '16px',
    },
  },
  components: {
    // Styling the global background mesh
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b1326',
          // Creative mesh gradient simulating cosmic horizons
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(5, 102, 217, 0.15) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(227, 100, 167, 0.08) 0px, transparent 70%)
          `,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          color: '#dae2fd',
          margin: 0,
        },
      },
    },
    // Designing our global Glass Card system
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(23, 31, 51, 0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px', // 1.5rem
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          borderRight: '1px solid rgba(255, 255, 255, 0.04)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          boxShadow: 'none',
        },
      },
    },
    // Designing our inputs to be minimalist and glass-like
    MuiTextField: {
      defaultProps: {
        variant: 'filled',
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          '&:before, &:after': { display: 'none' }, // Remove default borders
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: '#8B5CF6',
            boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
          },
        },
      },
    },
  },
});

export default theme;