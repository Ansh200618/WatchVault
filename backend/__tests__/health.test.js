const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  it('should return OK status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});

describe('WatchVault API', () => {
  beforeEach(async () => {
    await request(app).post('/api/test/reset');
  });

  it('returns configured API status without exposing secrets', async () => {
    const response = await request(app).get('/api/status');

    expect(response.status).toBe(200);
    expect(response.body.apis).toEqual(
      expect.objectContaining({
        TMDB: expect.any(String),
        OMDb: expect.any(String),
        AniList: 'public',
        Jikan: 'public',
        Watchmode: expect.any(String),
      })
    );
    expect(JSON.stringify(response.body)).not.toMatch(/apikey|token/i);
  });

  it('serves popular media and detail responses', async () => {
    const popular = await request(app).get('/api/media/popular');

    expect(popular.status).toBe(200);
    expect(popular.body.length).toBeGreaterThan(0);

    const detail = await request(app).get(`/api/media/${popular.body[0].id}`);

    expect(detail.status).toBe(200);
    expect(detail.body.id).toBe(popular.body[0].id);
  });

  it('searches media', async () => {
    const response = await request(app).get('/api/media/search?q=batman');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('updates library items and recalculates stats from saved progress', async () => {
    const popular = await request(app).get('/api/media/popular?kind=movie');
    const mediaId = popular.body[0].id;

    const added = await request(app)
      .post('/api/user/library')
      .send({ mediaId, progressPercent: 0, status: 'plan' });

    expect(added.status).toBe(201);

    const response = await request(app)
      .patch(`/api/user/library/${mediaId}`)
      .send({ progressPercent: 100, status: 'completed' });

    expect(response.status).toBe(200);
    expect(response.body.data.progressPercent).toBe(100);

    const stats = await request(app).get('/api/user/stats');

    expect(stats.status).toBe(200);
    expect(stats.body.moviesWatched).toBeGreaterThanOrEqual(1);
    expect(stats.body.completionRatePercent).toBe(100);
  });
});
