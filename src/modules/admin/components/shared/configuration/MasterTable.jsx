import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MasterTable({ columns, data, expandable, renderRow, renderExpandedRow }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (!data || data.length === 0) {
    return null; // Handle empty state externally
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {expandable && <TableHead className="w-[50px]"></TableHead>}
            {columns.map((col, idx) => (
              <TableHead key={idx} className={col.className || ""}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => {
            const isExpanded = expandedRows.has(row.id);
            return (
              <React.Fragment key={row.id || index}>
                <TableRow className={`group ${isExpanded ? "bg-muted/20" : ""}`}>
                  {expandable && (
                    <TableCell>
                      {row.children && row.children.length > 0 ? (
                        <button
                          onClick={() => toggleRow(row.id)}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      ) : null}
                    </TableCell>
                  )}
                  {renderRow(row)}
                </TableRow>
                {expandable && isExpanded && row.children && (
                  <TableRow className="bg-muted/5 hover:bg-muted/5">
                    <TableCell colSpan={columns.length + 1} className="p-0 border-b-0">
                      <div className="px-12 py-3 bg-muted/10 border-t border-b border-muted">
                        {renderExpandedRow(row.children, row)}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
