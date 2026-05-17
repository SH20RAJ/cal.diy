import { TRPCError } from "@trpc/server";

import { prisma } from "@calcom/prisma";

import type { TSubmitRatingInputSchema } from "./submitRating.schema";

type SubmitRatingOptions = {
  input: TSubmitRatingInputSchema;
};

export const submitRatingHandler = async ({ input }: SubmitRatingOptions) => {
  const { bookingUid, rating, comment } = input;

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
      message: "Cannot rate a cancelled booking",
    });
  }

  await prisma.booking.update({
    where: {
      uid: bookingUid,
    },
    data: {
      rating: rating,
      ratingFeedback: comment,
    },
  });
};

export default submitRatingHandler;
