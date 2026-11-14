import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

interface DataPoint {
  timestamp: string;
  value: number;
}

interface MetricChartProps {
  title: string;
  unit: string;
  dataPoints: DataPoint[];
  lineColor?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({
  title,
  unit,
  dataPoints,
  lineColor = colors.awsOrange
}) => {
  const chartHeight = 120;
  const chartWidth = 320;

  const values = dataPoints.map(d => d.value);
  const maxVal = Math.max(...values, 1.0);
  const minVal = Math.min(...values, 0.0);
  const latestVal = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].value : 0;

  // Build SVG path
  let pathD = '';
  let fillD = '';

  if (dataPoints.length > 0) {
    const range = Math.max(maxVal - minVal, 0.001);
    const stepX = dataPoints.length > 1 ? chartWidth / (dataPoints.length - 1) : chartWidth;

    const coords = dataPoints.map((pt, i) => {
      const x = i * stepX;
      const normalizedY = (pt.value - minVal) / range;
      const y = chartHeight - normalizedY * (chartHeight - 16) - 8;
      return { x, y };
    });

    pathD = coords.reduce((acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`), '');
    fillD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {dataPoints.length > 0 && (
          <Text style={[styles.latestVal, { color: lineColor }]}>
            {latestVal} {unit}
          </Text>
        )}
      </View>

      {dataPoints.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No CloudWatch data points for this period</Text>
        </View>
      ) : (
        <View style={styles.svgContainer}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
                <Stop offset="1" stopColor={lineColor} stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Middle Gridline */}
            <Line
              x1="0"
              y1={chartHeight / 2}
              x2={chartWidth}
              y2={chartHeight / 2}
              stroke={colors.border}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            {/* Baseline */}
            <Line
              x1="0"
              y1={chartHeight - 1}
              x2={chartWidth}
              y2={chartHeight - 1}
              stroke={colors.border}
              strokeWidth="1"
            />

            {/* Gradient Area Fill */}
            <Path d={fillD} fill={`url(#grad-${title})`} />

            {/* Primary Stroke Line */}
            <Path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
          </Svg>

          <View style={styles.labelsRow}>
            <Text style={styles.axisLabel}>min: {minVal.toFixed(1)} {unit}</Text>
            <Text style={styles.axisLabel}>max: {maxVal.toFixed(1)} {unit}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  latestVal: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted
  },
  svgContainer: {
    alignItems: 'center'
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace'
  }
});
