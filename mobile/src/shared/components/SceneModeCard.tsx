import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sharedCardStyles, sharedCardTokens } from "../styles/deviceCards";

interface SceneModeCardProps {
  name: string;
  icon: string;
  iconColor: string;
  isActive: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}

const SceneModeCard: React.FC<SceneModeCardProps> = ({
  name,
  icon,
  iconColor,
  isActive,
  onToggle,
  onPress,

}) => {
  const handleToggle = (value: boolean) => {
    onToggle?.(value);
  };

  return (
    <View
      style={[sharedCardStyles.cardBase, styles.card, isActive && sharedCardStyles.cardActive]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchArea}
      >
        <Ionicons name={icon as any} size={40} color={iconColor} />
        <Text style={styles.name}>{name}</Text>
      </TouchableOpacity>

      <View style={styles.switchWrapper}>
        <Switch
          value={isActive}
          onValueChange={handleToggle}
          trackColor={{ false: "#E0E0E0", true: "#3B82F6" }}
          thumbColor="#FFFFFF"
          style={sharedCardStyles.switch}
        />
      </View>
    </View >
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
    width: "30%",
    padding: 0,
  },
  name: {
    fontSize: sharedCardTokens.subtitleFontSize,
    fontWeight: "600",
    color: sharedCardTokens.titleInactiveColor,
    marginTop: 8,
    marginBottom: 6,
  },
  switchWrapper: {
    marginTop: 10,
  },
  touchArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 15,
  }
});

export default SceneModeCard;
