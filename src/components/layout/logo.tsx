import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import logoSrc from "../../../public/images/logo/fashion-legacy-logo.webp";

interface LogoProps {
  className?: string;
  priority?: boolean;
  onClick?: () => void;
}

export function Logo({ className, priority, onClick }: LogoProps) {
  return (
    <Link href="/" onClick={onClick} className="inline-flex shrink-0 items-center">
      <Image
        src={logoSrc}
        alt={siteConfig.name}
        priority={priority}
        className={cn("h-10 w-auto", className)}
      />
    </Link>
  );
}
