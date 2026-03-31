import { Button, Card, Field, Input, Switch, Text } from '@fluentui/react-components';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { contactsApi } from '@/features/contacts/api/contacts-api';
import { ColumnMappingForm } from '@/features/contacts/components/column-mapping-form';
import { useWorkbookSnapshot } from '@/features/workbook/hooks/use-workbook-snapshot';
import { mapRowsForContactImport } from '@/features/workbook/services/mapping-utils';
import type { ContactFieldMapping } from '@/features/workbook/types/workbook.types';

export function ContactsImportScreen(): JSX.Element {
  const { snapshot, refresh } = useWorkbookSnapshot();
  const [mapping, setMapping] = useState<ContactFieldMapping>({ customFields: [] });
  const [listName, setListName] = useState('');
  const [dedupe, setDedupe] = useState(true);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);

  const mappedRows = useMemo(
    () => mapRowsForContactImport(snapshot?.rows ?? [], mapping),
    [mapping, snapshot?.rows],
  );

  const mappingPayload = {
    ...(mapping.firstName ? { firstName: mapping.firstName } : {}),
    ...(mapping.lastName ? { lastName: mapping.lastName } : {}),
    ...(mapping.fullName ? { fullName: mapping.fullName } : {}),
    ...(mapping.email ? { email: mapping.email } : {}),
    phoneNumber: mapping.phoneNumber ?? 'phoneNumber',
    customFields: mapping.customFields.map((f) => ({
      fieldKey: f.key,
      sourceColumn: f.column,
    })),
  };

  const importOptions = {
    deduplicateByPhone: dedupe,
    skipInvalidRows: skipInvalid,
    updateExisting,
    ...(listName ? { createListName: listName } : {}),
  };

  const previewMutation = useMutation({
    mutationFn: () =>
      contactsApi.importPreview({
        sourceType: 'EXCEL_ADDIN',
        rows: mappedRows,
        mapping: mappingPayload,
        options: importOptions,
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      contactsApi.importConfirm({
        sourceType: 'EXCEL_ADDIN',
        rows: mappedRows,
        mapping: mappingPayload,
        options: importOptions,
      }),
  });

  return (
    <Card>
      <Text size={500} weight="semibold">
        Contacts Import (Excel)
      </Text>
      <Button
        onClick={() => {
          void refresh();
        }}
      >
        Load worksheet rows
      </Button>
      <Text>Rows loaded: {snapshot?.rows.length ?? 0}</Text>
      <ColumnMappingForm headers={snapshot?.headers ?? []} onChange={setMapping} />
      <Field label="Create list name (optional)">
        <Input
          value={listName}
          onChange={(_, d) => {
            setListName(d.value);
          }}
        />
      </Field>
      <Switch
        checked={dedupe}
        onChange={(_, d) => {
          setDedupe(d.checked);
        }}
        label="Deduplicate by phone"
      />
      <Switch
        checked={skipInvalid}
        onChange={(_, d) => {
          setSkipInvalid(d.checked);
        }}
        label="Skip invalid rows"
      />
      <Switch
        checked={updateExisting}
        onChange={(_, d) => {
          setUpdateExisting(d.checked);
        }}
        label="Update existing contacts"
      />
      <Button
        appearance="primary"
        onClick={() => {
          previewMutation.mutate();
        }}
      >
        Preview Import
      </Button>
      {previewMutation.data ? (
        <Card>
          <Text>Total rows: {previewMutation.data.totalRows}</Text>
          <Text>Valid rows: {previewMutation.data.validRows}</Text>
          <Text>Invalid rows: {previewMutation.data.invalidRows}</Text>
          <Text>Duplicates: {previewMutation.data.duplicateRows}</Text>
          <Text>Existing matches: {previewMutation.data.existingMatches}</Text>
          <Button
            onClick={() => {
              confirmMutation.mutate();
            }}
            appearance="primary"
          >
            Confirm Import
          </Button>
        </Card>
      ) : null}
      {previewMutation.error ? <Text>{previewMutation.error.message}</Text> : null}
      {confirmMutation.isSuccess ? <Text>Import confirmed successfully.</Text> : null}
    </Card>
  );
}
