import { AudienceSource } from '@prisma/client';
import { classifyAudienceSource } from './audience-source';

describe('classifyAudienceSource', () => {
  const originalDomains = process.env.KAZAKHTELECOM_EMAIL_DOMAINS;

  afterEach(() => {
    if (originalDomains === undefined) {
      delete process.env.KAZAKHTELECOM_EMAIL_DOMAINS;
    } else {
      process.env.KAZAKHTELECOM_EMAIL_DOMAINS = originalDomains;
    }
  });

  it('classifies telecom.kz addresses as Kazakhtelecom', () => {
    expect(classifyAudienceSource('Person@Telecom.kz')).toBe(
      AudienceSource.KAZAKHTELECOM,
    );
  });

  it('classifies other addresses separately', () => {
    expect(classifyAudienceSource('person@example.kz')).toBe(
      AudienceSource.OTHER,
    );
  });

  it('supports additional configured corporate domains', () => {
    process.env.KAZAKHTELECOM_EMAIL_DOMAINS = 'telecom.kz,corp.example.kz';
    expect(classifyAudienceSource('person@corp.example.kz')).toBe(
      AudienceSource.KAZAKHTELECOM,
    );
  });
});
