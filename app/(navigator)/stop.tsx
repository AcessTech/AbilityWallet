import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Plain, Screen, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';

/**
 * Offboarding: she stops being a Navigator.
 * The account stays open and keeps working; only her part ends.
 */
export default function StopBeingNavigator() {
  const router = useRouter();
  const { activeLink, otherFirstName, refresh } = useSession();
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title={`Stop being ${otherFirstName}'s Navigator?`} />
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>{otherFirstName}'s account stays open, and their card keeps working.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>You will not see their money any more, and limits you agreed on end.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>{otherFirstName} is told, and can ask someone else any time.</Plain>
      </Card>
      <Btn
        label="Stop"
        kind="red"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await supabase
            .from('member_navigator')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', activeLink!.link_id);
          await refresh();
          setBusy(false);
          router.replace('/(navigator)/(tabs)/account');
        }}
      />
      <Btn label="Never mind" kind="grey" onPress={() => router.back()} />
    </Screen>
  );
}
