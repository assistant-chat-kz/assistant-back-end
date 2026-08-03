import { AudienceSource } from '@prisma/client';

export function classifyAudienceSource(email?: string): AudienceSource {
  if (!email) return AudienceSource.OTHER;

  const configuredDomains = process.env.KAZAKHTELECOM_EMAIL_DOMAINS;
  const domains = (configuredDomains || 'telecom.kz')
    .split(',')
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
  const emailDomain = email.trim().toLowerCase().split('@').pop();

  return emailDomain && domains.includes(emailDomain)
    ? AudienceSource.KAZAKHTELECOM
    : AudienceSource.OTHER;
}
