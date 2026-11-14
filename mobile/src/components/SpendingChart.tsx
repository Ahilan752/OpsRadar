import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

interface DailyCost {
  date: string;
  amount: number;
}

export const SpendingChart: React.FC<{
  title: string;
  currency: string;
  dailyCosts: DailyCost[];
}> = ({ title, currency, dailyCosts }) => {
  const chartHeight = 90;
  const chartWidth = 320;

  const amounts = dailyCosts.map(d => d.amount);
  const maxAmount = Math.max(...amounts, 1.0);
  const total = amounts.reduce((a, b) => a + b, 0);

  const barCount = dailyCosts.length;
  const totalGap = chartWidth * 0.25;
  const gapWidth = barCount > 1 ? totalGap / (barCount - 1) : 0;
  const barWidth = barCount > 0 ? (chartWidth - totalGap) / barCount : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.totalText}>
          {currency} {total.toFixed(2)}
        </Text>
      </View>

      {dailyCosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent daily spending recorded</Text>
        </View>
      ) : (
        <View>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {dailyCosts.map((cost, idx) => {
              const x = idx * (barWidth + gapWidth);
              const normalizedHeight = Math.max(cost.amount / maxAmount, 0.05);
              const barH = normalizedHeight * (chartHeight - 12);
              const y = chartHeight - barH;

              return (
                <Rect
                  key={cost.date || idx}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="2"
                  fill={colors.awsOrange}
                  fillOpacity="0.85"
                />
              );
            })}
          </Svg>

          <View style={styles.datesRow}>
            {dailyCosts.slice(-5).map((cost, idx) => (
              <Text key={idx} style={styles.dateLabel}>
                {cost.date.length >= 5 ? cost.date.substring(5) : cost.date}
              </Text>
            ))}
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
  totalText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.awsOrange,
    fontFamily: 'monospace'
  },
  emptyContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6
  },
  dateLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: 'monospace'
  }
});

