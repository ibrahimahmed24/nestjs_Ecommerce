import { User } from '@prisma/client';

export type AuthenticatedUser = Pick<
  User,
  'id' | 'email' | 'firstName' | 'lastName' | 'role'
>;
