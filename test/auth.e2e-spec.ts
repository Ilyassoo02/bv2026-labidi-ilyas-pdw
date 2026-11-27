import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { configureApplication } from '@common/api/configure-application';
import { AppModule } from '@root/app.module';

// Je récupère les cookies sans utiliser de type any.
function getCookies(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter(
      (cookie: unknown): cookie is string => typeof cookie === 'string',
    );
  }

  return [];
}

// Je récupère l'identifiant du compte dans une réponse API.
function getAccountId(body: unknown): string {
  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new Error('Réponse API invalide');
  }

  const data = body.data;

  if (
    typeof data !== 'object' ||
    data === null ||
    !('accountId' in data) ||
    typeof data.accountId !== 'string'
  ) {
    throw new Error('Identifiant du compte absent');
  }

  return data.accountId;
}

// Je vérifie les routes d'authentification de mon API.
describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = moduleFixture.createNestApplication();

    await configureApplication(app);
    await app.init();

    // Je récupère le serveur avec son type HTTP.
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  // Test 1 : je refuse une inscription avec un e-mail incorrect.
  it('refuse une inscription avec un e-mail invalide', async () => {
    const response = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email: 'email-invalide',
        password: 'MonMotDePasseSecurise123!',
      })
      .expect(422);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      code: 'api.common.validation-error',
      result: false,
    });
  });

  // Test 2 : je refuse une connexion avec un e-mail incorrect.
  it('refuse une connexion avec un e-mail invalide', async () => {
    const response = await request(httpServer)
      .post('/api/auth/login')
      .send({
        email: 'email-invalide',
        password: 'MonMotDePasseSecurise123!',
      })
      .expect(422);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      code: 'api.common.validation-error',
      result: false,
    });
  });

  // Test 3 : je vérifie que le refresh token est obligatoire.
  it('refuse un refresh sans jeton', async () => {
    const response = await request(httpServer)
      .post('/api/auth/refresh')
      .expect(401);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      code: 'api.auth.refresh-invalid',
      result: false,
    });
  });

  // Test 4 : je refuse une déconnexion sans authentification.
  it('refuse une déconnexion sans connexion', async () => {
    const response = await request(httpServer)
      .post('/api/auth/logout')
      .expect(401);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      code: 'api.auth.unauthorized',
      result: false,
    });
  });

  // Test 5 : je protège la déconnexion de toutes les sessions.
  it('refuse logout-all sans connexion', async () => {
    const response = await request(httpServer)
      .post('/api/auth/logout-all')
      .expect(401);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      code: 'api.auth.unauthorized',
      result: false,
    });
  });

  // Test 6 : je vérifie qu'un utilisateur peut créer un compte.
  it('crée un compte avec un e-mail et un mot de passe valides', async () => {
    const email = `test-${randomUUID()}@example.com`;

    const response = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email,
        password: 'MonMotDePassePourLesTests2026!',
      })
      .expect(201);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      result: true,
      data: {
        email,
        emailVerified: false,
      },
    });

    expect(getAccountId(body)).toEqual(expect.any(String));
  });

  // Test 7 : je vérifie qu'un utilisateur peut se connecter.
  it('connecte un utilisateur avec un e-mail et un mot de passe valides', async () => {
    const email = `connexion-${randomUUID()}@example.com`;
    const password = 'MonMotDePassePourLesTests2026!';

    // Je crée d'abord un compte.
    const registration = await request(httpServer)
      .post('/api/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    const registrationBody: unknown = registration.body;
    const accountId = getAccountId(registrationBody);

    // Je me connecte avec les mêmes identifiants.
    const response = await request(httpServer)
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      result: true,
      data: {
        accountId,
        email,
        authenticated: true,
      },
    });

    // Je vérifie les cookies de connexion.
    const rawCookies: unknown = response.headers['set-cookie'];

    const cookies = getCookies(rawCookies);

    expect(cookies.length).toBeGreaterThanOrEqual(3);

    expect(cookies.some((cookie) => cookie.startsWith('hoos-access='))).toBe(
      true,
    );

    expect(cookies.some((cookie) => cookie.startsWith('hoos-refresh='))).toBe(
      true,
    );

    expect(cookies.some((cookie) => cookie.startsWith('hoos-csrf='))).toBe(
      true,
    );
  });

  // Test 8 : je vérifie le renouvellement d'une vraie session.
  it('renouvelle un refresh token après une connexion', async () => {
    const email = `refresh-${randomUUID()}@example.com`;
    const password = 'MonMotDePassePourLesTests2026!';

    // Je conserve les cookies entre les requêtes.
    const agent = request.agent(httpServer);

    // Je crée le compte.
    const registration = await agent
      .post('/api/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    const registrationBody: unknown = registration.body;
    const accountId = getAccountId(registrationBody);

    // Je me connecte.
    const login = await agent
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    // Je récupère les cookies.
    const rawCookies: unknown = login.headers['set-cookie'];

    const cookies = getCookies(rawCookies);

    const csrfCookie = cookies.find((cookie) =>
      cookie.startsWith('hoos-csrf='),
    );

    const oldRefreshCookie = cookies.find((cookie) =>
      cookie.startsWith('hoos-refresh='),
    );

    if (!csrfCookie || !oldRefreshCookie) {
      throw new Error('Cookies de connexion absents');
    }

    // Je récupère le jeton CSRF.
    const csrfToken = decodeURIComponent(
      csrfCookie.split(';')[0].substring('hoos-csrf='.length),
    );

    // Je prépare les cookies à envoyer au serveur.
    const cookieHeader = cookies
      .map((cookie) => cookie.split(';')[0])
      .join('; ');

    // Je renouvelle le refresh token.
    const response = await agent
      .post('/api/auth/refresh')
      .set('Cookie', cookieHeader)
      .set('X-CSRF-Token', csrfToken)
      .expect(200);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      result: true,
      data: {
        accountId,
        authenticated: true,
      },
    });

    // Je vérifie que le refresh token a changé.
    const rawNewCookies: unknown = response.headers['set-cookie'];

    const newCookies = getCookies(rawNewCookies);

    const newRefreshCookie = newCookies.find((cookie) =>
      cookie.startsWith('hoos-refresh='),
    );

    if (!newRefreshCookie) {
      throw new Error('Nouveau refresh token absent');
    }

    expect(newRefreshCookie.split(';')[0]).not.toBe(
      oldRefreshCookie.split(';')[0],
    );

    // Je vérifie que mon compte reste accessible.
    const accountResponse = await agent.get('/api/account/me').expect(200);

    const accountBody: unknown = accountResponse.body;

    expect(accountBody).toMatchObject({
      result: true,
      data: {
        id: accountId,
      },
    });
  });

  // Test 9 : je vérifie qu'une déconnexion invalide la session.
  it('déconnecte un utilisateur et refuse son ancien jeton', async () => {
    const email = `logout-${randomUUID()}@example.com`;
    const password = 'MonMotDePassePourLesTests2026!';

    const agent = request.agent(httpServer);

    // Je crée un compte.
    await agent
      .post('/api/auth/register')
      .send({
        email,
        password,
      })
      .expect(201);

    // Je me connecte.
    const login = await agent
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    // Je récupère les cookies.
    const rawCookies: unknown = login.headers['set-cookie'];

    const cookies = getCookies(rawCookies);

    const accessCookie = cookies.find((cookie) =>
      cookie.startsWith('hoos-access='),
    );

    const csrfCookie = cookies.find((cookie) =>
      cookie.startsWith('hoos-csrf='),
    );

    if (!accessCookie || !csrfCookie) {
      throw new Error('Cookies de connexion absents');
    }

    const oldAccessCookie = accessCookie.split(';')[0];

    const csrfToken = decodeURIComponent(
      csrfCookie.split(';')[0].substring('hoos-csrf='.length),
    );

    // Je vérifie que mon compte est accessible.
    await agent.get('/api/account/me').expect(200);

    // Je me déconnecte.
    const logout = await agent
      .post('/api/auth/logout')
      .set('X-CSRF-Token', csrfToken)
      .expect(200);

    const logoutBody: unknown = logout.body;

    expect(logoutBody).toMatchObject({
      result: true,
    });

    // Je vérifie que l'ancien jeton ne fonctionne plus.
    const response = await request(httpServer)
      .get('/api/account/me')
      .set('Cookie', oldAccessCookie)
      .expect(401);

    const body: unknown = response.body;

    expect(body).toMatchObject({
      code: 'api.auth.unauthorized',
      result: false,
    });
  });
});
