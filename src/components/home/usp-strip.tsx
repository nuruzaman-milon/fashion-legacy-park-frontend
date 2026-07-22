import {
  BadgeCheckIcon,
  HandCoinsIcon,
  RefreshCcwIcon,
  TruckIcon,
} from "lucide-react";

const USPS = [
  {
    icon: TruckIcon,
    title: "Nationwide delivery",
    detail: "Pathao, Steadfast & RedX to all 64 districts",
  },
  {
    icon: HandCoinsIcon,
    title: "Cash on Delivery",
    detail: "Pay at your door — or bKash & cards online",
  },
  {
    icon: RefreshCcwIcon,
    title: "7-day easy returns",
    detail: "Wrong size or damaged? We'll make it right",
  },
  {
    icon: BadgeCheckIcon,
    title: "Verified reviews",
    detail: "Every rating comes from a real purchase",
  },
];

export function UspStrip() {
  return (
    <section aria-label="Why shop with us" className="border-y bg-card">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 sm:px-6 lg:grid-cols-4">
        {USPS.map((usp) => (
          <li key={usp.title} className="flex items-start gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <usp.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{usp.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {usp.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
