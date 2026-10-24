/** The two account types in the platform. Encoded in the JWT `role` claim. */
export const Role = {
  Trainer: 'trainer',
  Client: 'client',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** Shape of the decoded JWT payload issued by `POST /auth/login`. */
export interface JwtPayload {
  sub: string;
  role: Role;
}

/** The authenticated principal attached to every guarded request. */
export interface AuthenticatedUser {
  id: string;
  role: Role;
  email: string;
  name: string;
}
