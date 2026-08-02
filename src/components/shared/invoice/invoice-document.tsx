/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";

import { siteConfig } from "@/config/site";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrderDetail } from "@/lib/api/orders";

/**
 * The printable A4 invoice. Deliberately self-contained: every colour is an
 * inline hex and the background is white, so it renders identically in dark
 * mode AND survives html2canvas, which cannot parse the theme's oklch()
 * variables. Layout utilities only — no colour classes.
 */

const INK = "#1c1917";
const SUB = "#78716c";
const LINE = "#e7e5e4";
const FAINT = "#fafaf9";
const ACCENT = "#a16207";

const STATUS_PILL: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PAID: { label: "PAID", color: "#047857", bg: "#ecfdf5" },
  DUE: { label: "PAYMENT DUE", color: "#b45309", bg: "#fffbeb" },
  CANCELLED: { label: "CANCELLED", color: "#b91c1c", bg: "#fef2f2" },
};

/** A4 at 96dpi is 794×1123 — the width is fixed so the PDF is predictable. */
export const INVOICE_WIDTH = 794;

export const InvoiceDocument = React.forwardRef<
  HTMLDivElement,
  { order: OrderDetail }
>(function InvoiceDocument({ order }, ref) {
  const pill =
    order.orderStatus === "CANCELLED"
      ? STATUS_PILL.CANCELLED
      : order.paymentStatus === "PAID"
        ? STATUS_PILL.PAID
        : STATUS_PILL.DUE;

  return (
    <div
      ref={ref}
      style={{
        width: INVOICE_WIDTH,
        backgroundColor: "#ffffff",
        color: INK,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div style={{ height: 6, backgroundColor: ACCENT }} />

      <div style={{ padding: "40px 48px 44px" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <img
              src="/images/logo/fashion-legacy-logo.webp"
              alt={siteConfig.name}
              style={{ height: 64, width: "auto" }}
            />
            <p style={{ marginTop: 10, color: SUB, fontSize: 12 }}>
              {siteConfig.contact.address}
              <br />
              {siteConfig.contact.phone} · {siteConfig.contact.email}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              INVOICE
            </p>
            <p
              style={{
                fontFamily: "Consolas, Menlo, monospace",
                fontSize: 15,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              {order.invoiceNo}
            </p>
            <p style={{ color: SUB, fontSize: 12, marginTop: 4 }}>
              {formatDateTime(order.createdAt)}
            </p>
            <span
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: pill.color,
                backgroundColor: pill.bg,
                border: `1px solid ${pill.color}33`,
              }}
            >
              {pill.label}
            </span>
          </div>
        </div>

        {/* Parties */}
        <div
          className="mt-8 grid grid-cols-3 gap-6"
          style={{
            borderTop: `1px solid ${LINE}`,
            paddingTop: 24,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: ACCENT }}>
              BILLED TO
            </p>
            <p style={{ fontWeight: 700, marginTop: 6 }}>
              {order.shipReceiverName}
            </p>
            <p style={{ color: SUB, fontSize: 12 }}>
              {order.email}
              <br />
              {order.phone}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: ACCENT }}>
              SHIP TO
            </p>
            <p style={{ fontWeight: 700, marginTop: 6 }}>
              {order.shipReceiverName}
            </p>
            <p style={{ color: SUB, fontSize: 12 }}>
              {order.shipAddress}
              <br />
              {order.shipDistrict.charAt(0).toUpperCase() +
                order.shipDistrict.slice(1)}
              {" · "}
              {order.shipPhone}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: ACCENT }}>
              PAYMENT
            </p>
            <p style={{ fontWeight: 700, marginTop: 6 }}>
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : order.paymentMethod}
            </p>
            <p style={{ color: SUB, fontSize: 12 }}>
              {order.paymentStatus === "PAID"
                ? "Received in full"
                : order.orderStatus === "CANCELLED"
                  ? "Not applicable"
                  : "Collect on delivery"}
            </p>
          </div>
        </div>

        {/* Items */}
        <table
          className="mt-8 w-full"
          style={{ borderCollapse: "collapse", fontSize: 12.5 }}
        >
          <thead>
            <tr style={{ backgroundColor: FAINT }}>
              {["#", "ITEM", "QTY", "UNIT PRICE", "AMOUNT"].map(
                (head, i) => (
                  <th
                    key={head}
                    style={{
                      padding: "10px 12px",
                      textAlign: i >= 2 ? "right" : "left",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: SUB,
                      borderTop: `1px solid ${LINE}`,
                      borderBottom: `1px solid ${LINE}`,
                    }}
                  >
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td
                  style={{
                    padding: "10px 12px",
                    color: SUB,
                    borderBottom: `1px solid ${LINE}`,
                    width: 32,
                  }}
                >
                  {index + 1}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.title}</span>
                  <br />
                  <span style={{ color: SUB, fontSize: 11.5 }}>
                    {item.variantName && item.variantName !== "Default"
                      ? `${item.variantName} · `
                      : ""}
                    SKU {item.sku}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  {formatPrice(Number(item.unitPrice))}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    fontWeight: 600,
                    borderBottom: `1px solid ${LINE}`,
                  }}
                >
                  {formatPrice(Number(item.unitPrice) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div style={{ width: 280 }}>
            <div className="flex justify-between" style={{ padding: "5px 12px" }}>
              <span style={{ color: SUB }}>Subtotal</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between" style={{ padding: "5px 12px" }}>
              <span style={{ color: SUB }}>Delivery</span>
              <span>
                {Number(order.shippingCharge) === 0
                  ? "Free"
                  : formatPrice(Number(order.shippingCharge))}
              </span>
            </div>
            {Number(order.discount) > 0 && (
              <div
                className="flex justify-between"
                style={{ padding: "5px 12px" }}
              >
                <span style={{ color: SUB }}>
                  Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                </span>
                <span>-{formatPrice(Number(order.discount))}</span>
              </div>
            )}
            {Number(order.tax) > 0 && (
              <div
                className="flex justify-between"
                style={{ padding: "5px 12px" }}
              >
                <span style={{ color: SUB }}>VAT</span>
                <span>{formatPrice(Number(order.tax))}</span>
              </div>
            )}
            <div
              className="flex items-baseline justify-between"
              style={{
                marginTop: 8,
                padding: "10px 12px",
                backgroundColor: FAINT,
                borderTop: `2px solid ${INK}`,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span style={{ fontSize: 18 }}>
                {formatPrice(Number(order.total))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            borderTop: `1px solid ${LINE}`,
            paddingTop: 18,
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            color: SUB,
            fontSize: 11.5,
          }}
        >
          <p>
            Thank you for shopping with {siteConfig.name}.
            <br />
            Questions about this order? {siteConfig.contact.email}
          </p>
          <p style={{ textAlign: "right" }}>
            {siteConfig.url.replace("https://", "")}
            <br />
            This is a computer-generated invoice.
          </p>
        </div>
      </div>
    </div>
  );
});
