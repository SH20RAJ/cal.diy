import { extractUserContext } from "@/lib/extract-user-context";
import { filterReqHeaders } from "@/lib/filterReqHeaders";
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Request } from "express";

import { ERROR_STATUS } from "@calcom/platform-constants";
import { Response } from "@calcom/platform-types";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  private readonly logger = new Logger("HttpExceptionFilter");

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const requestId = request.headers["X-Request-Id"] ?? "unknown-request-id";
    response.setHeader("X-Request-Id", requestId.toString());
    const userContext = extractUserContext(request);
    this.logger.error(`Http Exception Filter: ${exception?.message}`, {
      exception,
      body: request.body,
      headers: filterReqHeaders(request.headers),
      url: request.url,
      method: request.method,
      requestId,
      ...userContext,
    });

    // In production, don't expose internal exception details to clients
    const errorDetails = IS_PRODUCTION ? undefined : exception.getResponse();

    response.status(statusCode).json({
      status: ERROR_STATUS,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: { code: exception.name, message: exception.message, details: errorDetails },
    });
  }
}
