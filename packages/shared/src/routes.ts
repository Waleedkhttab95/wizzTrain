/**
 * Every route is served under `/{API_PREFIX}/v1` (default: `/api/v1`).
 * Keep this file as the single source of truth shared by the API and the web app.
 */
export const API_VERSION = '1';

export const ApiRoutes = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  clients: {
    list: '/clients',
    create: '/clients',
    byId: (id: string) => `/clients/${id}`,
    programs: (id: string) => `/clients/${id}/programs`,
    nutritionPlan: (id: string) => `/clients/${id}/nutrition-plan`,
    dailyLogs: (id: string) => `/clients/${id}/daily-logs`,
    weeklySummary: (id: string) => `/clients/${id}/weekly-summary`,
  },
  programs: {
    active: '/programs/active',
    byId: (id: string) => `/programs/${id}`,
    days: (id: string) => `/programs/${id}/days`,
  },
  templates: {
    list: '/templates',
    create: '/templates',
    byId: (id: string) => `/templates/${id}`,
  },
  days: {
    byId: (id: string) => `/days/${id}`,
    exercises: (id: string) => `/days/${id}/exercises`,
  },
  exercises: {
    byId: (id: string) => `/exercises/${id}`,
    logs: (id: string) => `/exercises/${id}/logs`,
  },
  nutrition: {
    active: '/nutrition-plan/active',
  },
  dailyLogs: {
    upsert: '/daily-logs',
    mine: '/daily-logs/me',
  },
  me: {
    profile: '/me',
  },
  health: '/health',
} as const;
