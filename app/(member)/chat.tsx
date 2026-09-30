import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Chat } from '../../src/features/Chat';
import { Loading } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';

/**
 * Member Help chat. Prototype screens `alex/chat` and `alex/chat_report`.
 * One thread: the Navigator and the AI helper are both in it — except at
 * Independent, where the AI thread is private to the Member.
 */
export default function MemberChat() {
  const { txn, report } = useLocalSearchParams<{ txn?: string; report?: string }>();
  const { activeMemberId, activeLink, otherFirstName } = useSession();

  if (!activeMemberId) return <Loading />;

  const level = activeLink?.level ?? 1;
  const hasNavigator = !!activeLink?.navigator;

  return (
    <Chat
      memberId={activeMemberId}
      threadKind="help"
      me="member"
      title="Help"
      subtitle={
        level >= 2 && hasNavigator
          ? `${otherFirstName} and your AI helper`
          : 'Your AI helper'
      }
      attachedTxnId={txn}
      reportProblem={report === '1'}
    />
  );
}
