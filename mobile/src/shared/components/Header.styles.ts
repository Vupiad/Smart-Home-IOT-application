import { StyleSheet } from "react-native";

import { theme } from "../../theme";

export const headerIconTokens = {
  weatherSize: 18,
  humiditySize: 18,
  dateSize: 18,
  illustrationSize: 10,
  weatherColor: theme.colors.weatherIcon,
  humidityColor: theme.colors.humidityIcon,
  dateColor: theme.colors.dateIcon,
  illustrationColor: "#2EE7FF",
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.headerBlue,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
  },
  card: {
    backgroundColor: theme.colors.headerBlue,
    height: 250,
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: "relative",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  gridLineHorizontalTop: {
    position: "absolute",
    left: -10,
    right: -10,
    top: 170,
    borderTopWidth: 1,
    borderTopColor: theme.colors.headerGrid,
  },
  gridLineHorizontalBottom: {
    position: "absolute",
    left: -10,
    right: -10,
    top: 230,
    borderTopWidth: 1,
    borderTopColor: theme.colors.headerGrid,
  },
  gridLineVerticalLeft: {
    position: "absolute",
    top: 138,
    bottom: -30,
    left: 105,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.headerGrid,
  },
  gridLineVerticalRight: {
    position: "absolute",
    top: 138,
    bottom: -30,
    left: 235,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.headerGrid,
  },
  topRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    flex: 1,
    paddingRight: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: theme.colors.white,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "600",
  },
  avatarButton: {
    width: 50,
    height: 50,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
    backgroundColor: "#A2B9FF",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  tabName: {
    marginTop: 35,
    color: theme.colors.white,
    fontSize: 35,
    lineHeight: 42,
    fontWeight: "700",
  },
  illustrationWrap: {
    marginTop: -25,
    alignItems: "flex-end",
  },
  illustrationPanel: {
    width: 250,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(47,231,255,0.45)",
    backgroundColor: "rgba(10,27,122,0.35)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-15deg" }],
  },
  illustrationText: {
    marginTop: 4,
    color: "#2EE7FF",
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
});

export default styles;
