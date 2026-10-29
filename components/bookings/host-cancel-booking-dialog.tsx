"use client";

import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/field";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelBooking } from "@/lib/bookings/actions";
import { hostCancelReasonSchema } from "@/lib/bookings/validation";

type HostCancelValues = z.infer<typeof hostCancelReasonSchema>;

// Amber tint over a `ghost` Button: the host's cancel, kept apart from Reject's red.
export const warningButtonClass =
  "bg-warning/10 text-warning hover:bg-warning/20 hover:text-warning dark:bg-warning/20 dark:hover:bg-warning/30";

// Not `ConfirmDialog`: the host must give the guest a reason, so it carries a form.
export function HostCancelBookingDialog({
  bookingId,
  trigger,
  description,
}: {
  bookingId: string;
  trigger: ReactElement;
  description: string;
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HostCancelValues>({
    resolver: zodResolver(hostCancelReasonSchema),
    defaultValues: { reason: "" },
  });

  async function onSubmit(data: HostCancelValues) {
    const result = await cancelBooking({ bookingId, reason: data.reason });

    if (!result.ok) {
      toast.error(result.error);
      throw new Error(result.error);
    }

    setOpen(false);
    reset();
    toast.success("Booking cancelled");
  }

  const fieldId = `cancel-reason-${bookingId}`;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />

      <AlertDialogContent size="sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>

          <FormField
            className="py-2"
            htmlFor={fieldId}
            label="Reason"
            error={errors.reason?.message}
          >
            <Textarea
              id={fieldId}
              rows={3}
              placeholder="Let the guest know why…"
              className="resize-none"
              {...register("reason")}
            />
          </FormField>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={isSubmitting}>
              Keep booking
            </AlertDialogCancel>
            <Button
              type="submit"
              variant="ghost"
              className={warningButtonClass}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling…" : "Yes, cancel"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
