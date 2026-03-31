import { Button, Dropdown, Field, Input, Option, Text } from '@fluentui/react-components';
import { useState } from 'react';

import type { ContactFieldMapping } from '@/features/workbook/types/workbook.types';

interface Props {
  headers: string[];
  onChange: (mapping: ContactFieldMapping) => void;
}

export function ColumnMappingForm({ headers, onChange }: Props): JSX.Element {
  const [mapping, setMapping] = useState<ContactFieldMapping>({ customFields: [] });
  const [customKey, setCustomKey] = useState('');
  const [customColumn, setCustomColumn] = useState('');

  const updateMapping = (next: ContactFieldMapping) => {
    setMapping(next);
    onChange(next);
  };

  return (
    <>
      <Text weight="semibold">Column Mapping</Text>
      {(['firstName', 'lastName', 'fullName', 'phoneNumber', 'email'] as const).map((field) => (
        <Field key={field} label={field}>
          <Dropdown
            selectedOptions={mapping[field] ? [mapping[field]] : []}
            onOptionSelect={(_, data) => { updateMapping({ ...mapping, [field]: data.optionValue }); }}
          >
            {headers.map((h) => (
              <Option key={h} value={h}>
                {h}
              </Option>
            ))}
          </Dropdown>
        </Field>
      ))}
      <Field label="Custom field key">
        <Input value={customKey} onChange={(_, d) => { setCustomKey(d.value); }} />
      </Field>
      <Field label="Custom field source column">
        <Dropdown
          selectedOptions={customColumn ? [customColumn] : []}
          onOptionSelect={(_, data) => { setCustomColumn(data.optionValue ?? ''); }}
        >
          {headers.map((h) => (
            <Option key={h} value={h}>
              {h}
            </Option>
          ))}
        </Dropdown>
      </Field>
      <Button
        onClick={() => {
          if (!customKey || !customColumn) return;
          updateMapping({
            ...mapping,
            customFields: [...mapping.customFields, { key: customKey, column: customColumn }],
          });
          setCustomKey('');
          setCustomColumn('');
        }}
      >
        Add custom mapping
      </Button>
      {mapping.customFields.map((cf) => (
        <Text key={`${cf.key}:${cf.column}`}>
          {cf.key} ← {cf.column}
        </Text>
      ))}
    </>
  );
}
