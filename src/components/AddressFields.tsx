import React from 'react';
import { View } from 'react-native';
import { Field } from './ui';

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
}

/**
 * The address block from onboarding frame 8: street, apt, city + state on one
 * row, then ZIP. All on one screen so autofill can do its job.
 */
export function AddressFields({
  value,
  onChange,
}: {
  value: Address;
  onChange: (patch: Partial<Address>) => void;
}) {
  return (
    <>
      <Field
        placeholder="Street address"
        value={value.line1}
        onChangeText={(t) => onChange({ line1: t })}
        autoComplete="street-address"
        textContentType="streetAddressLine1"
        accessibilityLabel="Street address"
      />
      <Field
        placeholder="Apt, unit (optional)"
        value={value.line2}
        onChangeText={(t) => onChange({ line2: t })}
        textContentType="streetAddressLine2"
        accessibilityLabel="Apartment or unit"
      />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 2 }}>
          <Field
            placeholder="City"
            value={value.city}
            onChangeText={(t) => onChange({ city: t })}
            textContentType="addressCity"
            accessibilityLabel="City"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            placeholder="State"
            value={value.state}
            onChangeText={(t) => onChange({ state: t.toUpperCase().slice(0, 2) })}
            autoCapitalize="characters"
            textContentType="addressState"
            accessibilityLabel="State"
          />
        </View>
      </View>
      <Field
        placeholder="ZIP code"
        value={value.postal_code}
        onChangeText={(t) => onChange({ postal_code: t.replace(/\D/g, '').slice(0, 5) })}
        keyboardType="number-pad"
        textContentType="postalCode"
        accessibilityLabel="ZIP code"
      />
    </>
  );
}

export function addressComplete(a: Address): boolean {
  return (
    a.line1.trim().length > 0 &&
    a.city.trim().length > 0 &&
    a.state.trim().length === 2 &&
    a.postal_code.trim().length === 5
  );
}
