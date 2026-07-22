import { BadgeCheckIcon, MapPinIcon, ShoppingBagIcon } from "lucide-react";

const PERKS = [
  {
    icon: ShoppingBagIcon,
    text: "Your cart and wishlist, saved across devices",
  },
  { icon: MapPinIcon, text: "Faster checkout with saved addresses" },
  { icon: BadgeCheckIcon, text: "Track every order, door to door" },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
      <aside
        className="hidden flex-col justify-between rounded-3xl p-8 text-background lg:flex"
        style={{
          background:
            "radial-gradient(40rem 20rem at 85% -10%, oklch(0.45 0.09 60 / 0.35), transparent 62%), linear-gradient(150deg, oklch(0.21 0.022 45), oklch(0.15 0.018 35))",
        }}
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.82_0.09_75)] uppercase">
          Members get more
        </p>
        <div>
          <blockquote className="font-heading text-2xl leading-snug font-medium tracking-tight text-balance xl:text-3xl">
            One storefront, one standard — every piece checked by our team
            before it reaches you.
          </blockquote>
          <ul className="mt-8 space-y-3.5">
            {PERKS.map((perk) => (
              <li
                key={perk.text}
                className="flex items-center gap-3 text-sm text-background/75"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[oklch(0.82_0.09_75)]">
                  <perk.icon className="size-4" />
                </span>
                {perk.text}
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden />
      </aside>

      <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>
    </div>
  );
}
