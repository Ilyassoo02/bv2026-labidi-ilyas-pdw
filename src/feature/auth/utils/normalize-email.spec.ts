import { normalizeEmail } from './normalize-email';

// Je teste la fonction seule, sans module Nest ni base de données.
describe('normalizeEmail', () => {
  it('met en minuscules une adresse avec des majuscules', () => {
    expect(normalizeEmail('Nicolas@Example.com')).toBe('nicolas@example.com');
  });

  it("retire les espaces autour de l'adresse", () => {
    expect(normalizeEmail('  ilyas@test.be  ')).toBe('ilyas@test.be');
  });

  it('ne modifie pas une adresse déjà canonique', () => {
    expect(normalizeEmail('a@b.c')).toBe('a@b.c');
  });
});
