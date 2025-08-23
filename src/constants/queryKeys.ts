export const QK = {
  clients: (q = '') => ['clients', q] as const,
  projects: (q = '') => ['projects', q] as const,
  tasks: (q = '') => ['tasks', q] as const,
};
