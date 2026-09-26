import { Badge } from "../../badge/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";

export const title = "With status";
export const description = "Status reads as a word first; the tone only reinforces it.";

const deploys = [
  { id: "#2481", branch: "main", status: "Live", tone: "success" as const },
  { id: "#2480", branch: "pricing-copy", status: "Building", tone: "info" as const },
  { id: "#2479", branch: "checkout", status: "Failed", tone: "danger" as const },
];

export default function Example() {
  return (
    <Table size="sm" aria-label="Deploys">
      <TableHeader>
        <TableRow>
          <TableHead>Deploy</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deploys.map((deploy) => (
          <TableRow key={deploy.id}>
            <TableCell>{deploy.id}</TableCell>
            <TableCell>
              <code>{deploy.branch}</code>
            </TableCell>
            <TableCell>
              <Badge tone={deploy.tone} dot>{deploy.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
