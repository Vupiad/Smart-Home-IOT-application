import { StyleSheet } from "react-native";

import { theme } from "../../theme";

export const sharedCardTokens = {
  cardRadius: theme.radius.md,
  cardPaddingVertical: 16,
  cardPaddingHorizontal: 14,
  cardBackground: theme.colors.white,
  cardShadowColor: "#000",
  cardShadowOpacity: 0.06,
  cardShadowRadius: 8,
  cardShadowOffset: { width: 0, height: 2 },
  cardElevation: 2,
  iconBoxSize: 56,
  iconBoxRadius: 12,
  iconBoxBackground: "#F5F5F5",
  titleColor: theme.colors.headerBlue,
  titleInactiveColor: "#333",
  subtitleColor: "#999",
  titleFontSize: 13,
  subtitleFontSize: 11,
  switchScale: 0.8,
  activeBorderWidth: 2,
  activeBorderColor: theme.colors.headerBlue,
};

export const sharedCardStyles = StyleSheet.create({
  cardBase: {
    backgroundColor: sharedCardTokens.cardBackground,
    borderRadius: sharedCardTokens.cardRadius,
    paddingVertical: sharedCardTokens.cardPaddingVertical,
    paddingHorizontal: sharedCardTokens.cardPaddingHorizontal,
    alignItems: "center",
    shadowColor: sharedCardTokens.cardShadowColor,
    shadowOffset: sharedCardTokens.cardShadowOffset,
    shadowOpacity: sharedCardTokens.cardShadowOpacity,
    shadowRadius: sharedCardTokens.cardShadowRadius,
    elevation: sharedCardTokens.cardElevation,
  },
  cardActive: {
    borderWidth: sharedCardTokens.activeBorderWidth,
    borderColor: sharedCardTokens.activeBorderColor,
  },
  iconBox: {
    width: sharedCardTokens.iconBoxSize,
    height: sharedCardTokens.iconBoxSize,
    borderRadius: sharedCardTokens.iconBoxRadius,
    backgroundColor: sharedCardTokens.iconBoxBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: sharedCardTokens.titleFontSize,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: sharedCardTokens.subtitleFontSize,
    color: sharedCardTokens.subtitleColor,
    marginBottom: 4,
  },
  switch: {
    transform: [{ scaleX: sharedCardTokens.switchScale }, { scaleY: sharedCardTokens.switchScale }],
  },
});
