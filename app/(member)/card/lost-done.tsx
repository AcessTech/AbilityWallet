import React from 'react';
import { useRouter } from 'expo-router';
import { Success } from '../../../src/features/Success';

/** "Card canceled" confirmation. */
export default function CardReported() {
  const router = useRouter();
  return (
    <Success
      title="Card canceled"
      detail="A new card is on the way. It usually takes about a week."
      onDone={() => router.replace('/(member)/(tabs)/card')}
    />
  );
}
