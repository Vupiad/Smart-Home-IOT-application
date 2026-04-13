import { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Path,
  Line as SvgLine,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from "react-native-svg";

import { theme } from "../../theme";
import {
  fetchRealtimeTelemetry,
  type RealtimeDataPoint,
} from "../services/thingsboard.service";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HORIZONTAL_PADDING = 40; // from ProfileScreen pagePaddingX
const CARD_INNER_PADDING = 16;
const CHART_WIDTH =
  SCREEN_WIDTH - CHART_HORIZONTAL_PADDING * 2 - CARD_INNER_PADDING * 2;
const CHART_HEIGHT = 180;
const PADDING = { top: 15, right: 15, bottom: 30, left: 40 };
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

const REFRESH_INTERVAL = 60000; // ms (1 minute)
const DATA_POINTS = 20;

// Colors
const TEMP_COLOR = "#FF6B6B";
const TEMP_COLOR_LIGHT = "#FFE0E0";
const HUMID_COLOR = "#4ECDC4";
const HUMID_COLOR_LIGHT = "#D4F5F2";
const GRID_COLOR = "#E5E7EB";
const LABEL_COLOR = "#9CA3AF";
const CARD_BG = "#FFFFFF";


// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

/** Current value card */
function ValueCard({
  icon,
  label,
  value,
  unit,
  color,
  bgColor,
}: {
  icon: string;
  label: string;
  value: number | null;
  unit: string;
  color: string;
  bgColor: string;
  trend?: number;
}) {
  return (
    <View style={[styles.valueCard, { borderLeftColor: color }]}>
      <View style={[styles.valueCardIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.valueCardLabel}>{label}</Text>
      <View style={styles.valueCardRow}>
        <Text style={[styles.valueCardNumber, { color }]}>
          {value !== null ? value.toFixed(1) : "--"}
        </Text>
        <Text style={[styles.valueCardUnit, { color }]}>{unit}</Text>
      </View>
    </View>
  );
}

/** Scale helpers */
function getScales(data: RealtimeDataPoint[]) {
  const temps = data.map((d) => d.temperature);
  const humids = data.map((d) => d.humidity);

  const minTemp = Math.floor(Math.min(...temps) - 2);
  const maxTemp = Math.ceil(Math.max(...temps) + 2);
  const minHumid = Math.floor(Math.min(...humids) - 5);
  const maxHumid = Math.ceil(Math.max(...humids) + 5);

  const xScale = (i: number) =>
    PADDING.left + (i / Math.max(data.length - 1, 1)) * PLOT_WIDTH;
  const yTempScale = (v: number) =>
    PADDING.top +
    PLOT_HEIGHT -
    ((v - minTemp) / Math.max(maxTemp - minTemp, 1)) * PLOT_HEIGHT;
  const yHumidScale = (v: number) =>
    PADDING.top +
    PLOT_HEIGHT -
    ((v - minHumid) / Math.max(maxHumid - minHumid, 1)) * PLOT_HEIGHT;

  return {
    minTemp,
    maxTemp,
    minHumid,
    maxHumid,
    xScale,
    yTempScale,
    yHumidScale,
  };
}

/** Grid lines + Y-axis labels */
function ChartGrid({
  minVal,
  maxVal,
  color,
  side,
}: {
  minVal: number;
  maxVal: number;
  color: string;
  side: "left" | "right";
}) {
  const gridLines = 4;
  const step = (maxVal - minVal) / gridLines;

  return (
    <G>
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const val = minVal + i * step;
        const y = PADDING.top + PLOT_HEIGHT - (i / gridLines) * PLOT_HEIGHT;
        return (
          <G key={i}>
            <SvgLine
              x1={PADDING.left}
              y1={y}
              x2={CHART_WIDTH - PADDING.right}
              y2={y}
              stroke={GRID_COLOR}
              strokeWidth={0.5}
              strokeDasharray={i > 0 && i < gridLines ? "4,4" : "0"}
            />
            <SvgText
              x={side === "left" ? PADDING.left - 6 : CHART_WIDTH - PADDING.right + 6}
              y={y + 3}
              fontSize={9}
              fill={color}
              textAnchor={side === "left" ? "end" : "start"}
              fontWeight="500"
            >
              {Math.round(val)}
            </SvgText>
          </G>
        );
      })}
    </G>
  );
}

/** Bar Chart */
function BarChartView({ data }: { data: RealtimeDataPoint[] }) {
  if (data.length === 0) return null;

  const { minTemp, maxTemp, minHumid, maxHumid, xScale } = getScales(data);

  const barGroupWidth = PLOT_WIDTH / data.length;
  const barWidth = Math.max(3, barGroupWidth * 0.3);
  const barGap = 2;

  const labelInterval = Math.max(1, Math.floor(data.length / 5));

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id="tempBarGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={TEMP_COLOR} stopOpacity="1" />
          <Stop offset="100%" stopColor="#FFB4B4" stopOpacity="0.7" />
        </LinearGradient>
        <LinearGradient id="humidBarGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={HUMID_COLOR} stopOpacity="1" />
          <Stop offset="100%" stopColor="#A8E6CF" stopOpacity="0.7" />
        </LinearGradient>
      </Defs>

      {/* Grid */}
      <ChartGrid
        minVal={minTemp}
        maxVal={maxTemp}
        color={TEMP_COLOR}
        side="left"
      />

      {/* Bottom line */}
      <SvgLine
        x1={PADDING.left}
        y1={PADDING.top + PLOT_HEIGHT}
        x2={CHART_WIDTH - PADDING.right}
        y2={PADDING.top + PLOT_HEIGHT}
        stroke={GRID_COLOR}
        strokeWidth={1}
      />

      {/* Bars */}
      {data.map((d, i) => {
        const cx = xScale(i);
        const tempH =
          ((d.temperature - minTemp) / Math.max(maxTemp - minTemp, 1)) *
          PLOT_HEIGHT;
        const humidH =
          ((d.humidity - minHumid) / Math.max(maxHumid - minHumid, 1)) *
          PLOT_HEIGHT;

        return (
          <G key={`bar-${i}`}>
            {/* Temperature bar */}
            <Path
              d={`M ${cx - barWidth - barGap / 2} ${PADDING.top + PLOT_HEIGHT}
                  L ${cx - barWidth - barGap / 2} ${PADDING.top + PLOT_HEIGHT - tempH + 3}
                  Q ${cx - barWidth - barGap / 2} ${PADDING.top + PLOT_HEIGHT - tempH}
                    ${cx - barGap / 2 - barWidth / 2} ${PADDING.top + PLOT_HEIGHT - tempH}
                  Q ${cx - barGap / 2} ${PADDING.top + PLOT_HEIGHT - tempH}
                    ${cx - barGap / 2} ${PADDING.top + PLOT_HEIGHT - tempH + 3}
                  L ${cx - barGap / 2} ${PADDING.top + PLOT_HEIGHT} Z`}
              fill="url(#tempBarGrad)"
            />
            {/* Humidity bar */}
            <Path
              d={`M ${cx + barGap / 2} ${PADDING.top + PLOT_HEIGHT}
                  L ${cx + barGap / 2} ${PADDING.top + PLOT_HEIGHT - humidH + 3}
                  Q ${cx + barGap / 2} ${PADDING.top + PLOT_HEIGHT - humidH}
                    ${cx + barGap / 2 + barWidth / 2} ${PADDING.top + PLOT_HEIGHT - humidH}
                  Q ${cx + barWidth + barGap / 2} ${PADDING.top + PLOT_HEIGHT - humidH}
                    ${cx + barWidth + barGap / 2} ${PADDING.top + PLOT_HEIGHT - humidH + 3}
                  L ${cx + barWidth + barGap / 2} ${PADDING.top + PLOT_HEIGHT} Z`}
              fill="url(#humidBarGrad)"
            />
          </G>
        );
      })}

      {/* X labels */}
      {data.map(
        (d, i) =>
          i % labelInterval === 0 && (
            <SvgText
              key={`xbl-${i}`}
              x={xScale(i)}
              y={CHART_HEIGHT - 5}
              fontSize={9}
              fill={LABEL_COLOR}
              textAnchor="middle"
            >
              {d.time.substring(0, 5)}
            </SvgText>
          ),
      )}
    </Svg>
  );
}



// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function RealtimeEnvironmentChart() {
  const [data, setData] = useState<RealtimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"thingsboard" | "hardcoded">(
    "hardcoded",
  );
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for live indicator
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchRealtimeTelemetry(DATA_POINTS);
      setData(result.data);
      setDataSource(result.source);
      const now = new Date();
      setLastUpdated(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
      );
    } catch {
      // Keep existing data
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + auto-refresh
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  // Derived values
  const latest = data.length > 0 ? data[data.length - 1] : null;

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text style={styles.sectionTitle}>Real-time Environment</Text>

      <View style={styles.card}>
        {/* Current Values */}
        <View style={styles.valuesRow}>
          <ValueCard
            icon="thermometer-outline"
            label="Temperature"
            value={latest?.temperature ?? null}
            unit="°C"
            color={TEMP_COLOR}
            bgColor={TEMP_COLOR_LIGHT}
          />
          <ValueCard
            icon="water-outline"
            label="Humidity"
            value={latest?.humidity ?? null}
            unit="%"
            color={HUMID_COLOR}
            bgColor={HUMID_COLOR_LIGHT}
          />
        </View>

        {/* Chart Area */}
        <View style={styles.chartWrapper}>
          {isLoading && data.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2E4EE8" />
              <Text style={styles.loadingText}>
                Đang tải dữ liệu...
              </Text>
            </View>
          ) : (
            <BarChartView data={data} />
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: TEMP_COLOR }]}
            />
            <Text style={styles.legendText}>Temperature (°C)</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: HUMID_COLOR }]}
            />
            <Text style={styles.legendText}>Humidity (%)</Text>
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <Animated.View
              style={[
                styles.liveDot,
                dataSource === "thingsboard"
                  ? styles.liveDotGreen
                  : styles.liveDotYellow,
                { opacity: pulseAnim },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                dataSource === "thingsboard"
                  ? styles.statusTextLive
                  : styles.statusTextOffline,
              ]}
            >
              {dataSource === "thingsboard" ? "LIVE" : "OFFLINE"}
            </Text>
          </View>
          <View style={styles.statusRight}>
            <Ionicons name="time-outline" size={12} color={LABEL_COLOR} />
            <Text style={styles.statusTime}>{lastUpdated || "--:--:--"}</Text>
            <TouchableOpacity
              onPress={loadData}
              style={styles.refreshBtn}
              activeOpacity={0.6}
            >
              <Ionicons name="refresh-outline" size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
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
  card: {
    backgroundColor: CARD_BG,
    borderRadius: theme.radius.md,
    padding: CARD_INNER_PADDING,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // ── Value Cards ──
  valuesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  valueCard: {
    flex: 1,
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
  },
  valueCardIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  valueCardLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: LABEL_COLOR,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  valueCardRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  valueCardNumber: {
    fontSize: 26,
    fontWeight: "700",
  },
  valueCardUnit: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 2,
    opacity: 0.7,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 3,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Mode Selector ──
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  modePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  modePillActive: {
    backgroundColor: "#2E4EE8",
    shadowColor: "#2E4EE8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  modePillTextActive: {
    color: "#FFFFFF",
  },

  // ── Chart ──
  chartWrapper: {
    minHeight: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: LABEL_COLOR,
  },

  // ── Gauge ──
  gaugeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
  },
  gaugeItem: {
    alignItems: "center",
  },
  gaugeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  // ── Legend ──
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: LABEL_COLOR,
    fontWeight: "500",
  },

  // ── Status Bar ──
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveDotGreen: {
    backgroundColor: "#10B981",
  },
  liveDotYellow: {
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusTextLive: {
    color: "#10B981",
  },
  statusTextOffline: {
    color: "#F59E0B",
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusTime: {
    fontSize: 11,
    color: LABEL_COLOR,
    fontWeight: "500",
  },
  refreshBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});
