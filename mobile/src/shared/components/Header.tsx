import React, { useEffect, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import styles, { headerIconTokens } from "./Header.styles";
import { fetchLatestTelemetry } from "../services/thingsboard.service";

type HeaderProps = {
  tabName: string;
  temperature?: string; // Kept for backwards compatibility
  humidity?: string; // Kept for backwards compatibility
  dateLabel?: string; // Kept for backwards compatibility
  avatarUri?: string;
  onBackPress?: () => void;
  onAvatarPress?: () => void;
  onAddPress?: () => void;
  // 1. Thêm prop này để truyền nút Save từ màn hình Automation vào
  rightElement?: React.ReactNode;
};

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80";

export default function Header({
  tabName,
  avatarUri = DEFAULT_AVATAR,
  onBackPress,
  onAvatarPress,
  onAddPress,
  rightElement, // 2. Nhận prop
}: HeaderProps) {
  const [currentTemp, setCurrentTemp] = useState<string>("28.0°C"); // Default fallback
  const [currentHumidity, setCurrentHumidity] = useState<string>("70.0%"); // Default fallback
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    // Set formatted current date: "Wed, May 24th"
    const updateDate = () => {
      const now = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const date = now.getDate();
      
      let suffix = "th";
      if (date === 1 || date === 21 || date === 31) suffix = "st";
      else if (date === 2 || date === 22) suffix = "nd";
      else if (date === 3 || date === 23) suffix = "rd";

      setCurrentDate(`${dayName}, ${monthName} ${date}${suffix}`);
    };
    updateDate();

    // Fetch real-time data
    const loadTelemetry = async () => {
      try {
        const { temperature, humidity } = await fetchLatestTelemetry();
        if (temperature !== null) {
          setCurrentTemp(`${temperature.toFixed(1)}°C`);
        } else {
          // Hardcoded fallback logic
          setCurrentTemp(`${(25 + Math.random() * 10).toFixed(1)}°C`);
        }
        
        if (humidity !== null) {
          setCurrentHumidity(`${humidity.toFixed(1)}%`);
        } else {
          // Hardcoded fallback logic
          setCurrentHumidity(`${(55 + Math.random() * 30).toFixed(1)}%`);
        }
      } catch (error) {
        console.warn("Failed to fetch header telemetry", error);
      }
    };

    loadTelemetry();
    const interval = setInterval(() => {
      loadTelemetry();
      updateDate();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

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
              <Text style={styles.metaText}>{currentTemp}</Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="water-percent"
                size={headerIconTokens.humiditySize}
                color={headerIconTokens.humidityColor}
              />
              <Text style={styles.metaText}>{currentHumidity}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-clear"
                size={headerIconTokens.dateSize}
                color={headerIconTokens.dateColor}
              />
              <Text style={styles.metaText}>{currentDate}</Text>
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
        <View style={styles.titleRow}>
          <View style={styles.titleLeftWrap}>
            {onBackPress && (
              <Pressable onPress={onBackPress} style={styles.backButton}>
                <Ionicons name="chevron-back" size={30} color="#fff" />
              </Pressable>
            )}
            <Text style={styles.tabName}>{tabName}</Text>
          </View>

          {/* 3. Render icon Add hoặc rightElement (nút Save) */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onAddPress && (
              <Pressable onPress={onAddPress} style={styles.addButton}>
                <Ionicons name="add" size={40} color="#fff" />
              </Pressable>
            )}
            {rightElement && rightElement}
          </View>

        </View>
      </View>
    </SafeAreaView >
  );
}