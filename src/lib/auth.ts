export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  loginCount?: number;
  createdAt: string;
};

// IMPORTANT: This is mock data for demonstration purposes.
// In a real application, this data would come from a secure database
// and passwords would be hashed.
export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@mhealth.com',
    password: 'adminpassword',
    role: 'admin',
    loginCount: 15,
    createdAt: '2023-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    password: 'userpassword',
    role: 'user',
    loginCount: 5,
    createdAt: '2023-02-20T14:30:00Z',
  },
  {
    id: '3',
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'userpassword',
    role: 'user',
    loginCount: 22,
    createdAt: '2023-03-10T09:00:00Z',
  },
    {
    id: '4',
    name: 'Emily White',
    email: 'emily.white@example.com',
    password: 'userpassword',
    role: 'user',
    loginCount: 2,
    createdAt: '2024-05-01T11:45:00Z',
  },
    {
    id: '5',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    password: 'userpassword',
    role: 'user',
    loginCount: 8,
    createdAt: '2024-04-18T18:20:00Z',
  },
];
