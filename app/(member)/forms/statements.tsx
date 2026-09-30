import React from 'react';
import { useRouter } from 'expo-router';
import { DocumentList } from '../../../src/features/DocumentList';
import { MEMBER_PILL } from '../../../src/lib/pills';

export default function Screen_() {
  const router = useRouter();
  return (
    <DocumentList
      title="Statements"
      emptyText="Statements show up here at the end of each month."
      pillLabel={MEMBER_PILL}
      onPillPress={() => router.push('/(member)/chat')}
    />
  );
}
