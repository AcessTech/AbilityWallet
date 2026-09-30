import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ask, Logo, Strip, YesNo } from '../components/ui';
import { initials, money, tileColor } from '../lib/format';
import { MemberHome, useAnswerCard, useDismissNotice } from '../data/hooks';

/**
 * The single card slot at the top of the Member's Home.
 *
 * At most ONE card asks for an answer at a time. Buttons are always static —
 * Yes / No, or Yes / Not now on the sentinel card. Context lives in the card
 * text, never in the button labels.
 *
 * A notice never competes with a question for the slot: it renders as a slim
 * strip above it.
 */
export function HomeCardSlot({ home }: { home: MemberHome }) {
  const router = useRouter();
  const answer = useAnswerCard();
  const dismiss = useDismissNotice();
  const [answered, setAnswered] = useState<string | null>(null);

  const card = home.card;
  const notice = home.notice;

  return (
    <>
      {notice ? (
        <Strip
          text={notice.headline}
          onPress={() => {
            dismiss.mutate(notice.id);
            router.push({ pathname: '/(member)/notice/[id]', params: { id: notice.id } });
          }}
        />
      ) : null}

      {card && answered !== card.id ? (
        <Ask
          logo={
            card.merchant ? (
              <Logo text={initials(card.merchant)} bg={tileColor(card.merchant)} size={44} />
            ) : undefined
          }
          headline={card.headline}
          body={card.body}
        >
          <YesNo
            busy={answer.isPending}
            yesLabel={
              card.cls === 'SENTINEL' && card.suggested_amount
                ? `Move ${money(card.suggested_amount, { cents: false })}`
                : 'Yes'
            }
            noLabel={card.cls === 'SENTINEL' ? 'Not now' : 'No'}
            onYes={() => {
              // Answering one question must not spring the next one on the
              // same view: the queue moves on at the next Home visit.
              setAnswered(card.id);
              answer.mutate({ cardId: card.id, yes: true }, {
                onSuccess: (r) => routeAfterAnswer(router, card, r, true),
              });
            }}
            onNo={() => {
              if (card.cls === 'ABLE_ANSWER') {
                // "No" opens the category picker; the question stays until
                // it is answered (compliance).
                router.push({ pathname: '/(member)/categorize/[id]', params: { id: card.id } });
                return;
              }
              setAnswered(card.id);
              answer.mutate({ cardId: card.id, yes: false });
            }}
          />
        </Ask>
      ) : null}
      <View />
    </>
  );
}

function routeAfterAnswer(
  router: ReturnType<typeof useRouter>,
  card: NonNullable<MemberHome['card']>,
  result: Record<string, unknown>,
  yes: boolean,
) {
  if (!yes) return;

  // No double-confirm after a decision-card Yes: tapping Yes executed it, so
  // the success screen is the confirmation.
  if (card.cls === 'QDE_OFFER' && result.reimbursed) {
    router.push({
      pathname: '/(member)/done/qde',
      params: { amount: String(result.amount ?? ''), merchant: card.merchant ?? '' },
    });
  } else if (card.cls === 'SENTINEL' && card.kind === 'SSI_SWEEP' && result.moved) {
    router.push({ pathname: '/(member)/done/moved', params: { amount: String(result.amount ?? '') } });
  } else if (card.cls === 'CONSENT') {
    router.push({ pathname: '/(member)/done/consent', params: { kind: String(card.kind ?? '') } });
  }
}
