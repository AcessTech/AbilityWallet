import React from 'react';
import { useRouter } from 'expo-router';
import { DocumentList } from '../../../src/features/DocumentList';
import { MEMBER_PILL } from '../../../src/lib/pills';

export default function Screen_() {
  const router = useRouter();
  return (
    <DocumentList
      title="Benefit reports"
      emptyText="Reports for Social Security show up here."
      pillLabel={MEMBER_PILL}
      onPillPress={() => router.push('/(member)/chat')}
    />
  );
}
