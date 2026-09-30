import React from 'react';
import { useRouter } from 'expo-router';
import { DocumentList } from '../../../src/features/DocumentList';
import { useSession } from '../../../src/lib/session';
import { navigatorPill } from '../../../src/lib/pills';

export default function Screen_() {
  const router = useRouter();
  const { otherFirstName } = useSession();
  return (
    <DocumentList
      title="Help center"
      emptyText="Answers to common questions will live here."
      pillLabel={navigatorPill(otherFirstName)}
      onPillPress={() => router.push('/(navigator)/chat')}
    />
  );
}
