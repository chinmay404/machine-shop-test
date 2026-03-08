const DEV_USERS = [
  {
    id: 'usr-admin',
    username: 'admin',
    password: 'admin123',
    auth_subject: 'machine-shop:admin',
    email: 'admin@machine-shop.local',
    display_name: 'System Admin',
    role: 'admin',
    first_name: 'System',
    last_name: 'Admin',
  },
  {
    id: 'usr-op1',
    username: 'op1',
    password: 'operator123',
    auth_subject: 'machine-shop:operator-1',
    email: 'op1@machine-shop.local',
    display_name: 'Machine Operator',
    role: 'operator',
    first_name: 'Machine',
    last_name: 'Operator',
  },
  {
    id: 'usr-supervisor1',
    username: 'supervisor1',
    password: 'super123',
    auth_subject: 'machine-shop:supervisor-1',
    email: 'supervisor1@machine-shop.local',
    display_name: 'Shift Supervisor',
    role: 'supervisor',
    first_name: 'Shift',
    last_name: 'Supervisor',
  },
  {
    id: 'usr-planner1',
    username: 'planner1',
    password: 'plan123',
    auth_subject: 'machine-shop:planner-1',
    email: 'planner1@machine-shop.local',
    display_name: 'Production Planner',
    role: 'planner',
    first_name: 'Production',
    last_name: 'Planner',
  },
  {
    id: 'usr-store1',
    username: 'store1',
    password: 'store123',
    auth_subject: 'machine-shop:store-1',
    email: 'store1@machine-shop.local',
    display_name: 'Kanban Store',
    role: 'store',
    first_name: 'Kanban',
    last_name: 'Store',
  },
  {
    id: 'usr-ms-test',
    username: 'ms_test',
    password: 'test123',
    auth_subject: 'machine-shop:test-user',
    email: 'machine-shop.test@example.com',
    display_name: 'Machine Shop Test User',
    role: 'manager',
    first_name: 'Machine',
    last_name: 'Shop Test',
    is_test_user: true,
  },
];

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export function authenticateDevUser(username, password) {
  const user = DEV_USERS.find((entry) => entry.username === username && entry.password === password);
  return user ? sanitizeUser(user) : null;
}

export function findDevUser(username) {
  const user = DEV_USERS.find((entry) => entry.username === username);
  return user ? sanitizeUser(user) : null;
}
