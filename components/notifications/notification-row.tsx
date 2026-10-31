import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/shared/utils";
import { formatDate } from "@/lib/shared/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  notificationHref,
  notificationVisual,
  type Notification,
} from "./notifications-model";

export function NotificationRow({
  notification,
  read,
  onMarkAsRead,
}: {
  notification: Notification;
  read: boolean;
  onMarkAsRead: () => void;
}) {
  const { icon: Icon, accent } = notificationVisual(notification.title);

  return (
    <li
      className={cn(
        "relative flex items-start gap-4 rounded-xl border border-border p-4 transition-shadow hover:shadow-lg",
        !read && "bg-card",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5",
          accent,
        )}
      >
        <Icon />
      </span>

      <div className="min-w-0 flex-1">
        {/* The ::after stretches the link over the whole card; the button sits above it. */}
        <Link
          href={notificationHref(notification)}
          className="block font-medium leading-snug text-pretty after:absolute after:inset-0 after:rounded-xl"
        >
          {notification.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
          {notification.body}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {formatDate(new Date(notification.created_at))}
        </p>
      </div>

      {read ? (
        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="size-3.5" />
          Read
        </span>
      ) : (
        <div className="relative z-10 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={onMarkAsRead}
                >
                  <Check />
                  <span className="sr-only">Mark as read</span>
                </Button>
              }
            />
            <TooltipContent variant="dark">Mark as read</TooltipContent>
          </Tooltip>
          <Badge className="shrink-0">New</Badge>
        </div>
      )}
    </li>
  );
}
