import { HttpStatus } from '@nestjs/common';
import { AppHttpException } from '../../../common/exceptions/app-http.exception';
import { ApiErrorCodes } from '../../../common/constants/http.constants';

export class InvalidCredentialsException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password', HttpStatus.UNAUTHORIZED);
  }
}

export class EmailAlreadyExistsException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.EMAIL_ALREADY_EXISTS, 'Email is already in use', HttpStatus.CONFLICT);
  }
}

export class OrganizationSlugAlreadyExistsException extends AppHttpException {
  constructor() {
    super(
      ApiErrorCodes.ORGANIZATION_SLUG_ALREADY_EXISTS,
      'Organization slug is already in use',
      HttpStatus.CONFLICT,
    );
  }
}

export class MultipleOrganizationsRequiredException extends AppHttpException {
  constructor() {
    super(
      ApiErrorCodes.MULTIPLE_ORGANIZATIONS_REQUIRED,
      'Multiple active organizations found. Please specify organizationSlug.',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MembershipInactiveException extends AppHttpException {
  constructor() {
    super(
      ApiErrorCodes.MEMBERSHIP_INACTIVE,
      'Membership is not active for the requested organization',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class SessionNotFoundException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.SESSION_NOT_FOUND, 'Session not found', HttpStatus.UNAUTHORIZED);
  }
}

export class SessionAccessDeniedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.SESSION_ACCESS_DENIED, 'Session access denied', HttpStatus.FORBIDDEN);
  }
}

export class UserSuspendedException extends AppHttpException {
  constructor() {
    super(ApiErrorCodes.INVALID_CREDENTIALS, 'User is suspended', HttpStatus.UNAUTHORIZED);
  }
}
