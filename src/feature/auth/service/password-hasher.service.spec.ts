
import { EnvService } from '../../../common/config/env.service';
import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  const envService = {
    passwordArgon2MemoryCost: 19456,
    passwordArgon2TimeCost: 2,
    passwordArgon2Parallelism: 1,
  } as EnvService;

  const service = new PasswordHasherService(envService);

  it('transforme un mot de passe en hash Argon2id', async () => {
    const hash = await service.hash('MonMotDePasse12345');

    expect(hash).toContain('$argon2id$');
  });

  it('accepte le bon mot de passe', async () => {
    const password = 'MonMotDePasse12345';
    const hash = await service.hash(password);

    expect(await service.verify(hash, password)).toBe(true);
  });

  it('refuse un mauvais mot de passe', async () => {
    const hash = await service.hash('MonMotDePasse12345');

    expect(await service.verify(hash, 'MauvaisMotDePasse')).toBe(false);
  });

  it('refuse un mot de passe vérifié contre le hash factice', async () => {
    expect(await service.verifyAgainstDummy('MotDePasseInconnu')).toBe(false);
  });
});
