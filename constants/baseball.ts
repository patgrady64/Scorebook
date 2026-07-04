export const TEAM_AWAY = 'AWAY' as const;
export const TEAM_HOME = 'HOME' as const;

export const DEFAULT_TEAM = TEAM_AWAY;

export const DEFAULT_MAX_INNINGS = 9;

export const DEFAULT_LINEUP = (prefix: string) =>
  Array.from({ length: 9 }, (_, i) => ({
    spot: i + 1,
    name: `${prefix} ${i + 1}`,
  }));
