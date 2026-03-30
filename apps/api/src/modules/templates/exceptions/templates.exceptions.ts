import { HttpStatus } from '@nestjs/common';
import { ApiErrorCodes } from '../../../common/constants/http.constants';
import { AppHttpException } from '../../../common/exceptions/app-http.exception';

export class TemplateNotFoundException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.NOT_FOUND, 'Template not found', HttpStatus.NOT_FOUND);
  }
}

export class TemplateAccessDeniedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.FORBIDDEN, 'Template access denied', HttpStatus.FORBIDDEN);
  }
}

export class TemplateValidationException extends AppHttpException {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCodes.BAD_REQUEST, message, HttpStatus.BAD_REQUEST, details);
  }
}
