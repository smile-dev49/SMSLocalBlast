import { MessageStateService } from './message-state.service';
import { MessageInvalidStateException } from './exceptions/messages.exceptions';

describe('MessageStateService', () => {
  const service = new MessageStateService();

  it('allows valid transitions', () => {
    expect(service.canTransition('READY', 'QUEUED')).toBe(true);
    expect(service.canTransition('QUEUED', 'DISPATCHING')).toBe(true);
    expect(service.canTransition('SENT', 'DELIVERED')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(() => {
      service.assertTransition('DELIVERED', 'READY');
    }).toThrow(MessageInvalidStateException);
    expect(() => {
      service.assertTransition('READY', 'DELIVERED');
    }).toThrow(MessageInvalidStateException);
  });
});
