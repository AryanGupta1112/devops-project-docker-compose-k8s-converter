import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { ServiceSummary } from "../types";

interface Props {
  services: ServiceSummary[];
}

export default function ServiceSummaryTable({ services }: Props) {
  if (services.length === 0) {
    return <Typography color="text.secondary">No services parsed yet.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Service</TableCell>
            <TableCell>Image</TableCell>
            <TableCell>Ports</TableCell>
            <TableCell>ConfigMap</TableCell>
            <TableCell>Secret</TableCell>
            <TableCell>Volume Mounts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.name}>
              <TableCell>{service.name}</TableCell>
              <TableCell>{service.image}</TableCell>
              <TableCell>{service.ports.length > 0 ? service.ports.join(", ") : "-"}</TableCell>
              <TableCell>{service.hasConfigMap ? "Yes" : "No"}</TableCell>
              <TableCell>{service.hasSecret ? "Yes" : "No"}</TableCell>
              <TableCell>{service.volumeCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
