import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Loading, Row, Screen, TitleHeader } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useSession } from '../../../src/lib/session';
import { color, font, radius } from '../../../src/theme/tokens';

/**
 * Member Card tab. Prototype screen `alex/card`: page title "My card", card
 * art with "Show number", then Tap to pay and Report lost or stolen.
 */
export default function MemberCard() {
  const router = useRouter();
  const { profile, activeMemberId } = useSession();
  const { data: card, isLoading } = useQuery({
    queryKey: ['member_card', activeMemberId],
    enabled: !!activeMemberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_cards')
        .select('*')
        .eq('member_id', activeMemberId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const name = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim().toUpperCase();

  return (
    <Screen>
      <TitleHeader title="My card" pillLabel="Need help?" onPillPress={() => router.push('/(member)/chat')} />

      {isLoading ? (
        <Loading />
      ) : !card ? (
        <Card>
          <Empty text="Your card is on the way. It shows here when it arrives." icon="card" />
        </Card>
      ) : (
        <>
          <View style={s.art}>
            <Text style={s.brand}>
              Ability<Text style={{ color: color.gold }}>Wallet</Text>
            </Text>
            <Text style={s.number}>{`•••• •••• •••• ${card.last4}`}</Text>
            <View style={s.artFoot}>
              <Text style={s.artName}>{name}</Text>
              <Text style={s.showNumber} onPress={() => router.push('/(member)/card/number')}>
                Show number
              </Text>
            </View>
          </View>

          {card.status === 'paused' ? (
            <Card style={{ paddingVertical: 14, paddingHorizontal: 18, backgroundColor: color.noteBg, borderWidth: 2, borderColor: color.gold }}>
              <Text style={{ fontFamily: font.semibold, fontSize: 15, color: color.ink }}>
                Your card is paused right now.
              </Text>
            </Card>
          ) : null}

          <Card style={{ paddingVertical: 6, paddingHorizontal: 20 }}>
            <Row
              icon="card"
              name="Tap to pay"
              sub="Apple Pay and Google Pay"
              chevron
              onPress={() => router.push('/(member)/card/wallet')}
            />
            <Row
              icon="ban"
              name="Report lost or stolen"
              sub="Get a new card right away"
              chevron
              last
              onPress={() => router.push('/(member)/card/lost')}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  art: {
    backgroundColor: color.navy,
    borderRadius: radius.card,
    padding: 22,
    minHeight: 200,
    marginBottom: 14,
  },
  brand: { fontFamily: font.black, fontSize: 17, color: '#fff' },
  number: { fontFamily: 'Courier New', fontSize: 19, letterSpacing: 3, marginTop: 56, color: '#fff' },
  artFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  artName: { fontSize: 14, letterSpacing: 1, color: '#fff', fontFamily: font.bold },
  showNumber: { fontSize: 13, fontFamily: font.bold, color: '#fff', opacity: 0.8 },
});
