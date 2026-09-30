import React from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Plain, Screen, SubHeader, Title } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';

/** Prototype screens `glob-06` / `maria/n_signout` — sign-out confirmation. */
export default function SignOut() {
  const router = useRouter();
  const { signOut, otherFirstName } = useSession();
  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title="Sign out?" />
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>You'll need your email and password to get back in.</Plain>
      </Card>
      <Btn
        label="Sign out"
        kind="red"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        }}
      />
      <Btn label="Stay signed in" kind="grey" onPress={() => router.back()} />
    </Screen>
  );
}
