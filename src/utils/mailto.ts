interface MailtoOptions {
  to: string;
  className?: string;
  topic?: string;
  body?: string;
}

export function buildMailto({ to, className, topic, body }: MailtoOptions): string {
  const subject = [className, topic].filter(Boolean).join(' — ');
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  // URLSearchParams encodes spaces as "+", which some mail clients show literally.
  const query = params.toString().replace(/\+/g, '%20');
  return `mailto:${to}${query ? `?${query}` : ''}`;
}
