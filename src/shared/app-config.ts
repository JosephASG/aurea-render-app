export type AppTheme = 'dark' | 'light'

export type AppConfig = {
  theme: AppTheme
}

export const defaultAppConfig: AppConfig = {
  theme: 'dark'
}

export function normalizeAppConfig(value: unknown): AppConfig {
  if (!value || typeof value !== 'object') {
    return defaultAppConfig
  }

  const theme = (value as Partial<AppConfig>).theme

  return {
    theme: theme === 'light' ? 'light' : 'dark'
  }
}
