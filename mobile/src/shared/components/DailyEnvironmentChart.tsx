import { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../../theme";
import {
  fetchDailyTelemetry,
  type FetchResult,
} from "../services/thingsboard.service";

const DEFAULT_MAX_TEMP_SCALE = 40;
const DEFAULT_MAX_HUMIDITY_SCALE = 100;
const BAR_HEIGHT = 120;

export type DailyEnvironmentData = {
  dateLabel: string;
  temperature: number;
  humidity: number;
};

export const DAILY_ENVIRONMENT_MOCK_DATA: DailyEnvironmentData[] = [
  { dateLabel: "07/04", temperature: 30, humidity: 67 },
  { dateLabel: "08/04", temperature: 31, humidity: 65 },
  { dateLabel: "09/04", temperature: 29, humidity: 72 },
  { dateLabel: "10/04", temperature: 32, humidity: 68 },
  { dateLabel: "11/04", temperature: 33, humidity: 63 },
  { dateLabel: "12/04", temperature: 31, humidity: 70 },
  { dateLabel: "13/04", temperature: 30, humidity: 69 },
];

type DailyEnvironmentChartProps = {
  title?: string;
  showTitle?: boolean;
  data?: DailyEnvironmentData[];
  showFootnote?: boolean;
  footnoteText?: string;
  maxTempScale?: number;
  maxHumidityScale?: number;
  /** Nếu true, tự động fetch dữ liệu từ ThingsBoard */
  autoFetch?: boolean;
};

export default function DailyEnvironmentChart({
  title = "Daily Environment",
  showTitle = true,
  data: propData,
  showFootnote = false,
  footnoteText,
  maxTempScale = DEFAULT_MAX_TEMP_SCALE,
  maxHumidityScale = DEFAULT_MAX_HUMIDITY_SCALE,
  autoFetch = true,
}: DailyEnvironmentChartProps) {
  const [chartData, setChartData] = useState<DailyEnvironmentData[]>(
    propData ?? DAILY_ENVIRONMENT_MOCK_DATA,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"thingsboard" | "hardcoded">(
    "hardcoded",
  );
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const result: FetchResult = await fetchDailyTelemetry(7);
      setChartData(result.data);
      setDataSource(result.source);
      if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (error) {
      console.warn("[Chart] Fetch error:", error);
      setChartData(DAILY_ENVIRONMENT_MOCK_DATA);
      setDataSource("hardcoded");
      setErrorMessage("Lỗi kết nối");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Nếu có data truyền từ props thì dùng props, không fetch
    if (propData) {
      setChartData(propData);
      return;
    }

    if (autoFetch) {
      loadData();
    }
  }, [propData, autoFetch, loadData]);

  const displayData = chartData;

  return (
    <View>
      {showTitle && <Text style={styles.sectionTitle}>{title}</Text>}

      <View style={styles.chartCard}>
        {/* Header: Legend + Data Source Badge */}
        <View style={styles.headerRow}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.temperatureDot]} />
              <Text style={styles.legendText}>Temperature (°C)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.humidityDot]} />
              <Text style={styles.legendText}>Humidity (%)</Text>
            </View>
          </View>

          {/* Refresh button */}
          {autoFetch && !propData && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadData}
              disabled={isLoading}
              activeOpacity={0.6}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={isLoading ? "#D1D5DB" : "#6B7280"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Data Source Badge */}
        <View style={styles.sourceBadgeRow}>
          <View
            style={[
              styles.sourceBadge,
              dataSource === "thingsboard"
                ? styles.sourceBadgeLive
                : styles.sourceBadgeOffline,
            ]}
          >
            <View
              style={[
                styles.sourceDot,
                dataSource === "thingsboard"
                  ? styles.sourceDotLive
                  : styles.sourceDotOffline,
              ]}
            />
            <Text
              style={[
                styles.sourceBadgeText,
                dataSource === "thingsboard"
                  ? styles.sourceBadgeTextLive
                  : styles.sourceBadgeTextOffline,
              ]}
            >
              {dataSource === "thingsboard"
                ? "Live – ThingsBoard"
                : "Offline – Hardcoded"}
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#2E4EE8" />
            <Text style={styles.loadingText}>
              Đang lấy dữ liệu từ ThingsBoard...
            </Text>
          </View>
        )}

        {/* Chart Bars */}
        <View style={styles.chartBarsWrap}>
          {displayData.map((item) => {
            const temperatureHeight = Math.max(
              8,
              (item.temperature / maxTempScale) * BAR_HEIGHT,
            );
            const humidityHeight = Math.max(
              8,
              (item.humidity / maxHumidityScale) * BAR_HEIGHT,
            );

            return (
              <View key={item.dateLabel} style={styles.dayColumn}>
                {/* Value labels on top of bars */}
                <View style={styles.valueLabels}>
                  <Text style={[styles.valueText, styles.tempValueText]}>
                    {Math.round(item.temperature)}°
                  </Text>
                  <Text style={[styles.valueText, styles.humidValueText]}>
                    {Math.round(item.humidity)}%
                  </Text>
                </View>
                <View style={styles.dayBars}>
                  <View
                    style={[
                      styles.bar,
                      styles.temperatureBar,
                      { height: temperatureHeight },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.humidityBar,
                      { height: humidityHeight },
                    ]}
                  />
                </View>
                <Text style={styles.dayLabel}>{item.dateLabel}</Text>
              </View>
            );
          })}
        </View>

        {/* Footnote */}
        {showFootnote && (
          <Text style={styles.chartFootnote}>
            {footnoteText ??
              (errorMessage
                ? `⚠ ${errorMessage}`
                : dataSource === "thingsboard"
                  ? "✓ Dữ liệu thực từ ThingsBoard Cloud"
                  : "Đang sử dụng dữ liệu mẫu (hardcoded)")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 12,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  temperatureDot: {
    backgroundColor: "#FF8A65",
  },
  humidityDot: {
    backgroundColor: "#4FC3F7",
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sourceBadgeRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceBadgeLive: {
    backgroundColor: "#ECFDF5",
  },
  sourceBadgeOffline: {
    backgroundColor: "#FEF3C7",
  },
  sourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  sourceDotLive: {
    backgroundColor: "#10B981",
  },
  sourceDotOffline: {
    backgroundColor: "#F59E0B",
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  sourceBadgeTextLive: {
    color: "#059669",
  },
  sourceBadgeTextOffline: {
    color: "#D97706",
  },
  loadingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  chartBarsWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minHeight: 150,
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: "center",
    width: 34,
  },
  valueLabels: {
    flexDirection: "row",
    marginBottom: 4,
  },
  valueText: {
    fontSize: 8,
    fontWeight: "600",
    marginHorizontal: 1,
  },
  tempValueText: {
    color: "#FF8A65",
  },
  humidValueText: {
    color: "#4FC3F7",
  },
  dayBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: BAR_HEIGHT,
  },
  bar: {
    width: 9,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  temperatureBar: {
    backgroundColor: "#FF8A65",
  },
  humidityBar: {
    backgroundColor: "#4FC3F7",
  },
  dayLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  chartFootnote: {
    marginTop: 12,
    fontSize: 11,
    color: "#6B7280",
  },
});
