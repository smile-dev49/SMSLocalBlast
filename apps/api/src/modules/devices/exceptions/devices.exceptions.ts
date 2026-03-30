import { HttpStatus } from '@nestjs/common';
import { AppHttpException } from '../../../common/exceptions/app-http.exception';
import { ApiErrorCodes } from '../../../common/constants/http.constants';

export class DeviceNotFoundException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.NOT_FOUND, 'Device not found', HttpStatus.NOT_FOUND, undefined);
  }
}

export class DeviceAccessDeniedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.FORBIDDEN, 'Device access denied', HttpStatus.FORBIDDEN, undefined);
  }
}
