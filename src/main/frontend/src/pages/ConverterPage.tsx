import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";
import ManifestTabs from "../components/ManifestTabs";
import ServiceSummaryTable from "../components/ServiceSummaryTable";
import type { ConversionResponse } from "../types";

const starterCompose = `version: "3.9"
services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
    environment:
      APP_ENV: demo
      API_TOKEN: secret-token
    depends_on:
      - redis
  redis:
    image: redis:7
    ports:
      - "6379:6379"
`;

export default function ConverterPage() {
  const [composeYaml, setComposeYaml] = useState(starterCompose);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ConversionResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const manifestCount = useMemo(() => Object.keys(result?.manifests ?? {}).length, [result]);

  async function handleFileChange(file: File | null) {
    setSelectedFile(file);
    if (!file) {
      return;
    }

    const content = await file.text();
    setComposeYaml(content);
  }

  async function handleConvert() {
    setError("");
    setLoading(true);
    setResult(null);

    try {
      let response: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("composeFile", selectedFile);
        response = await fetch("/api/convert", {
          method: "POST",
          body: formData
        });
      } else {
        response = await fetch("/api/convert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ composeYaml })
        });
      }

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Conversion failed.");
        return;
      }
      setResult(payload as ConversionResponse);
    } catch (requestError) {
      setError(`Request failed: ${(requestError as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result?.jobId) {
      return;
    }

    const response = await fetch(`/api/download?jobId=${result.jobId}`);
    if (!response.ok) {
      setError("Failed to download ZIP. Convert again to refresh the job.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "k8s-manifests.zip";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">1. Upload or Paste docker-compose.yml</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              Upload Compose File
              <input
                type="file"
                hidden
                accept=".yml,.yaml,text/yaml,text/x-yaml"
                onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
              />
            </Button>
            <TextField
              label="Selected file"
              size="small"
              value={selectedFile?.name ?? "No file selected. Using editor text."}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
          <Box sx={{ border: "1px solid #d9e6e8", borderRadius: 2, overflow: "hidden" }}>
            <Editor
              height="320px"
              defaultLanguage="yaml"
              value={composeYaml}
              onChange={(value) => setComposeYaml(value ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true
              }}
            />
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlayCircleFilledWhiteIcon />}
              onClick={() => void handleConvert()}
              disabled={loading}
            >
              Convert
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => void handleDownload()}
              disabled={!result?.jobId}
            >
              Download ZIP
            </Button>
            <Typography sx={{ alignSelf: "center" }} color="text.secondary">
              Generated manifests: {manifestCount}
            </Typography>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          2. Parsed Services Summary
        </Typography>
        <ServiceSummaryTable services={result?.services ?? []} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          3. Conversion Warnings
        </Typography>
        {result?.warnings?.length ? (
          <Stack spacing={1}>
            {result.warnings.map((warning) => (
              <Alert key={warning} severity="warning">
                {warning}
              </Alert>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">No warnings yet.</Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          4. Generated Kubernetes Manifests
        </Typography>
        <ManifestTabs manifests={result?.manifests ?? {}} />
      </Paper>
    </Stack>
  );
}
