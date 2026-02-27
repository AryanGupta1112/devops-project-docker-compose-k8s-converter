import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Paper, Stack, Typography } from "@mui/material";

const docs = [
  "docs/project-plan.md",
  "docs/design-document.md",
  "docs/user-guide.md",
  "docs/api-documentation.md"
];

export default function AboutPage() {
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Project Overview
        </Typography>
        <Typography paragraph>
          This project converts Docker Compose files into Kubernetes manifests. It generates Deployment, Service,
          ConfigMap, Secret, and PVC resources where applicable and returns warnings for unsupported or best-effort
          conversions.
        </Typography>
        <Typography paragraph>
          {"Architecture flow: Frontend UI (MUI + Monaco) -> Express API -> Converter Service -> Manifest Viewer + ZIP download."}
        </Typography>
        <Typography>
          Return to <Link component={RouterLink} to="/">Converter</Link>.
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Documentation Paths
        </Typography>
        <Box component="ul" sx={{ my: 0, pl: 3 }}>
          {docs.map((doc) => (
            <li key={doc}>
              <Typography component="span">{doc}</Typography>
            </li>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}
