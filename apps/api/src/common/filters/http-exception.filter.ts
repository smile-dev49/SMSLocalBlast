import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { ApiErrorCodes, type ApiErrorCode } from '../constants/http.constants';
import type { ApiFailureResponse } from '../types/api-response.types';
import { AppHttpException } from '../exceptions/app-http.exception';

interface RequestWithRequestId {
  readonly headers?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithRequestId>();
    const headerValue = req.headers?.['x-request-id'];
    const requestId =
      typeof headerValue === 'string' && headerValue.length > 0 ? headerValue : 'unknown';

    if (exception instanceof ZodError) {
      const body: ApiFailureResponse = {
        success: false,
        error: {
          code: ApiErrorCodes.VALIDATION_FAILED,
          message: 'Validation failed',
          details: exception.flatten(),
        },
        meta: { requestId },
      };
      response.status(HttpStatus.BAD_REQUEST).json(body);
      return;
    }

    if (exception instanceof AppHttpException) {
      const status = exception.getStatus();
      const body: ApiFailureResponse = {
        success: false,
        error: {
          code: exception.errorCode,
          message: exception.message,
          details: exception.details,
        },
        meta: { requestId },
      };
      response.status(status).json(body);
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { code, meta } = exception;
      let status = HttpStatus.BAD_REQUEST;
      let errorCode: ApiErrorCode = ApiErrorCodes.PRISMA_ERROR;
      let message = 'Database error';

      if (code === 'P2002') {
        status = HttpStatus.CONFLICT;
        errorCode = ApiErrorCodes.CONFLICT;
        message = 'Unique constraint violation';
      } else if (code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        errorCode = ApiErrorCodes.NOT_FOUND;
        message = 'Record not found';
      }

      const body: ApiFailureResponse = {
        success: false,
        error: {
          code: errorCode,
          message,
          details: { prismaCode: code, meta: meta as unknown },
        },
        meta: { requestId },
      };
      response.status(status).json(body);
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      const body: ApiFailureResponse = {
        success: false,
        error: {
          code: ApiErrorCodes.PRISMA_ERROR,
          message: 'Database validation error',
        },
        meta: { requestId },
      };
      response.status(HttpStatus.BAD_REQUEST).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = httpExceptionMessage(exception, res);

      const body: ApiFailureResponse = {
        success: false,
        error: {
          code: mapHttpStatusToCode(status),
          message,
          details: httpExceptionDetails(res),
        },
        meta: { requestId },
      };
      response.status(status).json(body);
      return;
    }

    const body: ApiFailureResponse = {
      success: false,
      error: {
        code: ApiErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error',
      },
      meta: { requestId },
    };
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}

function mapHttpStatusToCode(status: number): string {
  switch (status) {
    case 401:
      return ApiErrorCodes.UNAUTHORIZED;
    case 403:
      return ApiErrorCodes.FORBIDDEN;
    case 404:
      return ApiErrorCodes.NOT_FOUND;
    case 409:
      return ApiErrorCodes.CONFLICT;
    case 400:
      return ApiErrorCodes.BAD_REQUEST;
    default:
      return ApiErrorCodes.INTERNAL_ERROR;
  }
}

function httpExceptionMessage(exception: HttpException, res: string | object): string {
  if (typeof res === 'string') {
    return res;
  }
  if ('message' in res) {
    const raw = (res as { message: unknown }).message;
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw)) return raw.map((x) => String(x)).join(', ');
  }
  return exception.message;
}

function httpExceptionDetails(res: string | object): unknown {
  if (typeof res === 'string') {
    return undefined;
  }
  return res;
}
