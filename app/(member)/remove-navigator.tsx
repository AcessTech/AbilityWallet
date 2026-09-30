import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Plain, Screen, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Remove a Navigator.
 * Taking someone off the account is a decrease in oversight, so it is his
 * right and needs nobody's approval.
 */
export default function RemoveNavigator() {
  const router = useRouter();
  const { activeLink, otherFirstName, refresh } = useSession();
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title={`Take ${otherFirstName} off my account?`} />
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>{otherFirstName} will not see your money any more.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>Amounts you set together stop applying.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>Your card keeps working. You can ask someone else any time.</Plain>
      </Card>
      <Btn
        label={`Take ${otherFirstName} off`}
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
          router.replace('/(member)/(tabs)/account');
        }}
      />
      <Btn label="Never mind" kind="grey" onPress={() => router.back()} />
    </Screen>
  );
}
