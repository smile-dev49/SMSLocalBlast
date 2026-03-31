import { HttpStatus } from '@nestjs/common';
import { ApiErrorCodes } from '../../../common/constants/http.constants';
import { AppHttpException } from '../../../common/exceptions/app-http.exception';

export class MessageNotFoundException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.NOT_FOUND, 'Message not found', HttpStatus.NOT_FOUND);
  }
}

export class MessageAccessDeniedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.FORBIDDEN, 'Message access denied', HttpStatus.FORBIDDEN);
  }
}

export class MessageInvalidStateException extends AppHttpException {
  constructor(message: string) {
    super(ApiErrorCodes.CONFLICT, message, HttpStatus.CONFLICT);
  }
}

export class DeviceGatewayUnauthorizedException extends AppHttpException {
  constructor(message = 'Invalid device gateway credentials') {
    super(ApiErrorCodes.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }
}
