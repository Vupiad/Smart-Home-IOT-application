import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import styles, { headerIconTokens } from "./Header.styles";

type HeaderProps = {
  tabName: string;
  temperature?: string;
  humidity?: string;
  dateLabel?: string;
  avatarUri?: string;
  onAvatarPress?: () => void;
};

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80";

export default function Header({
  tabName,
  temperature = "28°C",
  humidity = "70%",
  dateLabel = "Wed, May 24th",
  avatarUri = DEFAULT_AVATAR, // from be later
  onAvatarPress,
}: HeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.card}>
        <View style={styles.grid}>
          <View style={styles.gridLineHorizontalTop} />
          <View style={styles.gridLineHorizontalBottom} />
          <View style={styles.gridLineVerticalLeft} />
          <View style={styles.gridLineVerticalRight} />
        </View>

        <View style={styles.topRow}>
          <View style={styles.metaGroup}>
            <View style={styles.metaItem}>
              <Ionicons
                name="partly-sunny"
                size={headerIconTokens.weatherSize}
                color={headerIconTokens.weatherColor}
              />
              <Text style={styles.metaText}>{temperature}</Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="water-percent"
                size={headerIconTokens.humiditySize}
                color={headerIconTokens.humidityColor}
              />
              <Text style={styles.metaText}>{humidity}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-clear"
                size={headerIconTokens.dateSize}
                color={headerIconTokens.dateColor}
              />
              <Text style={styles.metaText}>{dateLabel}</Text>
            </View>
          </View>

          <Pressable
            onPress={onAvatarPress}
            style={styles.avatarButton}
            disabled={!onAvatarPress}
          >
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </Pressable>
        </View>

        <Text style={styles.tabName}>{tabName}</Text>

        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationPanel}>
            <Ionicons
              name="home"
              size={headerIconTokens.illustrationSize}
              color={headerIconTokens.illustrationColor}
            />
            <Text style={styles.illustrationText}>SMART HOME</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
