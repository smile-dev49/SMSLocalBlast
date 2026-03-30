import { Injectable } from '@nestjs/common';
import { InvalidContactInputException } from './exceptions/contacts.exceptions';

export interface NormalizedContactInput {
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly fullName: string | null;
  readonly phoneNumber: string;
  readonly normalizedPhoneNumber: string;
  readonly email: string | null;
  readonly notes: string | null;
}

@Injectable()
export class ContactsNormalizationService {
  normalizePhoneNumber(raw: string): {
    readonly phoneNumber: string;
    readonly normalizedPhoneNumber: string;
  } {
    const phoneNumber = raw.trim();
    if (phoneNumber.length < 3) {
      throw new InvalidContactInputException('Invalid phone number');
    }

    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    if (normalized.startsWith('00')) {
      normalized = `+${normalized.slice(2)}`;
    }
    if (!normalized.startsWith('+')) {
      normalized = normalized.replace(/[^\d]/g, '');
    } else {
      normalized = `+${normalized.slice(1).replace(/[^\d]/g, '')}`;
    }

    const digitsOnly = normalized.startsWith('+') ? normalized.slice(1) : normalized;
    if (!/^\d{7,15}$/.test(digitsOnly)) {
      throw new InvalidContactInputException('Invalid phone number format');
    }

    return { phoneNumber, normalizedPhoneNumber: normalized };
  }

  normalizeEmail(raw?: string | null): string | null {
    if (raw === undefined || raw === null) return null;
    const email = raw.trim().toLowerCase();
    if (email.length === 0) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new InvalidContactInputException('Invalid email address');
    }
    return email;
  }

  normalizeNames(args: {
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly fullName?: string | null;
  }): {
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly fullName: string | null;
  } {
    const firstName = args.firstName?.trim() ?? null;
    const lastName = args.lastName?.trim() ?? null;
    const explicitFullName = args.fullName?.trim() ?? null;
    const combinedName = [firstName, lastName]
      .filter((v): v is string => v !== null)
      .join(' ')
      .trim();
    const computedFullName = explicitFullName ?? (combinedName.length > 0 ? combinedName : null);

    return {
      firstName,
      lastName,
      fullName: computedFullName,
    };
  }

  normalizeContact(args: {
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly fullName?: string | null;
    readonly phoneNumber: string;
    readonly email?: string | null;
    readonly notes?: string | null;
  }): NormalizedContactInput {
    const names = this.normalizeNames(args);
    const phone = this.normalizePhoneNumber(args.phoneNumber);
    const email = this.normalizeEmail(args.email);
    const notes = args.notes?.trim() ?? null;

    return {
      ...names,
      phoneNumber: phone.phoneNumber,
      normalizedPhoneNumber: phone.normalizedPhoneNumber,
      email,
      notes,
    };
  }
}
