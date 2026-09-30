import React from 'react';
import { useRouter } from 'expo-router';
import { Avatar, Card, Muted, Row, Screen, Section, SubHeader, Title } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';
import { MEMBER_PILL } from '../../src/lib/pills';

/**
 * Prototype screen `alex/nav_detail` — who is on my account.
 * His side never shows a level name or number: only what the person can do,
 * in plain words (brief §2 rule 1).
 */
export default function NavigatorDetail() {
  const router = useRouter();
  const { activeLink, otherFirstName } = useSession();
  const nav = activeLink?.navigator;
  const level = activeLink?.level ?? 1;

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />

      <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Avatar letter={(otherFirstName || '?').slice(0, 1).toUpperCase()} size={72} />
        <Title title={otherFirstName} sub={nav?.email ?? ''} />
      </Card>

      <Section>What {otherFirstName} can see</Section>
      <Card style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <Muted>{whatTheyCanSee(level, otherFirstName)}</Muted>
      </Card>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row name={`Message ${otherFirstName}`} chevron onPress={() => router.push('/(member)/chat')} />
        <Row name="What we agreed" chevron onPress={() => router.push('/(member)/agreements')} />
        <Row name="Ask to change something" chevron last onPress={() => router.push('/(member)/ask-change')} />
      </Card>

      <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
        <Row
          name={`Take ${otherFirstName} off my account`}
          danger
          last
          onPress={() => router.push('/(member)/remove-navigator')}
        />
      </Card>
    </Screen>
  );
}

function whatTheyCanSee(level: number, name: string): string {
  const who = name || 'They';
  switch (level) {
    case 1:
      return `${who} can send you messages. ${who} cannot see your money.`;
    case 2:
      return `${who} can see your balances and what you spend, and gets a note when something happens.`;
    case 3:
      return `${who} can see your balances and what you spend. You set amounts together, and ${who} gets a note if you go over one.`;
    case 4:
      return `${who} can see your balances and what you spend. You set amounts together, and a purchase over one of them will not go through.`;
    case 5:
      return `${who} looks after the money that comes from Social Security, and can see everything on the account.`;
    default:
      return '';
  }
}
