import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const AlarmDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { alarmName, alarmData } = route.params;
  const { selectedRegion } = useAuth();

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [alarmName, selectedRegion]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/api/aws/cloudwatch/alarms/${encodeURIComponent(alarmName)}/history?region=${selectedRegion}`);
      if (res.data?.success) {
        setHistory(res.data.data.history || []);
      }
    } catch (_e) {}
    setHistoryLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{alarmName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Alarm Overview Card */}
        <View style={[styles.card, alarmData?.stateValue === 'ALARM' && { borderColor: 'rgba(248, 81, 73, 0.5)' }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>CURRENT ALARM STATE</Text>
            {alarmData && <StatusBadge status={alarmData.stateValue} />}
          </View>

          <Text style={styles.reasonText}>{alarmData?.stateReason || 'No detailed reason available.'}</Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Namespace</Text>
            <Text style={styles.metaVal}>{alarmData?.namespace || 'AWS/EC2'}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Metric Name</Text>
            <Text style={[styles.metaVal, { color: colors.awsOrange, fontWeight: 'bold' }]}>
              {alarmData?.metricName || '—'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Threshold Condition</Text>
            <Text style={styles.metaVal}>
              {alarmData?.comparisonOperator || '>='} {alarmData?.threshold ?? 0.0}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Evaluation Periods</Text>
            <Text style={styles.metaVal}>
              {alarmData?.evaluationPeriods || 1} period(s) of {alarmData?.period || 300}s
            </Text>
          </View>

          {alarmData?.dimensions?.map((dim: any, i: number) => (
            <View key={i} style={styles.metaRow}>
              <Text style={styles.metaLabel}>{dim.name}</Text>
              <Text style={[styles.metaVal, { color: colors.awsBlue }]}>{dim.value}</Text>
            </View>
          ))}
        </View>

        {/* Alarm History Audit Trail */}
        <View style={styles.historyHeader}>
          <Text style={styles.cardHeading}>ALARM STATE HISTORY (AUDIT TRAIL)</Text>
          {historyLoading && <ActivityIndicator size="small" color={colors.awsOrange} />}
        </View>

        {history.length === 0 && !historyLoading ? (
          <View style={styles.emptyHistoryCard}>
            <Text style={styles.emptyHistoryText}>No state changes recorded in CloudWatch history</Text>
          </View>
        ) : (
          history.map((item, idx) => (
            <View key={idx} style={styles.historyCard}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyType}>{item.historyItemType || 'StateUpdate'}</Text>
                <Text style={styles.historyTime}>
                  {item.timestamp ? item.timestamp.split('T')[0] : ''}
                </Text>
              </View>
              <Text style={styles.historySummary}>{item.historySummary || 'State transition'}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    marginRight: 12,
    padding: 4
  },
  navTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1
  },
  scroll: {
    padding: 16,
    paddingBottom: 32
  },
  card: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  reasonText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 10
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  metaVal: {
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: 'monospace'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  historyCard: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  historyType: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  historyTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace'
  },
  historySummary: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16
  },
  emptyHistoryCard: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  emptyHistoryText: {
    fontSize: 12,
    color: colors.textMuted
  }
});

