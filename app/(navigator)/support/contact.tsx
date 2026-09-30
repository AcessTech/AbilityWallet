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
      title="Contact us"
      emptyText="Support hours and a phone number will live here."
      pillLabel={navigatorPill(otherFirstName)}
      onPillPress={() => router.push('/(navigator)/chat')}
    />
  );
}
