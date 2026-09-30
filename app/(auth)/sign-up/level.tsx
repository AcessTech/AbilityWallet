import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardScreen } from '../../../src/components/Onboard';
import { Btn, Option } from '../../../src/components/ui';
import { LEVELS, useSignup } from '../../../src/lib/signup';

/**
 * How much support to start with.
 * She proposes; he sees the choice and consents at acceptance. Level names
 * live here and on her Plan tab only — never on his side of the app.
 */
export default function SupportLevel() {
  const router = useRouter();
  const { draft, set } = useSignup();
  const name = draft.theirFirstName.trim() || 'They';

  function pick(level: number) {
    set({ level });
    router.push(level === 5 ? '/(auth)/sign-up/fiduciary-docs' : '/(auth)/sign-up/invite');
  }

  return (
    <OnboardScreen
      question="How much support to start with?"
      sub={`${name} sees this choice and can change it with you anytime.`}
      footer={<Btn label="Continue" onPress={() => pick(draft.level)} />}
    >
      {LEVELS.map((l) => (
        <Option
          key={l.level}
          compact
          label={l.name}
          desc={l.desc.replace('{name}', name)}
          selected={draft.level === l.level}
          onPress={() => set({ level: l.level })}
        />
      ))}
    </OnboardScreen>
  );
}
