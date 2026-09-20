"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoicePrintButton() {
  return (
    <Button
      size="sm"
      className="gap-2 shadow-sm"
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4" />
      Print Invoice
    </Button>
  );
}
