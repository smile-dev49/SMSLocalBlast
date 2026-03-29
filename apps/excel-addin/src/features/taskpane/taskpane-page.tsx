import { createOrganizationId } from '@sms-localblast/types';
import type { ReactNode } from 'react';

const SAMPLE_TENANT = createOrganizationId('org_sheet_demo');

/** Route-level placeholder — Office.js and workbook integration will load here later. */
export function TaskpanePage(): ReactNode {
  return (
    <main className="taskpane">
      <header className="taskpane__header">
        <h1>SMS LocalBlast</h1>
        <p className="taskpane__eyebrow">Task pane (dev shell)</p>
      </header>
      <section className="taskpane__body">
        <p>
          This Vite surface mirrors where the Excel Office add-in task pane will mount. Shared types
          validate tenant boundaries today — example id: <code>{SAMPLE_TENANT}</code>
        </p>
      </section>
    </main>
  );
}
