import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Btn, Card, Loading, Option, Screen, SubHeader, Title } from '../../../src/components/ui';
import { supabase } from '../../../src/lib/supabase';
import { useAnswerCard } from '../../../src/data/hooks';
import { MEMBER_PILL } from '../../../src/lib/pills';

/**
 * The category picker behind an ABLE question's "No".
 *
 * Member-facing words only, and only the categories that can be a qualified
 * disability expense — ten from the spine plus Funeral & burial. The QDE name
 * itself is never shown to him.
 */
export default function Categorize() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const answer = useAnswerCard();
  const [picked, setPicked] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['qde_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spine_categories')
        .select('id,member_word,sort_order')
        .not('qde', 'is', null)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  return (
    <Screen>
      <SubHeader pillLabel={MEMBER_PILL} onPillPress={() => router.push('/(member)/chat')} />
      <Title title="What was it for?" />

      {isLoading || !categories ? (
        <Loading />
      ) : (
        <>
          {categories.map((c) => (
            <Option
              key={c.id}
              label={c.member_word}
              selected={picked === c.id}
              onPress={() => setPicked(c.id)}
            />
          ))}
          <Card style={{ backgroundColor: 'transparent', marginTop: 10 }}>
            <Btn
              label="Save"
              disabled={!picked}
              busy={answer.isPending}
              onPress={() =>
                answer.mutate(
                  { cardId: id, yes: false, payload: { spine_id: picked } },
                  { onSuccess: () => router.replace('/(member)/(tabs)/home') },
                )
              }
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
