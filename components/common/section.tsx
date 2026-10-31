import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/shared/utils";

// `card` for presentational data; leave it off when the child owns its surface (a form, a card list).
export function Section({
  title,
  subtitle,
  card = false,
  cardSize = "default",
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  card?: boolean;
  cardSize?: "default" | "sm";
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-slot="section" className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-heading font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {card ? (
        <Card size={cardSize}>
          <CardContent>{children}</CardContent>
        </Card>
      ) : (
        children
      )}
    </div>
  );
}
