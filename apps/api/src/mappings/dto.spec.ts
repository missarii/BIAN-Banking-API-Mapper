import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AnalyzeDto, ReviewDto } from './dto';

const checkAnalyze = (input: object) => validate(plainToInstance(AnalyzeDto, input));
const checkReview = (input: object) => validate(plainToInstance(ReviewDto, input));

describe('AnalyzeDto', () => {
  it('accepts a bare apiId (topN is optional)', async () => {
    expect(await checkAnalyze({ apiId: 'payment-api-id' })).toHaveLength(0);
  });

  it('accepts topN across the documented 1..10 range', async () => {
    for (const topN of [1, 5, 10]) {
      expect(await checkAnalyze({ apiId: 'a', topN })).toHaveLength(0);
    }
  });

  it.each([0, -1, 11])('rejects topN=%i as outside 1..10', async (topN) => {
    const errors = await checkAnalyze({ apiId: 'a', topN });
    expect(errors.map((e) => e.property)).toContain('topN');
  });

  it('rejects a non-integer topN', async () => {
    const errors = await checkAnalyze({ apiId: 'a', topN: 2.5 });
    expect(errors.map((e) => e.property)).toContain('topN');
  });

  it('rejects an empty apiId', async () => {
    const errors = await checkAnalyze({ apiId: '' });
    expect(errors.map((e) => e.property)).toContain('apiId');
  });
});

describe('ReviewDto', () => {
  it('accepts an ACCEPT decision with a comment', async () => {
    expect(
      await checkReview({
        apiId: 'a',
        serviceDomainId: 'b',
        decision: 'ACCEPT',
        comment: 'Verified against the payments landscape.',
      }),
    ).toHaveLength(0);
  });

  it.each(['ACCEPT', 'REJECT', 'CHANGE'] as const)(
    'accepts the supported decision %s',
    async (decision) => {
      expect(await checkReview({ apiId: 'a', serviceDomainId: 'b', decision })).toHaveLength(0);
    },
  );

  // Guards the coercion bug: MappingsService treats anything that is not
  // REJECT as an acceptance, so an unknown decision must never reach it.
  it.each(['MAYBE', 'accepted', 'FOO', ''])(
    'rejects the unsupported decision %p',
    async (decision) => {
      const errors = await checkReview({ apiId: 'a', serviceDomainId: 'b', decision });
      expect(errors.map((e) => e.property)).toContain('decision');
    },
  );

  it('requires apiId, serviceDomainId and decision', async () => {
    const errors = await checkReview({});
    expect(errors.map((e) => e.property).sort()).toEqual([
      'apiId',
      'decision',
      'serviceDomainId',
    ]);
  });

  it('treats comment and newServiceDomainId as optional', async () => {
    expect(
      await checkReview({ apiId: 'a', serviceDomainId: 'b', decision: 'CHANGE' }),
    ).toHaveLength(0);
  });
});