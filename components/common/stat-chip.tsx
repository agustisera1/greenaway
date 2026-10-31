import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/shared/utils";

export function StatChip({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      data-slot="stat-chip"
      variant="outline"
      className={cn("h-6 gap-1 px-2 text-xs tabular-nums [&>svg]:size-3.5!", className)}
    >
      {icon}
      {children}
    </Badge>
  );
}
