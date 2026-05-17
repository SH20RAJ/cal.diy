import { TRPCError } from "@trpc/server";

import { handleMarkHostNoShow } from "@calcom/features/handleMarkNoShow";
import { prisma } from "@calcom/prisma";

import type { TNoShowInputSchema } from "./markHostAsNoShow.schema";

type NoShowOptions = {
  input: TNoShowInputSchema;
};

export const noShowHandler = async ({ input }: NoShowOptions) => {
  const { bookingUid, noShowHost } = input;

  const booking = await prisma.booking.findUnique({
    where: { uid: bookingUid },
    select: { id: true, status: true },
  });

  if (!booking) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Booking not found",
    });
  }

  if (booking.status === "CANCELLED") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot mark no-show on a cancelled booking",
    });
  }

  return handleMarkHostNoShow({
    bookingUid,
    noShowHost,
  });
};

export default noShowHandler;
