import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#005f73"
    },
    secondary: {
      main: "#0a9396"
    },
    background: {
      default: "#f7fbfb",
      paper: "#ffffff"
    }
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h4: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 12
  }
});
