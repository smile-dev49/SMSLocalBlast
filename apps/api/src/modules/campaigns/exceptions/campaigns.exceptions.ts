import { HttpStatus } from '@nestjs/common';
import { ApiErrorCodes } from '../../../common/constants/http.constants';
import { AppHttpException } from '../../../common/exceptions/app-http.exception';

export class CampaignNotFoundException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.NOT_FOUND, 'Campaign not found', HttpStatus.NOT_FOUND);
  }
}

export class CampaignAccessDeniedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.FORBIDDEN, 'Campaign access denied', HttpStatus.FORBIDDEN);
  }
}

export class CampaignValidationException extends AppHttpException {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCodes.BAD_REQUEST, message, HttpStatus.BAD_REQUEST, details);
  }
}

export class CampaignInvalidStateException extends AppHttpException {
  constructor(message: string) {
    super(ApiErrorCodes.CONFLICT, message, HttpStatus.CONFLICT);
  }
}

export class CampaignTargetNotFoundException extends AppHttpException {
  constructor(message = 'Contact or contact list not found for this organization') {
    super(ApiErrorCodes.BAD_REQUEST, message, HttpStatus.BAD_REQUEST);
  }
}
