/**
 * A readable password the trainer can dictate over the phone — no ambiguous
 * characters, and it clears the API's eight-character minimum.
 *
 * Shared by the add-client wizard and the password reset dialog so both hand
 * out values of the same shape.
 */
export function suggestPassword(): string {
  const words = ['Squat', 'Bench', 'Press', 'Lunge', 'Plank', 'Rowing', 'Sprint'];
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return `${words[bytes[0] % words.length]}${100 + (bytes[1] % 900)}`;
}
