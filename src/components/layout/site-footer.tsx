import Link from "next/link";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wider text-background/90 uppercase">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-background/60 transition-colors hover:text-background"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo className="h-20" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/60">
              {siteConfig.description}
            </p>
            <ul className="mt-5 flex gap-4">
              {siteConfig.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-background/60 transition-colors hover:text-background"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title="Shop" links={siteConfig.footerNav.shop} />
          <FooterColumn title="Help" links={siteConfig.footerNav.help} />

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-background/90 uppercase">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-background/60">
              <li className="flex items-start gap-2.5">
                <PhoneIcon className="mt-0.5 size-4 shrink-0" />
                {siteConfig.contact.phone}
              </li>
              <li className="flex items-start gap-2.5">
                <MailIcon className="mt-0.5 size-4 shrink-0" />
                {siteConfig.contact.email}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                {siteConfig.contact.address}
              </li>
              <li className="flex items-start gap-2.5">
                <ClockIcon className="mt-0.5 size-4 shrink-0" />
                {siteConfig.contact.hours}
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/15" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-background/50">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {siteConfig.payments.map((method) => (
              <li
                key={method}
                className="rounded-md border border-background/20 px-2.5 py-1 text-[11px] font-medium text-background/70"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
