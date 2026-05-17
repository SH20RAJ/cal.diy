import { TRPCError } from "@trpc/server";

import { rateLimiter } from "@calcom/lib/rateLimit";

import { errorConversionMiddleware } from "../middlewares/errorConversionMiddleware";
import perfMiddleware from "../middlewares/perfMiddleware";
import { isAdminMiddleware, isAuthed, isOrgAdminMiddleware } from "../middlewares/sessionMiddleware";
import { middleware, procedure } from "../trpc";
import publicProcedure from "./publicProcedure";

interface IRateLimitOptions {
  intervalInMs: number;
  limit: number;
}

const isRateLimitedByUserIdMiddleware = ({ intervalInMs, limit }: IRateLimitOptions) =>
  middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const rateLimit = rateLimiter();
    const { success } = rateLimit({
      identifier: ctx.user.id.toString(),
      rateLimitingType: "common",
    });

    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }

    return next({ ctx: { user: ctx.user, session: ctx.session } });
  });

const authedProcedure = procedure.use(perfMiddleware).use(errorConversionMiddleware).use(isAuthed);

export const authedRateLimitedProcedure = ({ intervalInMs, limit }: IRateLimitOptions) =>
  authedProcedure.use(isRateLimitedByUserIdMiddleware({ intervalInMs, limit }));

export const authedAdminProcedure = publicProcedure.use(isAdminMiddleware);
export const authedOrgAdminProcedure = publicProcedure.use(isOrgAdminMiddleware);

export default authedProcedure;
