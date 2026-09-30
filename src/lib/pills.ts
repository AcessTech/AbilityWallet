/**
 * The action pill in every header.
 * The Member's says "Need help?"; the Navigator's says "Message {first name}".
 */
export const MEMBER_PILL = 'Need help?';

export function navigatorPill(firstName: string): string {
  return firstName ? `Message ${firstName}` : 'Message';
}
