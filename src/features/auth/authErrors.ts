/** Friendly versions of common Supabase auth errors. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials'))
    return 'That email and password don’t match. Check them and try again.';
  if (m.includes('email not confirmed'))
    return 'Please confirm your email first. Check your inbox for the link we sent.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'An account with this email already exists. Try logging in instead.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('password should be')) return 'Choose a stronger password: at least 8 characters.';
  if (m.includes('database error saving new user'))
    return 'Sign-up isn’t available for this email. Check the school’s sign-up rules or ask your school admin.';
  if (m.includes('failed to fetch'))
    return 'Can’t reach the server. Check your internet connection.';
  return message;
}
