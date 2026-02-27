import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useMemo, useState } from "react";

interface Props {
  manifests: Record<string, string>;
}

export default function ManifestTabs({ manifests }: Props) {
  const files = useMemo(() => Object.keys(manifests).sort(), [manifests]);
  const [activeTab, setActiveTab] = useState(0);

  if (files.length === 0) {
    return <Typography color="text.secondary">No Kubernetes manifests generated yet.</Typography>;
  }

  const clampedTab = activeTab >= files.length ? 0 : activeTab;
  const activeFile = files[clampedTab];

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Tabs
        value={clampedTab}
        onChange={(_event, next) => setActiveTab(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {files.map((file) => (
          <Tab key={file} label={file} />
        ))}
      </Tabs>
      <Box sx={{ p: 2, backgroundColor: "#0b1d25", color: "#f1f7f9", minHeight: 340, overflowX: "auto" }}>
        <Typography component="pre" sx={{ m: 0, fontFamily: "Consolas, Monaco, monospace", whiteSpace: "pre-wrap" }}>
          {manifests[activeFile]}
        </Typography>
      </Box>
    </Paper>
  );
}
