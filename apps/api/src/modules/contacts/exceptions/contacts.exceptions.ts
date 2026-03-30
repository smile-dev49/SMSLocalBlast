import { HttpStatus } from '@nestjs/common';
import { ApiErrorCodes } from '../../../common/constants/http.constants';
import { AppHttpException } from '../../../common/exceptions/app-http.exception';

export class ContactNotFoundException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.NOT_FOUND, 'Contact not found', HttpStatus.NOT_FOUND);
  }
}

export class ContactListNotFoundException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.NOT_FOUND, 'Contact list not found', HttpStatus.NOT_FOUND);
  }
}

export class ContactAccessDeniedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.FORBIDDEN, 'Contact access denied', HttpStatus.FORBIDDEN);
  }
}

export class ContactListAccessDeniedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.FORBIDDEN, 'Contact list access denied', HttpStatus.FORBIDDEN);
  }
}

export class InvalidContactInputException extends AppHttpException {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCodes.BAD_REQUEST, message, HttpStatus.BAD_REQUEST, details);
  }
}
