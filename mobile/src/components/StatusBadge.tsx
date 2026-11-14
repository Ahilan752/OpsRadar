import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || '').toUpperCase();

  let dotColor = colors.statusNeutral;
  let textColor = colors.textSecondary;
  let bgColor = 'rgba(48, 54, 61, 0.4)';

  if (['RUNNING', 'OK', 'HEALTHY', 'CONNECTED'].includes(s)) {
    dotColor = colors.statusGreen;
    textColor = colors.statusGreenText;
    bgColor = 'rgba(46, 160, 67, 0.15)';
  } else if (['ALARM', 'CRITICAL', 'FAILED', 'ERROR'].includes(s)) {
    dotColor = colors.statusRed;
    textColor = colors.statusRedText;
    bgColor = 'rgba(248, 81, 73, 0.15)';
  } else if (['PENDING', 'INSUFFICIENT_DATA', 'WARNING'].includes(s)) {
    dotColor = colors.statusAmber;
    textColor = colors.statusAmberText;
    bgColor = 'rgba(227, 179, 65, 0.15)';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{s}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3
  }
});
