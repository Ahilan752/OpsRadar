import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  highlightColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, highlightColor }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      <Text style={[styles.value, { color: highlightColor || colors.textPrimary }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center'
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted
  }
});

