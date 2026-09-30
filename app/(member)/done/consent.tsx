import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Success } from '../../../src/features/Success';

/** Success screen after answering a consent or a support-level change. */
export default function ConsentDone() {
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind: string }>();

  const copy =
    kind === 'LEVEL_UP'
      ? { title: 'All set', detail: 'The change you agreed to is on now.' }
      : kind === 'BLOCK_ADD'
        ? { title: 'Blocked', detail: 'That shop will stop working with your card.' }
        : kind === 'BLOCK_REMOVE'
          ? { title: 'Unblocked', detail: 'That shop works with your card again.' }
          : { title: 'Limit changed', detail: 'The new amount is in place.' };

  return <Success {...copy} onDone={() => router.replace('/(member)/(tabs)/home')} />;
}
