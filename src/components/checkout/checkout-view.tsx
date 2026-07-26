"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CreditCardIcon,
  HandCoinsIcon,
  RefreshCcwIcon,
  SmartphoneIcon,
  TruckIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductThumb } from "@/components/product/product-thumb";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/lib/api/cart";

const FREE_DELIVERY_MIN = 2000;
const DHAKA_FEE = 80;
const OUTSIDE_FEE = 130;

const DISTRICTS = [
  { value: "dhaka", label: "Dhaka" },
  { value: "gazipur", label: "Gazipur" },
  { value: "narayanganj", label: "Narayanganj" },
  { value: "chattogram", label: "Chattogram" },
  { value: "coxs-bazar", label: "Cox's Bazar" },
  { value: "cumilla", label: "Cumilla" },
  { value: "sylhet", label: "Sylhet" },
  { value: "rajshahi", label: "Rajshahi" },
  { value: "khulna", label: "Khulna" },
  { value: "barishal", label: "Barishal" },
  { value: "rangpur", label: "Rangpur" },
  { value: "mymensingh", label: "Mymensingh" },
];

const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    hint: "Pay in cash when your order arrives",
    icon: HandCoinsIcon,
    recommended: true,
  },
  {
    id: "bkash",
    label: "bKash",
    hint: "You’ll get a payment prompt on your bKash number",
    icon: SmartphoneIcon,
  },
  {
    id: "card",
    label: "Card",
    hint: "Visa or Mastercard, secured by SSLCommerz",
    icon: CreditCardIcon,
  },
] as const;

type PaymentId = (typeof PAYMENT_METHODS)[number]["id"];

interface PlacedOrder {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  districtLabel: string;
  paymentLabel: string;
  total: number;
  insideDhaka: boolean;
}

function Field({
  label,
  htmlFor,
  optional,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5">
      <span className="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
        {step}
      </span>
      <span className="font-heading text-lg font-medium">{title}</span>
    </h2>
  );
}

export function CheckoutView({ lines }: { lines: CartLine[] }) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [district, setDistrict] = React.useState<string | null>(null);
  const [address, setAddress] = React.useState("");
  const [payment, setPayment] = React.useState<PaymentId>("cod");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [placed, setPlaced] = React.useState<PlacedOrder | null>(null);

  const itemCount = lines.reduce((n, line) => n + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const insideDhaka = district === "dhaka";
  const deliveryFee =
    district === null
      ? null
      : insideDhaka
        ? subtotal >= FREE_DELIVERY_MIN
          ? 0
          : DHAKA_FEE
        : OUTSIDE_FEE;
  const total = subtotal + (deliveryFee ?? 0);

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter your full name";
    if (!/^01\d{9}$/.test(phone.replace(/[\s-]/g, "")))
      next.phone = "Enter a valid 11-digit number, e.g. 01712345678";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = "Enter a valid email address";
    if (!district) next.district = "Select your district";
    if (address.trim().length < 10)
      next.address = "Write your full address — house, road, area";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPlaced({
      orderId: `FL-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      phone: phone.replace(/[\s-]/g, ""),
      address: address.trim(),
      districtLabel:
        DISTRICTS.find((d) => d.value === district)?.label ?? district!,
      paymentLabel:
        PAYMENT_METHODS.find((m) => m.id === payment)?.label ?? payment,
      total,
      insideDhaka,
    });
    window.scrollTo({ top: 0 });
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border bg-card p-8 text-center sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10">
            <CheckIcon className="size-8 text-brand" />
          </span>
          <h1 className="font-heading mt-5 text-2xl font-medium tracking-tight sm:text-3xl">
            Order placed!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order{" "}
            <span className="font-semibold text-foreground">
              #{placed.orderId}
            </span>{" "}
            · We’ll call {placed.phone} shortly to confirm.
          </p>

          <dl className="mt-6 space-y-2.5 rounded-xl bg-muted/60 p-4 text-left text-sm">
            <div className="flex justify-between gap-6">
              <dt className="shrink-0 text-muted-foreground">Deliver to</dt>
              <dd className="text-right font-medium">
                {placed.name} · {placed.address}, {placed.districtLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="font-medium">{placed.paymentLabel}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold">{formatPrice(placed.total)}</dd>
            </div>
          </dl>

          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <TruckIcon className="size-4 text-brand" />
            Estimated delivery:{" "}
            {placed.insideDhaka ? "1–2 days" : "3–5 days"}
          </p>

          <Button className="mt-6" render={<Link href="/products" />}>
            Continue shopping
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
        Checkout
      </p>
      <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
        Almost there
      </h1>
      <Link
        href="/cart"
        className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        Back to cart
      </Link>

      <form
        onSubmit={placeOrder}
        noValidate
        className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-12"
      >
        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading step={1} title="Delivery Details" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" error={errors.name}>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nusrat Jahan"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  className="h-10"
                />
              </Field>
              <Field label="Phone" htmlFor="phone" error={errors.phone}>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712 345678"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className="h-10"
                />
              </Field>
              <Field
                label="Email"
                htmlFor="email"
                optional
                error={errors.email}
              >
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className="h-10"
                />
              </Field>
              <Field label="District" htmlFor="district" error={errors.district}>
                <Select
                  value={district}
                  items={DISTRICTS}
                  onValueChange={(value) => setDistrict(value)}
                >
                  <SelectTrigger
                    id="district"
                    aria-invalid={!!errors.district}
                    className="h-10 w-full"
                  >
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Full address"
                  htmlFor="address"
                  error={errors.address}
                >
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, road, area — e.g. House 12, Road 5, Dhanmondi"
                    rows={3}
                    aria-invalid={!!errors.address}
                    className="w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
                  />
                </Field>
              </div>
            </div>
            {district && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <TruckIcon className="size-4 shrink-0 text-brand" />
                {insideDhaka
                  ? subtotal >= FREE_DELIVERY_MIN
                    ? "Free delivery inside Dhaka · arrives in 1–2 days"
                    : `Delivery inside Dhaka ${formatPrice(DHAKA_FEE)} · arrives in 1–2 days`
                  : `Delivery outside Dhaka ${formatPrice(OUTSIDE_FEE)} · arrives in 3–5 days`}
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading step={2} title="Payment Method" />
            <div className="mt-5 space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const selected = payment === method.id;
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all",
                      selected
                        ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                        : "hover:border-foreground/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selected}
                      onChange={() => setPayment(method.id)}
                      className="sr-only"
                    />
                    <Icon
                      className={cn(
                        "mt-0.5 size-5 shrink-0",
                        selected ? "text-brand" : "text-muted-foreground"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {method.label}
                        {"recommended" in method && method.recommended && (
                          <Badge variant="secondary">Most popular</Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {method.hint}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected ? "border-brand bg-brand" : "border-border"
                      )}
                    >
                      {selected && (
                        <span className="size-1.5 rounded-full bg-brand-foreground" />
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <div className="w-full shrink-0 lg:w-96">
          <div className="rounded-2xl border bg-card p-6 lg:sticky lg:top-32">
            <h2 className="font-heading text-lg font-medium">Your Order</h2>

            <ul className="mt-4 space-y-3.5">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <ProductThumb
                      title={line.title}
                      image={line.image}
                      seed={line.slug}
                      className="aspect-3/4 w-12 rounded-lg"
                      sizes="48px"
                    />
                    <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.title}</p>
                    {line.variantLabel && (
                      <p className="truncate text-xs text-muted-foreground">
                        {line.variantLabel}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <Separator className="my-5" />

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">
                  {deliveryFee === null
                    ? "Select district"
                    : deliveryFee === 0
                      ? "Free"
                      : formatPrice(deliveryFee)}
                </dd>
              </div>
            </dl>

            <Separator className="my-5" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-2xl font-semibold">
                {formatPrice(total)}
              </span>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-5 h-11 w-full text-base"
            >
              Place Order
              <ArrowRightIcon />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              By placing this order you agree to our{" "}
              <Link href="/pages/terms" className="underline hover:text-brand">
                terms of service
              </Link>
            </p>

            <Separator className="my-5" />

            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <TruckIcon className="size-4 shrink-0 text-brand" />
                Nationwide delivery — all 64 districts
              </li>
              <li className="flex items-center gap-2.5">
                <RefreshCcwIcon className="size-4 shrink-0 text-brand" />
                7-day easy returns
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
}
