"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CreditCardIcon,
  HandCoinsIcon,
  PlusIcon,
  RefreshCcwIcon,
  SmartphoneIcon,
  TicketPercentIcon,
  TruckIcon,
  XIcon,
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
import { useAuth } from "@/components/auth/auth-provider";
import { useShop } from "@/components/shop/shop-provider";
import { SignInPrompt } from "@/components/shared/auth-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/components/product/product-thumb";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { previewCoupon, type CouponPreview } from "@/lib/api/coupons";
import { placeOrder } from "@/lib/api/orders";
import {
  createAddress,
  listAddresses,
  type SavedAddress,
} from "@/lib/api/addresses";
import {
  ADDRESS_LABELS,
  labelIcon,
} from "@/components/account/addresses-view";
import { DISTRICTS, districtLabel } from "@/lib/bd-geo";

const FREE_DELIVERY_MIN = 2000;
const DHAKA_FEE = 80;
const OUTSIDE_FEE = 130;

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
  /** Database id — links to the order page. */
  id: string;
  invoiceNo: string;
  name: string;
  phone: string;
  address: string;
  districtLabel: string;
  paymentLabel: string;
  total: number;
  discount: number;
  couponCode: string | null;
  insideDhaka: boolean;
}

/** "25% off — you save ৳500" line under the applied-coupon chip. */
function couponLabel(coupon: CouponPreview): string {
  if (coupon.freeShipping) return "Free delivery";
  if (coupon.discountType === "PERCENTAGE") {
    return `${Number(coupon.discountValue)}% off — you save ${formatPrice(
      Number(coupon.discount),
    )}`;
  }
  return `${formatPrice(Number(coupon.discount))} off`;
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

/** Mirrors the checkout's form + summary layout while the cart loads. */
function CheckoutSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-9 w-44" />
      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-12">
        <div className="min-w-0 flex-1 space-y-6">
          {Array.from({ length: 2 }).map((_, section) => (
            <div key={section} className="rounded-2xl border bg-card p-6">
              <Skeleton className="h-6 w-44" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, field) => (
                  <div key={field}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1.5 h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full shrink-0 lg:w-96">
          <div className="rounded-2xl border bg-card p-6">
            <Skeleton className="h-5 w-36" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="aspect-3/4 w-12 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2 self-center">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="mt-6 h-11 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Fetches the shopper's cart and gates on login, then hands the buyable
 * lines to the form. Placement is real: POST /orders consumes the server
 * cart, re-resolves prices and returns the invoice.
 */
export function CheckoutView() {
  const { status } = useAuth();
  const { cart, cartState } = useShop();

  if (status === "anonymous") {
    return (
      <SignInPrompt
        icon={CreditCardIcon}
        title="Sign in to check out"
        copy="Your cart is saved to your account. Sign in to place your order."
        nextPath="/checkout"
      />
    );
  }
  if (status === "loading" || (cartState !== "error" && !cart)) {
    return <CheckoutSkeleton />;
  }

  const failed = !cart;
  const lines = cart?.lines.filter((line) => line.isAvailable) ?? [];
  if (failed || lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
        <p className="font-heading text-xl font-medium">
          {failed ? "Couldn’t load your cart" : "Nothing to check out"}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {failed
            ? "Something went wrong on our side. Head back to your cart and try again."
            : "Your cart has no available items — add something first."}
        </p>
        <Button className="mt-6" render={<Link href={failed ? "/cart" : "/products"} />}>
          {failed ? "Back to cart" : "Start shopping"}
          <ArrowRightIcon />
        </Button>
      </div>
    );
  }

  return <CheckoutForm lines={lines} />;
}

function CheckoutForm({ lines }: { lines: CartLine[] }) {
  const { reloadCart } = useShop();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [district, setDistrict] = React.useState<string | null>(null);
  const [address, setAddress] = React.useState("");
  const [payment, setPayment] = React.useState<PaymentId>("cod");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [placed, setPlaced] = React.useState<PlacedOrder | null>(null);

  // Coupon — previewed server-side against the same cart placeOrder charges.
  const [couponInput, setCouponInput] = React.useState("");
  const [coupon, setCoupon] = React.useState<CouponPreview | null>(null);
  const [couponBusy, setCouponBusy] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);

  // The address book: pick a saved address, or "new" for the manual form.
  const [addresses, setAddresses] = React.useState<SavedAddress[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = React.useState<
    string | "new" | null
  >(null);
  const [saveAddress, setSaveAddress] = React.useState(false);
  const [saveLabel, setSaveLabel] = React.useState<string>("Home");

  React.useEffect(() => {
    let cancelled = false;
    listAddresses()
      .then((list) => {
        if (cancelled) return;
        setAddresses(list);
        // The default (first in the list) is pre-selected; an empty book
        // drops straight into the manual form.
        setSelectedAddressId(list[0]?.id ?? "new");
      })
      .catch(() => {
        if (cancelled) return;
        setAddresses([]);
        setSelectedAddressId("new");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAddress =
    selectedAddressId !== "new"
      ? (addresses?.find((a) => a.id === selectedAddressId) ?? null)
      : null;
  const usingNewAddress = selectedAddressId === "new";

  const itemCount = lines.reduce((n, line) => n + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const activeDistrict = selectedAddress?.district ?? district;
  const insideDhaka = activeDistrict === "dhaka";
  const deliveryFee =
    activeDistrict === null
      ? null
      : insideDhaka
        ? subtotal >= FREE_DELIVERY_MIN
          ? 0
          : DHAKA_FEE
        : OUTSIDE_FEE;
  const discount = coupon && !coupon.freeShipping ? Number(coupon.discount) : 0;
  const effectiveDeliveryFee = coupon?.freeShipping ? 0 : deliveryFee;
  const total = subtotal - discount + (effectiveDeliveryFee ?? 0);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const result = await previewCoupon(code);
      setCoupon(result);
      setCouponInput("");
    } catch (error) {
      setCoupon(null);
      setCouponError(
        error instanceof ApiError
          ? error.message
          : "Could not check the coupon. Please try again.",
      );
    } finally {
      setCouponBusy(false);
    }
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();

    let shipping: {
      receiverName: string;
      phone: string;
      district: string;
      address: string;
      addressId?: string;
    };

    if (selectedAddress) {
      shipping = {
        receiverName: selectedAddress.receiverName,
        phone: selectedAddress.phone,
        district: selectedAddress.district,
        address: selectedAddress.address,
        addressId: selectedAddress.id,
      };
      setErrors({});
    } else {
      const cleanPhone = phone.replace(/[\s-]/g, "");
      const next: Record<string, string> = {};
      if (!name.trim()) next.name = "Enter your full name";
      if (!/^01[3-9]\d{8}$/.test(cleanPhone))
        next.phone = "Enter a valid 11-digit number, e.g. 01712345678";
      if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()))
        next.email = "Enter a valid email address";
      if (!district) next.district = "Select your district";
      if (address.trim().length < 10)
        next.address = "Write your full address — house, road, area";
      setErrors(next);
      if (Object.keys(next).length > 0) return;
      shipping = {
        receiverName: name.trim(),
        phone: cleanPhone,
        district: district!,
        address: address.trim(),
      };
    }

    setSubmitting(true);
    try {
      // The backend re-resolves prices from the server-side cart (flash
      // deals included), claims stock and empties the cart in one
      // transaction — what returns is the real invoice.
      const order = await placeOrder({
        ...shipping,
        paymentMethod: "COD",
        ...(coupon && { couponCode: coupon.code }),
      });

      // The order is already placed — a failed address save must not turn
      // the success screen into an error.
      if (usingNewAddress && saveAddress) {
        await createAddress({
          receiverName: shipping.receiverName,
          phone: shipping.phone,
          label: saveLabel,
          district: shipping.district,
          address: shipping.address,
        }).catch(() => {});
      }

      reloadCart();
      setPlaced({
        id: order.id,
        invoiceNo: order.invoiceNo,
        name: order.shipReceiverName,
        phone: order.shipPhone,
        address: order.shipAddress,
        districtLabel: districtLabel(shipping.district),
        paymentLabel:
          PAYMENT_METHODS.find((m) => m.id === payment)?.label ?? payment,
        total: Number(order.total),
        discount: Number(order.discount),
        couponCode: order.couponCode,
        insideDhaka,
      });
      window.scrollTo({ top: 0 });
    } catch (error) {
      // Stock or flash-cap conflicts arrive as 409s with a human message;
      // the cart may have changed underneath, so refresh it too.
      reloadCart();
      setErrors({
        submit:
          error instanceof ApiError
            ? error.message
            : "Could not place the order. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
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
              #{placed.invoiceNo}
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
            {placed.discount > 0 && (
              <div className="flex justify-between gap-6">
                <dt className="text-muted-foreground">
                  Discount{placed.couponCode ? ` (${placed.couponCode})` : ""}
                </dt>
                <dd className="font-medium text-emerald-700 dark:text-emerald-400">
                  -{formatPrice(placed.discount)}
                </dd>
              </div>
            )}
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

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button render={<Link href={`/account/orders/${placed.id}`} />}>
              Track this order
              <ArrowRightIcon />
            </Button>
            <Button variant="outline" render={<Link href="/products" />}>
              Continue shopping
            </Button>
          </div>
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
        onSubmit={(e) => void submitOrder(e)}
        noValidate
        className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-12"
      >
        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading step={1} title="Delivery Details" />

            {addresses === null && (
              <Skeleton className="mt-5 h-36 w-full rounded-xl" />
            )}

            {addresses && addresses.length > 0 && (
              <div className="mt-5 space-y-3">
                {addresses.map((saved) => {
                  const Icon = labelIcon(saved.label);
                  const selected = selectedAddressId === saved.id;
                  return (
                    <label
                      key={saved.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all",
                        selected
                          ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                          : "hover:border-foreground/30"
                      )}
                    >
                      <input
                        type="radio"
                        name="ship-address"
                        checked={selected}
                        onChange={() => setSelectedAddressId(saved.id)}
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
                          {saved.receiverName}
                          {saved.label && (
                            <Badge variant="outline">{saved.label}</Badge>
                          )}
                          {saved.isDefault && (
                            <Badge
                              variant="outline"
                              className="border-brand/30 bg-brand/10 text-brand"
                            >
                              Default
                            </Badge>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {saved.address}, {districtLabel(saved.district)} ·{" "}
                          {saved.phone}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3.5 rounded-xl border border-dashed p-4 transition-all",
                    usingNewAddress
                      ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                      : "hover:border-foreground/30"
                  )}
                >
                  <input
                    type="radio"
                    name="ship-address"
                    checked={usingNewAddress}
                    onChange={() => setSelectedAddressId("new")}
                    className="sr-only"
                  />
                  <PlusIcon
                    className={cn(
                      "size-5 shrink-0",
                      usingNewAddress ? "text-brand" : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium">
                    Use a new address
                  </span>
                </label>
              </div>
            )}

            {addresses !== null && usingNewAddress && (
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
            )}

            {addresses !== null && usingNewAddress && (
              <div className="mt-4 space-y-2.5">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  <span className="text-sm">
                    Save this address for faster checkout next time
                  </span>
                </label>
                {saveAddress && (
                  <div className="flex gap-2 pl-6.5">
                    {ADDRESS_LABELS.map((option) => {
                      const Icon = labelIcon(option);
                      const selected = saveLabel === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSaveLabel(option)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                            selected
                              ? "border-brand bg-brand/10 text-brand"
                              : "text-muted-foreground hover:border-foreground/30"
                          )}
                        >
                          <Icon className="size-3" />
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeDistrict && (
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
                // Gateways aren't integrated yet — only COD really charges.
                const comingSoon = method.id !== "cod";
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={cn(
                      "flex items-start gap-3.5 rounded-xl border p-4 transition-all",
                      comingSoon
                        ? "cursor-not-allowed opacity-55"
                        : selected
                          ? "cursor-pointer border-brand bg-brand/5 ring-1 ring-brand/30"
                          : "cursor-pointer hover:border-foreground/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selected}
                      disabled={comingSoon}
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
                        {comingSoon && (
                          <Badge variant="outline" className="text-[10px]">
                            Coming soon
                          </Badge>
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

            {coupon ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-600/25 bg-emerald-600/10 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <TicketPercentIcon className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">
                      {coupon.code}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {couponLabel(coupon)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove coupon ${coupon.code}`}
                  onClick={() => {
                    setCoupon(null);
                    setCouponError(null);
                  }}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    aria-label="Coupon code"
                    placeholder="Coupon code"
                    className="h-10 font-mono uppercase"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      // Enter applies the code instead of submitting the order.
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyCoupon();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    disabled={couponBusy || couponInput.trim() === ""}
                    onClick={() => void applyCoupon()}
                  >
                    {couponBusy ? "Checking…" : "Apply"}
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-destructive">{couponError}</p>
                )}
              </div>
            )}

            <Separator className="my-5" />

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && coupon && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Discount ({coupon.code})
                  </dt>
                  <dd className="font-medium text-emerald-700 dark:text-emerald-400">
                    -{formatPrice(discount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">
                  {effectiveDeliveryFee === null
                    ? "Select district"
                    : effectiveDeliveryFee === 0
                      ? "Free"
                      : formatPrice(effectiveDeliveryFee)}
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

            {errors.submit && (
              <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.submit}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-5 h-11 w-full text-base"
            >
              {submitting ? "Placing order…" : "Place Order"}
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
