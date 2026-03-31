import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from '@fluentui/react-components';

import { useWorkbookSnapshot } from '@/features/workbook/hooks/use-workbook-snapshot';

export function WorkbookScreen(): JSX.Element {
  const { snapshot, refresh, isLoading, error } = useWorkbookSnapshot();

  return (
    <Card>
      <Text size={500} weight="semibold">
        Workbook Snapshot
      </Text>
      <Button
        onClick={() => {
          void refresh();
        }}
        disabled={isLoading}
      >
        Refresh workbook snapshot
      </Button>
      {error ? <Text>{error}</Text> : null}
      {snapshot ? (
        <>
          <Text>Worksheet: {snapshot.worksheetName}</Text>
          <Text>Rows detected: {String(snapshot.rowCount)}</Text>
          <Text>Headers: {snapshot.headers.join(', ') || 'none'}</Text>
          <Table>
            <TableHeader>
              <TableRow>
                {snapshot.headers.map((h) => (
                  <TableHeaderCell key={h}>{h}</TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.rows.slice(0, 5).map((row, i) => (
                <TableRow key={`row-${String(i)}`}>
                  {snapshot.headers.map((h) => (
                    <TableCell key={`${h}-${String(i)}`}>{row[h] ?? ''}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <Text>No workbook data loaded yet.</Text>
      )}
    </Card>
  );
}
