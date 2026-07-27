/**
 * Layout for standalone auth status pages (check your email, verify email).
 * No showcase panel — the status card is the only actor, centered on the
 * page.
 */
export default function AuthStatusLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-20">
      {children}
    </div>
  );
}
