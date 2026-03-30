import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants/auth.constants';

export const Permissions = (...permissions: string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, permissions);
