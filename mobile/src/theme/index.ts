export const theme = {
  colors: {
    background: "#F4F7FB",
    textPrimary: "#1E2738",
    textSecondary: "#4A5364",
    headerBlue: "#2E4EE8",
    headerGrid: "#7FA4FF",
    weatherIcon: "#FFD35A",
    humidityIcon: "#4FD4FF",
    dateIcon: "#FF6C4A",
    white: "#FFFFFF",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 24,
  },
  radius: {
    md: 16,
    lg: 18,
    round: 999,
  },
  typography: {
    title: {
      fontSize: 26,
      fontWeight: "700" as const,
    },
    subtitle: {
      fontSize: 15,
      fontWeight: "400" as const,
    },
  },
};

export type AppTheme = typeof theme;
