"use client";

import * as React from "react";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  INVOICE_WIDTH,
  InvoiceDocument,
} from "@/components/shared/invoice/invoice-document";
import type { OrderDetail } from "@/lib/api/orders";

/**
 * Preview-then-download. The preview IS the artefact: Download rasterises
 * the exact node on screen (html2canvas @2x) into an A4 jsPDF, so what the
 * customer saves is pixel-identical to what they approved. Both libraries
 * load on demand — they never enter the main bundle.
 */
export function InvoiceDialog({
  order,
  onClose,
}: {
  order: OrderDetail;
  onClose: () => void;
}) {
  const docRef = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function download() {
    const node = docRef.current;
    if (!node) return;
    setBusy(true);
    setError(null);
    try {
      // -pro fork: parses the modern colour functions (oklch/lab/color-mix)
      // this Tailwind theme compiles to; the original html2canvas throws.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: INVOICE_WIDTH,
      });

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      const image = canvas.toDataURL("image/jpeg", 0.95);

      // Long invoices continue on further pages by sliding the same image up.
      let rendered = 0;
      let page = 0;
      while (rendered < imageHeight) {
        if (page > 0) pdf.addPage();
        pdf.addImage(image, "JPEG", 0, -page * pageHeight, pageWidth, imageHeight);
        rendered += pageHeight;
        page += 1;
      }

      pdf.save(`${order.invoiceNo}.pdf`);
    } catch (err) {
      // Surfaced for diagnosis — html2canvas failures (fonts, colours,
      // tainted images) otherwise vanish into the generic message.
      console.error("Invoice PDF generation failed:", err);
      setError("Could not build the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogTitle>Invoice {order.invoiceNo}</DialogTitle>
        <DialogDescription>
          Check the preview, then save it as a PDF.
        </DialogDescription>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="overflow-auto rounded-lg border border-border bg-muted/40 p-3 sm:p-5">
          <div
            className="mx-auto shadow-lg"
            style={{ width: INVOICE_WIDTH, maxWidth: "none" }}
          >
            <InvoiceDocument ref={docRef} order={order} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Close
          </Button>
          <Button type="button" disabled={busy} onClick={() => void download()}>
            <DownloadIcon data-icon="inline-start" />
            {busy ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
