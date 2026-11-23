import { Injectable } from '@nestjs/common';
import { EnvService } from '../../../common/config/env.service';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordHasherService {
  private readonly dummyHashPromise: Promise<string>;

  constructor(private readonly envService: EnvService) {
    // Je prépare un hash factice pour les connexions avec un email inconnu.
    this.dummyHashPromise = this.hash('hoos-invalid-login-dummy');
  }

  // Je transforme un mot de passe en empreinte sécurisée.
  hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.envService.passwordArgon2MemoryCost,
      timeCost: this.envService.passwordArgon2TimeCost,
      parallelism: this.envService.passwordArgon2Parallelism,
    });
  }

  // Je vérifie si un mot de passe correspond à son empreinte.
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  // Je vérifie contre un hash factice si le compte n'existe pas.
  verifyAgainstDummy(password: string): Promise<boolean> {
    return this.dummyHashPromise.then((hash) =>
      this.verify(hash, password),
    );
  }
}
