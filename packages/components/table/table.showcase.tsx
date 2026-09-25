"use client";

import * as React from "react";
import { Checkbox } from "../checkbox/checkbox";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "./table";
import type { SortedState } from "./table";

const people = [
  { name: "Amina Yusuf", role: "Admin", team: "Platform", status: "active", seats: 12, spend: "$4,280.00" },
  { name: "Lena Fischer", role: "Editor", team: "Design", status: "active", seats: 5, spend: "$1,120.50" },
  { name: "Hugo Diaz", role: "Viewer", team: "Growth", status: "invited", seats: 1, spend: "$0.00" },
  { name: "Sara Kim", role: "Admin", team: "Platform", status: "active", seats: 24, spend: "$9,640.00" },
  { name: "Jonas Weber", role: "Editor", team: "Support", status: "suspended", seats: 3, spend: "$620.00" },
];

export default function Showcase() {
  const [sorted, setSorted] = React.useState<SortedState>("asc");
  const [selected, setSelected] = React.useState<string[]>(["Lena Fischer"]);
  const rows = React.useMemo(() => {
    if (!sorted) return people;
    const copy = [...people];
    copy.sort((a, b) => (sorted === "asc" ? 1 : -1) * a.name.localeCompare(b.name));
    return copy;
  }, [sorted]);

  return (
    <div className="ml-table-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sortable, selectable, with footer</h3>
        <Table>
          <TableCaption>Workspace members and current seat usage</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">
                <span className="ml-visually-hidden">Select</span>
              </TableHead>
              <TableHead
                sortable={{
                  sorted,
                  onToggle: () => setSorted(sorted === "asc" ? "desc" : sorted === "desc" ? false : "asc"),
                  label: "Sort by name",
                }}
              >
                Name
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Seats</TableHead>
              <TableHead align="right">Spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((person) => {
              const checked = selected.includes(person.name);
              return (
                <TableRow key={person.name} data-state={checked ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      aria-label={`Select ${person.name}`}
                      onCheckedChange={() =>
                        setSelected((current) =>
                          checked ? current.filter((name) => name !== person.name) : [...current, person.name],
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>{person.name}</TableCell>
                  <TableCell>{person.role}</TableCell>
                  <TableCell>{person.team}</TableCell>
                  <TableCell>
                    <span className="ml-badge" data-tone={person.status === "active" ? "success" : person.status === "invited" ? "info" : "warning"}>
                      {person.status}
                    </span>
                  </TableCell>
                  <TableCell align="right" numeric>{person.seats}</TableCell>
                  <TableCell align="right" numeric>{person.spend}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>{selected.length} of {people.length} selected</TableCell>
              <TableCell align="right" numeric>
                {people.reduce((total, person) => total + person.seats, 0)}
              </TableCell>
              <TableCell align="right">seats in use</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Compact and striped</h3>
        <Table size="sm" striped>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Team</TableHead>
              <TableHead align="right">Seats</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.name}>
                <TableCell>{person.name}</TableCell>
                <TableCell>{person.team}</TableCell>
                <TableCell align="right" numeric>{person.seats}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Empty state</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2}>
                <p className="ml-empty-state">No members match this filter yet.</p>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
