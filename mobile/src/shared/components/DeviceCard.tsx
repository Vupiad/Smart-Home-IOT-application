import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sharedCardStyles, sharedCardTokens } from "../styles/deviceCards";

interface DeviceCardProps {
  name: string;
  icon: string;
  isOn: boolean;
  subtitle?: string;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  cardStyle?: StyleProp<ViewStyle>;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  name,
  icon,
  isOn,
  subtitle,
  onToggle,
  onPress,
  cardStyle,
}) => {
  const handleToggle = (value: boolean) => {
    onToggle?.(value);
  };

  return (
    <TouchableOpacity
      style={[sharedCardStyles.cardBase, styles.card, cardStyle]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={sharedCardStyles.iconBox}>
        <Ionicons name={icon as any} size={36} color="#555" />
      </View>
      <Text
        style={[
          sharedCardStyles.title,
          {
            color: isOn
              ? sharedCardTokens.titleColor
              : sharedCardTokens.titleInactiveColor,
          },
        ]}
      >
        {name}
      </Text>
      {subtitle && <Text style={sharedCardStyles.subtitle}>{subtitle}</Text>}
      <Switch
        value={isOn}
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
    width: "47%",
    marginBottom: 12,
  },
});

export default DeviceCard;
