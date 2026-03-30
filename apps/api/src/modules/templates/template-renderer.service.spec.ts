import { TemplateRendererService } from './template-renderer.service';
import { TemplateVariableService } from './template-variable.service';

describe('TemplateRendererService', () => {
  const svc = new TemplateRendererService(new TemplateVariableService());

  it('renders strict strategy and throws on missing', () => {
    expect(() =>
      svc.render({
        body: 'Hello {{FirstName}} {{LastName}}',
        mergeFields: { FirstName: 'Jane' },
        missingVariableStrategy: 'strict',
      }),
    ).toThrow('Missing merge fields');
  });

  it('renders empty strategy and estimates segments', () => {
    const out = svc.render({
      body: 'Hello {{FirstName}} {{LastName}}',
      mergeFields: { FirstName: 'Jane' },
      missingVariableStrategy: 'empty',
    });
    expect(out.renderedText).toBe('Hello Jane ');
    expect(out.missingVariables).toEqual(['LastName']);
    expect(out.estimatedSegments).toBe(1);
  });

  it('estimates long message segments', () => {
    const text = 'a'.repeat(400);
    const meta = svc.estimateSmsSegments(text);
    expect(meta.isLongMessage).toBe(true);
    expect(meta.estimatedSegments).toBe(3);
  });
});
