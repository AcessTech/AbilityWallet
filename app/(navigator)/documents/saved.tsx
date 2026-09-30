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
      title="Saved documents"
      emptyText="Nothing saved yet. Documents you keep show up here."
      pillLabel={navigatorPill(otherFirstName)}
      onPillPress={() => router.push('/(navigator)/chat')}
    />
  );
}
