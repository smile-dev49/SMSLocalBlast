import { TemplateVariableService } from './template-variable.service';

describe('TemplateVariableService', () => {
  const svc = new TemplateVariableService();

  it('extracts unique variables', () => {
    const vars = svc.extractVariables('Hi {{FirstName}}, balance {{Balance}} and {{FirstName}}');
    expect(vars).toEqual(['FirstName', 'Balance']);
  });

  it('detects invalid placeholders', () => {
    const out = svc.validatePlaceholders('Hi {{First Name}} and {{GoodKey}} and {{Broken');
    expect(out.isValid).toBe(false);
    expect(out.variables).toEqual(['GoodKey']);
    expect(out.invalidPlaceholders.length).toBeGreaterThan(0);
  });
});
