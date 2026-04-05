import React from "react";
import { Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sharedCardStyles, sharedCardTokens } from "../styles/deviceCards";

interface SceneModeCardProps {
  name: string;
  icon: string;
  iconColor: string;
  isActive: boolean;
  onToggle?: (value: boolean) => void;
}

const SceneModeCard: React.FC<SceneModeCardProps> = ({
  name,
  icon,
  iconColor,
  isActive,
  onToggle,
}) => {
  const handleToggle = (value: boolean) => {
    onToggle?.(value);
  };

  return (
    <TouchableOpacity
      style={[sharedCardStyles.cardBase, styles.card, isActive && sharedCardStyles.cardActive]}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={40} color={iconColor} />
      <Text style={styles.name}>{name}</Text>
      <Switch
        value={isActive}
        onValueChange={handleToggle}
        trackColor={{ false: "#E0E0E0", true: "#3B82F6" }}
        thumbColor="#FFFFFF"
        style={sharedCardStyles.switch}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
    width: "30%",
  },
  name: {
    fontSize: sharedCardTokens.subtitleFontSize,
    fontWeight: "600",
    color: sharedCardTokens.titleInactiveColor,
    marginTop: 8,
    marginBottom: 6,
  },
});

export default SceneModeCard;
