import { Button, Card, Dropdown, Option, Text } from '@fluentui/react-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { templatesApi } from '@/features/templates/api/templates-api';
import { useWorkbookSnapshot } from '@/features/workbook/hooks/use-workbook-snapshot';

export function TemplatesScreen(): JSX.Element {
  const { snapshot, refresh } = useWorkbookSnapshot();
  const [templateId, setTemplateId] = useState('');
  const [rowIndex, setRowIndex] = useState(0);

  const templates = useQuery({ queryKey: ['templates'], queryFn: templatesApi.list });
  const selectedTemplate = useMemo(
    () => templates.data?.items.find((t) => t.id === templateId),
    [templateId, templates.data?.items],
  );

  const previewMutation = useMutation({
    mutationFn: () =>
      templatesApi.renderPreview({
        body: selectedTemplate?.body ?? '',
        mergeFields: snapshot?.rows[rowIndex] ?? {},
        missingVariableStrategy: 'empty',
      }),
  });

  return (
    <Card>
      <Text size={500} weight="semibold">
        Template Preview from Worksheet Row
      </Text>
      <Button
        onClick={() => {
          void refresh();
        }}
      >
        Refresh Worksheet
      </Button>
      <Dropdown
        selectedOptions={templateId ? [templateId] : []}
        onOptionSelect={(_, d) => {
          setTemplateId(d.optionValue ?? '');
        }}
      >
        {(templates.data?.items ?? []).map((t) => (
          <Option key={t.id} value={t.id}>
            {t.name}
          </Option>
        ))}
      </Dropdown>
      <Dropdown
        selectedOptions={[String(rowIndex)]}
        onOptionSelect={(_, d) => {
          setRowIndex(Number(d.optionValue ?? '0'));
        }}
      >
        {(snapshot?.rows ?? []).slice(0, 20).map((_, i) => (
          <Option key={`row-${String(i)}`} value={String(i)}>
            Row {i + 1}
          </Option>
        ))}
      </Dropdown>
      <Button
        appearance="primary"
        onClick={() => {
          previewMutation.mutate();
        }}
        disabled={!selectedTemplate}
      >
        Preview Render
      </Button>
      {previewMutation.data ? (
        <Card>
          <Text>Rendered: {previewMutation.data.renderedText}</Text>
          <Text>Length: {String(previewMutation.data.messageLength)}</Text>
          <Text>Estimated segments: {String(previewMutation.data.estimatedSegments)}</Text>
          <Text>
            Missing variables: {previewMutation.data.missingVariables.join(', ') || 'none'}
          </Text>
        </Card>
      ) : null}
    </Card>
  );
}
