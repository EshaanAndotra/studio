export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  loginCount?: number;
  createdAt: string;
  lastLogin?: string;
  adminNotes?: string;
};
