import { Injectable } from '@nestjs/common';
import type { MessageStatus } from '@prisma/client';
import { MessageInvalidStateException } from './exceptions/messages.exceptions';

const validTransitions: ReadonlyMap<MessageStatus, readonly MessageStatus[]> = new Map([
  ['PENDING', ['READY', 'FAILED', 'CANCELLED', 'SKIPPED']],
  ['READY', ['QUEUED', 'FAILED', 'CANCELLED', 'SKIPPED']],
  ['QUEUED', ['DISPATCHING', 'FAILED', 'CANCELLED']],
  ['DISPATCHING', ['DISPATCHED', 'FAILED', 'CANCELLED']],
  ['DISPATCHED', ['SENT', 'FAILED', 'CANCELLED']],
  ['SENT', ['DELIVERED', 'FAILED', 'CANCELLED']],
  ['DELIVERED', []],
  ['FAILED', ['READY']],
  ['SKIPPED', []],
  ['CANCELLED', ['READY']],
]);

@Injectable()
export class MessageStateService {
  canTransition(from: MessageStatus, to: MessageStatus): boolean {
    return validTransitions.get(from)?.includes(to) ?? false;
  }

  assertTransition(from: MessageStatus, to: MessageStatus): void {
    if (!this.canTransition(from, to)) {
      throw new MessageInvalidStateException(`Invalid message state transition: ${from} -> ${to}`);
    }
  }

  isTerminal(status: MessageStatus): boolean {
    return ['DELIVERED', 'FAILED', 'SKIPPED', 'CANCELLED'].includes(status);
  }
}
