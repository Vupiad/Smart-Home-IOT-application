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
    error: "#FF3B30",
    success: "#34C759",
    grayLighter: "#F9FAFC",
    grayLight: "#F0F2F5",
    grayMedium: "#D1D5DB",
    cardBg: "#F6F7FA",
    border: "#E8ECF2",
    black: "#000000",
    primaryLight: "rgba(45, 91, 255, 0.1)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg2: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  layout: {
    pagePaddingX: 20,
    sectionGap: 24,
    contentGap: 12,
    cardGap: 12,
    titleSubtitleGap: 8,
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
