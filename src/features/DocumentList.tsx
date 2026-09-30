import React from 'react';
import { useRouter } from 'expo-router';
import { Card, Empty, Screen, SubHeader, Title } from '../components/ui';

/**
 * Statements, tax forms and benefit reports all render the same way: a list of
 * documents, empty until the account has been open long enough to have any.
 * Used on both the Member and Navigator sides.
 */
export function DocumentList({
  title,
  sub,
  emptyText,
  pillLabel,
  onPillPress,
}: {
  title: string;
  sub?: string;
  emptyText: string;
  pillLabel: string;
  onPillPress: () => void;
}) {
  return (
    <Screen>
      <SubHeader pillLabel={pillLabel} onPillPress={onPillPress} />
      <Title title={title} sub={sub} />
      <Card>
        <Empty text={emptyText} icon="file" />
      </Card>
    </Screen>
  );
}
