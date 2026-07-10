export const groupKeys = {
  all: ["groups"] as const,
  detail: (id: string) => ["groups", id] as const,
  contacts: (id: string) => ["groups", id, "contacts"] as const,
};
