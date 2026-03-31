import { Button, Card, Field, Input, Text } from '@fluentui/react-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { campaignsApi } from '@/features/campaigns/api/campaigns-api';
import { contactsApi } from '@/features/contacts/api/contacts-api';
import { templatesApi } from '@/features/templates/api/templates-api';

export function CampaignsScreen(): JSX.Element {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [listId, setListId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const campaigns = useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list });
  const templates = useQuery({ queryKey: ['templates'], queryFn: templatesApi.list });
  const lists = useQuery({ queryKey: ['contactLists'], queryFn: contactsApi.listContactLists });

  const previewMutation = useMutation({
    mutationFn: () =>
      campaignsApi.preview({ templateId, target: { contactListIds: listId ? [listId] : [] } }),
  });
  const createMutation = useMutation({
    mutationFn: () => {
      const body = {
        name,
        target: { contactListIds: listId ? [listId] : [] },
        ...(templateId ? { templateId } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
      };
      return campaignsApi.create(body);
    },
  });
  const createdCampaign = createMutation.data;

  return (
    <Card>
      <Text size={500} weight="semibold">
        Campaigns
      </Text>
      <Field label="Campaign name">
        <Input
          value={name}
          onChange={(_, d) => {
            setName(d.value);
          }}
        />
      </Field>
      <Field label="Template ID">
        <Input
          value={templateId}
          onChange={(_, d) => {
            setTemplateId(d.value);
          }}
          placeholder={(templates.data?.items ?? [])[0]?.id ?? ''}
        />
      </Field>
      <Field label="Contact list ID">
        <Input
          value={listId}
          onChange={(_, d) => {
            setListId(d.value);
          }}
          placeholder={(lists.data?.items ?? [])[0]?.id ?? ''}
        />
      </Field>
      <Field label="Scheduled at (ISO, optional)">
        <Input
          value={scheduledAt}
          onChange={(_, d) => {
            setScheduledAt(d.value);
          }}
        />
      </Field>
      <Button
        onClick={() => {
          previewMutation.mutate();
        }}
      >
        Preview Campaign
      </Button>
      <Button
        appearance="primary"
        onClick={() => {
          createMutation.mutate();
        }}
      >
        Create Campaign
      </Button>
      {createdCampaign ? (
        <Card>
          <Text>Created: {createdCampaign.name}</Text>
          <Text>Status: {createdCampaign.status}</Text>
          <Button
            onClick={() => {
              void campaignsApi.start(createdCampaign.id);
            }}
          >
            Start
          </Button>
          <Button
            onClick={() => {
              void campaignsApi.pause(createdCampaign.id);
            }}
          >
            Pause
          </Button>
          <Button
            onClick={() => {
              void campaignsApi.cancel(createdCampaign.id);
            }}
          >
            Cancel
          </Button>
        </Card>
      ) : null}
      <Card>
        <Text weight="semibold">Recent Campaigns</Text>
        {(campaigns.data?.items ?? []).map((c) => (
          <Text key={c.id}>
            {c.name} · {c.status} · sent {c.sentCount}/{c.recipientCount}
          </Text>
        ))}
      </Card>
    </Card>
  );
}
