import { parsePersistedTarget, toPersistedTargetJson } from './campaign-target.util';

describe('campaign-target.util', () => {
  it('parses persisted target JSON', () => {
    expect(
      parsePersistedTarget({
        contactIds: ['a'],
        contactListIds: ['b'],
      }),
    ).toEqual({ contactIds: ['a'], contactListIds: ['b'] });
  });

  it('falls back to empty when invalid', () => {
    expect(parsePersistedTarget(null)).toEqual({
      contactIds: [],
      contactListIds: [],
    });
  });

  it('serializes for Prisma JSON', () => {
    expect(toPersistedTargetJson({ contactIds: ['x'], contactListIds: ['y'] })).toEqual({
      contactIds: ['x'],
      contactListIds: ['y'],
    });
  });
});
