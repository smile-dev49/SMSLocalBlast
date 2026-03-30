import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  async hashPassword(plain: string): Promise<string> {
    // Production defaults: long enough to resist offline cracking.
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 19456, // ~19 MiB
      timeCost: 3,
      parallelism: 1,
    });
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
