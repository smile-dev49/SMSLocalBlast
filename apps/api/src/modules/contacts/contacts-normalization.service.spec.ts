import { ContactsNormalizationService } from './contacts-normalization.service';

describe('ContactsNormalizationService', () => {
  const svc = new ContactsNormalizationService();

  it('normalizes phone + email + fullName', () => {
    const out = svc.normalizeContact({
      firstName: '  Jane ',
      lastName: ' Doe ',
      phoneNumber: ' +1 (555) 100-2000 ',
      email: ' Jane.DOE@Example.com ',
    });
    expect(out.firstName).toBe('Jane');
    expect(out.lastName).toBe('Doe');
    expect(out.fullName).toBe('Jane Doe');
    expect(out.phoneNumber).toBe('+1 (555) 100-2000');
    expect(out.normalizedPhoneNumber).toBe('+15551002000');
    expect(out.email).toBe('jane.doe@example.com');
  });

  it('rejects invalid phone numbers', () => {
    expect(() =>
      svc.normalizeContact({
        phoneNumber: '12',
      }),
    ).toThrow('Invalid phone number');
  });
});
