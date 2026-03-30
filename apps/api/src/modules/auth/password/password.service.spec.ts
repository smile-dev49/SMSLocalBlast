import { PasswordService } from './password.service';

describe('PasswordService', () => {
  it('hashes and verifies passwords', async () => {
    const svc = new PasswordService();
    const password = 'StrongPassw0rdAA1!';

    const hash = await svc.hashPassword(password);
    expect(hash).not.toEqual(password);

    await expect(svc.verifyPassword(hash, password)).resolves.toBe(true);
    await expect(svc.verifyPassword(hash, 'WrongPassword123A!')).resolves.toBe(false);
  });
});
