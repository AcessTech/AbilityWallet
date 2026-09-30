import React from 'react';
import { useRouter } from 'expo-router';
import {
  Avatar, Card, Empty, Row, RowButton, Screen, Section, TitleHeader,
} from '../../../src/components/ui';
import { useSession } from '../../../src/lib/session';
import { IS_TEST_BUILD } from '../../../src/lib/testBuild';

/**
 * Member Account tab. Prototype screen `alex/account`:
 * Support (the Navigator, the AI Navigator, Add a Navigator) -> Forms ->
 * Settings. No support-level names or numbers anywhere on his side.
 */
export default function MemberAccount() {
  const router = useRouter();
  const { profile, links, otherFirstName } = useSession();
  const navigator = links.find((l) => l.status === 'active')?.navigator ?? null;
  const aiOn = profile?.ai_helper_enabled ?? false;

  return (
    <Screen>
      <TitleHeader title="Account" pillLabel="Need help?" onPillPress={() => router.push('/(member)/chat')} />

      <Section first>Support</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        {navigator ? (
          <Row
            name={navigator.first_name}
            sub="Can see my account"
            chevron
            onPress={() => router.push('/(member)/navigator')}
            right={<Avatar letter={navigator.first_name.slice(0, 1).toUpperCase()} />}
          />
        ) : (
          <Empty text="Nobody is helping with this account yet." icon="user" />
        )}

        <Row
          name="AI Navigator"
          sub="Answers questions anytime. Never moves your money."
          onPress={() => router.push('/(member)/ai-helper')}
          right={
            <>
              <Avatar icon="chat" bg="#093870" fg="#ffffff" />
              <RowButton
                label={aiOn ? 'On' : 'Turn on'}
                onPress={() => router.push('/(member)/ai-helper')}
              />
            </>
          }
        />

        <Row
          name="Add a Navigator"
          chevron
          last
          onPress={() => router.push('/(member)/add-navigator')}
        />
      </Card>

      <Section>Forms</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Statements" chevron onPress={() => router.push('/(member)/forms/statements')} />
        <Row name="Tax forms" chevron onPress={() => router.push('/(member)/forms/tax')} />
        <Row name="Benefit reports" chevron last onPress={() => router.push('/(member)/forms/benefits')} />
      </Card>

      <Section>Settings</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="How the app talks to me" chevron onPress={() => router.push('/(member)/settings/talks')} />
        <Row name="Notifications" chevron onPress={() => router.push('/(member)/settings/notifications')} />
        <Row name="My info" chevron last onPress={() => router.push('/(member)/settings/my-info')} />
      </Card>

      {IS_TEST_BUILD ? (
        <>
          <Section>Testing</Section>
          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row
              name="Testing tools"
              sub="Add money, try a story, start over"
              chevron
              last
              onPress={() => router.push('/(member)/test-tools')}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
