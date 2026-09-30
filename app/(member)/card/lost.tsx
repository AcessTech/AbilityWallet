import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Plain, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * Prototype screens `alex/card_lost` and `alex/card_lost_done`.
 * A5 always sends and cannot be turned off: a missing card is time-critical.
 */
export default function ReportLost() {
  const router = useRouter();
  const { activeMemberId } = useSession();
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="Report lost or stolen" />

      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>This card stops working right away and a new one is mailed to you.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>Payments you set up, like rent, keep going.</Plain>
      </Card>

      <Btn
        label="Report it"
        kind="red"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await supabase.rpc('report_card_lost', { p_member: activeMemberId! });
          setBusy(false);
          router.replace('/(member)/card/lost-done');
        }}
      />
      <Btn label="Never mind" kind="grey" onPress={() => router.back()} />
    </Screen>
  );
}
