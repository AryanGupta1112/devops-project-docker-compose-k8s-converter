import { useMemo } from "react";
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import ConverterPage from "./pages/ConverterPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  const location = useLocation();
  const title = useMemo(() => {
    return location.pathname === "/about" ? "About This Project" : "Docker Compose -> Kubernetes Converter";
  }, [location.pathname]);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #f7fbfb 0%, #eef8f8 100%)" }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <Stack direction="row" spacing={1}>
            <Button component={Link} to="/" color="inherit" variant={location.pathname === "/" ? "outlined" : "text"}>
              Converter
            </Button>
            <Button
              component={Link}
              to="/about"
              color="inherit"
              variant={location.pathname === "/about" ? "outlined" : "text"}
            >
              About
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<ConverterPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Container>
    </Box>
  );
}
