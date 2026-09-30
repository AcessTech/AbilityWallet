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
      title="Tax forms"
      emptyText="Tax forms appear here in January."
      pillLabel={navigatorPill(otherFirstName)}
      onPillPress={() => router.push('/(navigator)/chat')}
    />
  );
}
