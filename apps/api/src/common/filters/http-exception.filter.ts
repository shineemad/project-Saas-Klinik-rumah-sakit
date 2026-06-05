import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorBody: Record<string, unknown>;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        errorBody = exceptionResponse as Record<string, unknown>;
      } else {
        errorBody = { code: "HTTP_ERROR", message: exceptionResponse };
      }
    } else {
      const incidentId = `inc_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
      this.logger.error(`Unhandled exception [${incidentId}]`, exception);

      errorBody = {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan sistem. Tim kami sudah diberitahu.",
        incident_id: incidentId,
      };
    }

    response.status(status).json({
      success: false,
      error: errorBody,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
