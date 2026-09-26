"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type SortedState } from "../table";

export const title = "Sortable";
export const description = "A sortable header is a button that says how it sorts; aria-sort tells assistive technology.";

const rows = [
  { name: "Atlas", visits: 12480 },
  { name: "Harbor", visits: 3920 },
  { name: "Meridian", visits: 8710 },
];

export default function Example() {
  const [sorted, setSorted] = React.useState<SortedState>("desc");
  const ordered = [...rows].sort((a, b) => (sorted === "asc" ? a.visits - b.visits : b.visits - a.visits));
  return (
    <Table aria-label="Projects by visits">
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead align="right" sortable={{ sorted, onToggle: () => setSorted(sorted === "desc" ? "asc" : "desc") }}>
            Visits
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordered.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell numeric>{row.visits.toLocaleString("en-US")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
