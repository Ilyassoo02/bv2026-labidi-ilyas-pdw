
 // Je définis les informations d'un utilisateur authentifié.
export type AuthContext = {
  accountId: string;
  sessionId: string;
  tokenId: string;
};

// Je définis les informations d'une session authentifiée.
export type AuthenticatedSession = {
  accountId: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
};
