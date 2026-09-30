import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Btn, Card, Plain, Screen, SubHeader, Title } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/lib/session';
import { navigatorPill } from '../../src/lib/pills';

/** Prototype screens `maria/n_lost` and `n_lost_done`. */
export default function ReportTheirCardLost() {
  const router = useRouter();
  const { activeMemberId, otherFirstName } = useSession();
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <SubHeader pillLabel={navigatorPill(otherFirstName)} onPillPress={() => router.push('/(navigator)/chat')} />
      <Title title={`Report ${otherFirstName}'s card lost`} />
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>The card stops working right away and a new one is mailed out.</Plain>
      </Card>
      <Card style={{ paddingVertical: 18, paddingHorizontal: 20 }}>
        <Plain>{otherFirstName} is told, and payments like rent keep going.</Plain>
      </Card>
      <Btn
        label="Report it"
        kind="red"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await supabase.rpc('report_card_lost', { p_member: activeMemberId! });
          setBusy(false);
          router.replace('/(navigator)/card-replace');
        }}
      />
      <Btn label="Never mind" kind="grey" onPress={() => router.back()} />
    </Screen>
  );
}
