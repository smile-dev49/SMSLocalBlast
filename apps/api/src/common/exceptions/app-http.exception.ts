import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from '../constants/http.constants';

export class AppHttpException extends HttpException {
  constructor(
    public readonly errorCode: ApiErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super(
      {
        errorCode,
        message,
        details,
      },
      status,
    );
  }
}
