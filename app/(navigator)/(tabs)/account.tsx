import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Avatar, BrandHeader, Card, Empty, Row, Screen, Section,
} from '../../../src/components/ui';
import { useSession } from '../../../src/lib/session';
import { color, font } from '../../../src/theme/tokens';
import { LEVEL_NAMES } from '../../../src/features/LevelBar';
import { IS_TEST_BUILD } from '../../../src/lib/testBuild';

/**
 * Navigator Account tab: her profile card
 * -> People I support -> Documents -> Settings -> Support -> Sign out.
 */
export default function NavigatorAccount() {
  const router = useRouter();
  const { profile, links, otherFirstName, setActiveMemberId, activeMemberId } = useSession();
  const people = links.filter((l) => l.status !== 'ended');

  return (
    <Screen>
      <BrandHeader
        pillLabel={otherFirstName ? `Message ${otherFirstName}` : 'Message'}
        onPillPress={() => router.push('/(navigator)/chat')}
      />

      <Card onPress={() => router.push('/(navigator)/my-info')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar letter={(profile?.first_name ?? '?').slice(0, 1).toUpperCase()} size={54} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontFamily: font.black, fontSize: 19, color: color.ink }}>
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text style={{ fontFamily: font.semibold, fontSize: 14, color: color.soft, marginTop: 2 }}>
              {profile?.email}
            </Text>
          </View>
        </View>
      </Card>

      <Section first>People I support</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        {people.length === 0 ? (
          <Empty text="Nobody yet." icon="user" />
        ) : (
          people.map((l) => (
            <Row
              key={l.link_id}
              name={
                l.member
                  ? `${l.member.first_name} ${l.member.last_name}`.trim()
                  : (l.invite_email ?? 'Invited')
              }
              sub={
                l.status === 'invited'
                  ? 'Invite sent — waiting'
                  : `Level ${l.level} — ${LEVEL_NAMES[l.level - 1]}`
              }
              chevron
              onPress={() => {
                if (l.member) setActiveMemberId(l.member.id);
                router.push({ pathname: '/(navigator)/person/[id]', params: { id: l.link_id } });
              }}
              right={
                l.member?.id === activeMemberId ? (
                  <Text style={{ fontFamily: font.extrabold, fontSize: 13, color: color.green }}>Showing</Text>
                ) : null
              }
            />
          ))
        )}
        <Row name="Add someone" chevron last onPress={() => router.push('/(navigator)/add-someone')} />
      </Card>

      <Section>Documents</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Statements" chevron onPress={() => router.push('/(navigator)/documents/statements')} />
        <Row name="Benefit reports" chevron onPress={() => router.push('/(navigator)/documents/benefits')} />
        <Row name="Tax forms" chevron onPress={() => router.push('/(navigator)/documents/tax')} />
        <Row name="Saved documents" chevron last onPress={() => router.push('/(navigator)/documents/saved')} />
      </Card>

      <Section>Settings</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Linked bank" chevron onPress={() => router.push('/(navigator)/settings/linked-bank')} />
        <Row name="Add bank account" chevron onPress={() => router.push('/(navigator)/settings/add-bank')} />
        <Row name="Notifications" chevron onPress={() => router.push('/(navigator)/notifications')} />
        <Row name="Subscription" chevron onPress={() => router.push('/(navigator)/settings/billing')} />
        <Row name="Security" chevron last onPress={() => router.push('/(navigator)/settings/security')} />
      </Card>

      <Section>Support</Section>
      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Help center" chevron onPress={() => router.push('/(navigator)/support/help')} />
        <Row name="Contact us" chevron onPress={() => router.push('/(navigator)/support/contact')} />
        <Row name="Legal and privacy" chevron last onPress={() => router.push('/(navigator)/support/legal')} />
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
              onPress={() => router.push('/(navigator)/test-tools')}
            />
          </Card>
        </>
      ) : null}

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name="Sign out" danger last onPress={() => router.push('/(navigator)/sign-out')} />
      </Card>
    </Screen>
  );
}
