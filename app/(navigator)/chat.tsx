import React from 'react';
import { Chat } from '../../src/features/Chat';
import { Loading } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';

/**
 * Navigator side of the conversation. Prototype screen `maria/n_chat`.
 *
 * At Independent she gets a separate 1:1 thread and never sees the AI thread;
 * from Monitored up the Help thread is shared (brief §2 rule 5). The RLS
 * policy on chat_threads enforces which one she can read.
 */
export default function NavigatorChat() {
  const { activeMemberId, activeLink, otherFirstName } = useSession();

  if (!activeMemberId) return <Loading />;

  const level = activeLink?.level ?? 1;

  return (
    <Chat
      memberId={activeMemberId}
      threadKind={level >= 2 ? 'help' : 'navigator_private'}
      me="navigator"
      title={otherFirstName || 'Messages'}
      subtitle={level >= 2 ? `${otherFirstName} and the AI helper` : otherFirstName}
    />
  );
}
