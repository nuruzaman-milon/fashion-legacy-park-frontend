import { AccountNav } from "@/components/account/account-nav";
import { RequireAuth } from "@/components/auth/require-auth";

export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
        My account
      </h1>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <AccountNav />
        <RequireAuth>{children}</RequireAuth>
      </div>
    </div>
  );
}
