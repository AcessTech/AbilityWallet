import React from 'react';
import { useRouter } from 'expo-router';
import { Success } from '../../src/features/Success';
import { useSession } from '../../src/lib/session';

/**
 * Prototype screen `maria/n_waiting` — "Waiting on Alex".
 * A consent pending on his screen shows as a waiting state on hers
 * (Appendix A §4.2).
 */
export default function Waiting() {
  const router = useRouter();
  const { otherFirstName } = useSession();
  return (
    <Success
      title={`Asked ${otherFirstName}`}
      detail={`Nothing changes until ${otherFirstName} says OK. You'll know when they answer.`}
      onDone={() => router.replace('/(navigator)/(tabs)/plan')}
    />
  );
}
