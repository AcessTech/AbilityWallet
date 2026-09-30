import React from 'react';
import { useRouter } from 'expo-router';
import { Success } from '../../src/features/Success';
import { useSession } from '../../src/lib/session';

/** Prototype screen `alex/ask_sent` — "Ask sent". */
export default function AskSent() {
  const router = useRouter();
  const { otherFirstName } = useSession();
  return (
    <Success
      title="Asked"
      detail={`${otherFirstName} will see it. You'll know when they answer.`}
      onDone={() => router.replace('/(member)/(tabs)/account')}
    />
  );
}
