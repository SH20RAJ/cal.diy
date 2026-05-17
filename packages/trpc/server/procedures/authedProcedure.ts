import { checkRateLimitAndThrowError } from "@calcom/lib/checkRateLimitAndThrowError";
import type { RateLimitHelper } from "@calcom/lib/rateLimit";
import { TRPCError } from "@trpc/server";

import { errorConversionMiddleware } from "../middlewares/errorConversionMiddleware";
import perfMiddleware from "../middlewares/perfMiddleware";
import { isAdminMiddleware, isAuthed, isOrgAdminMiddleware } from "../middlewares/sessionMiddleware";
import { middleware, procedure } from "../trpc";
import publicProcedure from "./publicProcedure";

// Rate limiting middleware for sensitive endpoints (e.g., auth, email verification, AI).
// Apply via authedRateLimitedProcedure({ rateLimitingType, identifier }) on endpoints that need protection.
const isRateLimitedByUserIdMiddleware = ({ rateLimitingType = "core", identifier }: Pick<RateLimitHelper, "rateLimitingType" | "identifier">) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    await checkRateLimitAndThrowError({
      rateLimitingType,
      identifier: identifier ?? ctx.user.id.toString(),
    });

    return next({ ctx: { user: ctx.user, session: ctx.session } });
  });

const authedProcedure = procedure.use(perfMiddleware).use(errorConversionMiddleware).use(isAuthed);

/**
 * Creates a rate-limited authenticated procedure. Use on sensitive endpoints
 * such as authentication flows, email operations, and AI features.
 *
 * @example
 * const mySensitiveProcedure = authedRateLimitedProcedure({ rateLimitingType: "core" });
 */
export const authedRateLimitedProcedure = (opts: Pick<RateLimitHelper, "rateLimitingType" | "identifier">) =>
  authedProcedure.use(isRateLimitedByUserIdMiddleware(opts));

export const authedAdminProcedure = publicProcedure.use(isAdminMiddleware);
export const authedOrgAdminProcedure = publicProcedure.use(isOrgAdminMiddleware);

export default authedProcedure;
