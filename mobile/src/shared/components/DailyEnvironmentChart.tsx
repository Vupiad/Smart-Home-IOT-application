import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme";

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
};

export default function DailyEnvironmentChart({
  title = "Daily Environment",
  showTitle = true,
  data = DAILY_ENVIRONMENT_MOCK_DATA,
  showFootnote = false,
  footnoteText = "Để tạm mock data, sau này thay bằng dữ liệu thực tế từ API (nếu kịp :D)",
  maxTempScale = DEFAULT_MAX_TEMP_SCALE,
  maxHumidityScale = DEFAULT_MAX_HUMIDITY_SCALE,
}: DailyEnvironmentChartProps) {
  return (
    <View>
      {showTitle && <Text style={styles.sectionTitle}>{title}</Text>}

      <View style={styles.chartCard}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.temperatureDot]} />
            <Text style={styles.legendText}>Temperature (C)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.humidityDot]} />
            <Text style={styles.legendText}>Humidity (%)</Text>
          </View>
        </View>

        <View style={styles.chartBarsWrap}>
          {data.map((item) => {
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

        {showFootnote && (
          <Text style={styles.chartFootnote}>{footnoteText}</Text>
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
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
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
