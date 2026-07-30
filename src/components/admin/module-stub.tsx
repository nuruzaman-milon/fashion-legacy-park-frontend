import { ConstructionIcon } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";

/** Placeholder for modules whose backend API exists but whose UI is next up. */
export function ModuleStub({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ConstructionIcon className="size-6" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">This screen is on the roadmap</p>
            <p className="text-sm text-muted-foreground">
              The backend API for {title.toLowerCase()} is ready — the
              management UI lands here next.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
