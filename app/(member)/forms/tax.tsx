import React from 'react';
import { useRouter } from 'expo-router';
import { DocumentList } from '../../../src/features/DocumentList';
import { MEMBER_PILL } from '../../../src/lib/pills';

export default function Screen_() {
  const router = useRouter();
  return (
    <DocumentList
      title="Tax forms"
      emptyText="Tax forms show up here in January."
      pillLabel={MEMBER_PILL}
      onPillPress={() => router.push('/(member)/chat')}
    />
  );
}
