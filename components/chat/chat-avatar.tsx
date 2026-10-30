import { InitialsAvatar } from "@/components/common/initials-avatar";
import type { Counterpart } from "./types";

export function ChatAvatar({
  counterpart,
  size,
}: {
  counterpart: Counterpart;
  size: "sm" | "md";
}) {
  return <InitialsAvatar initials={counterpart.initials} size={size} />;
}
