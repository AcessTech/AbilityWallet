import React from 'react';
import { useRouter } from 'expo-router';
import { Success } from '../../src/features/Success';
import { useSession } from '../../src/lib/session';

/** Prototype screens `maria/n_replace` and `n_replace_done`. */
export default function CardReplaced() {
  const router = useRouter();
  const { otherFirstName } = useSession();
  return (
    <Success
      title="Replacement ordered"
      detail={`A new card is on the way to ${otherFirstName}. It usually takes about a week.`}
      onDone={() => router.replace('/(navigator)/(tabs)/account')}
    />
  );
}
