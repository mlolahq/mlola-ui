import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table";

const invoices = [
  { id: "INV-104", status: "Paid", amount: "$240.00" },
  { id: "INV-105", status: "Open", amount: "$1,120.00" },
];

export default function Example() {
  return (
    <Table>
      <TableCaption>Recent invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead align="right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell numeric>{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
