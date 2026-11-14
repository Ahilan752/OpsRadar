import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MetricChart } from '../components/MetricChart';

export const EC2DetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { instanceId } = route.params;
  const { selectedRegion } = useAuth();

  const [instance, setInstance] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('1h');

  const timeRanges = ['1h', '3h', '6h', '24h', '7d', '30d'];

  useEffect(() => {
    loadDetails();
  }, [instanceId, selectedRegion]);

  useEffect(() => {
    loadMetrics(timeRange);
  }, [timeRange]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/aws/ec2/instances/${instanceId}?region=${selectedRegion}`);
      if (res.data?.success) {
        setInstance(res.data.data);
      }
    } catch (_e) {}
    setLoading(false);
  };

  const loadMetrics = async (range: string) => {
    setMetricsLoading(true);
    try {
      const res = await api.get(`/api/aws/cloudwatch/metrics?instanceId=${instanceId}&region=${selectedRegion}&timeRange=${range}`);
      if (res.data?.success) {
        setMetrics(res.data.data);
      }
    } catch (_e) {}
    setMetricsLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24) }]}>
      {/* Top Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle} numberOfLines={1}>{instance?.name || instanceId}</Text>
          <Text style={styles.navSubtitle}>{instanceId}</Text>
        </View>
      </View>

      {loading && !instance ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.awsOrange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Instance Metadata Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeading}>INSTANCE METADATA</Text>
              {instance && <StatusBadge status={instance.state} />}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={[styles.metaVal, { color: colors.awsBlue }]}>{instance?.type || '—'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Availability Zone</Text>
              <Text style={styles.metaVal}>{instance?.availabilityZone || '—'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Public IPv4</Text>
              <Text style={[styles.metaVal, { color: instance?.publicIp ? colors.awsBlue : colors.textMuted }]}>
                {instance?.publicIp || 'None (Private)'}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Private IPv4</Text>
              <Text style={styles.metaVal}>{instance?.privateIp || '—'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Platform</Text>
              <Text style={styles.metaVal}>{instance?.platform || 'Linux/UNIX'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>System Status Check</Text>
              <Text style={[styles.metaVal, { color: colors.statusGreenText, fontWeight: 'bold' }]}>
                {(instance?.systemStatus || 'OK').toUpperCase()}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Instance Status Check</Text>
              <Text style={[styles.metaVal, { color: colors.statusGreenText, fontWeight: 'bold' }]}>
                {(instance?.instanceStatus || 'OK').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* CloudWatch Time Range Selector */}
          <View style={styles.timeRangeSection}>
            <View style={styles.timeRangeHeader}>
              <Text style={styles.cardHeading}>CLOUDWATCH METRICS</Text>
              {metricsLoading && <ActivityIndicator size="small" color={colors.awsOrange} />}
            </View>

            <View style={styles.rangesRow}>
              {timeRanges.map(tr => {
                const isSelected = timeRange === tr;
                return (
                  <TouchableOpacity
                    key={tr}
                    style={[styles.rangeChip, isSelected && styles.rangeChipActive]}
                    onPress={() => setTimeRange(tr)}
                  >
                    <Text style={[styles.rangeChipText, isSelected && styles.rangeChipTextActive]}>
                      {tr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Metric 1: CPU Utilization */}
          <MetricChart
            title="CPU Utilization"
            unit="%"
            dataPoints={metrics['CPUUtilization']?.dataPoints || []}
            lineColor={colors.awsOrange}
          />

          {/* Metric 2: Network In */}
          <MetricChart
            title="Network In"
            unit="Bytes"
            dataPoints={metrics['NetworkIn']?.dataPoints || []}
            lineColor={colors.awsBlue}
          />

          {/* Metric 3: Network Out */}
          <MetricChart
            title="Network Out"
            unit="Bytes"
            dataPoints={metrics['NetworkOut']?.dataPoints || []}
            lineColor="#A371F7"
          />

          {/* Metric 4: Disk Read */}
          <MetricChart
            title="Disk Read"
            unit="Bytes"
            dataPoints={metrics['DiskReadBytes']?.dataPoints || []}
            lineColor={colors.statusGreen}
          />

          {/* Memory Notice Callout */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              ℹ️ EC2 memory utilization requires the CloudWatch Agent installed inside the operating system. Standard hypervisor metrics do not report OS-level memory.
            </Text>
          </View>
        </ScrollView>
      )}
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
    color: colors.textPrimary
  },
  navSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace'
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5
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
  timeRangeSection: {
    marginBottom: 12
  },
  timeRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  rangesRow: {
    flexDirection: 'row',
    gap: 6
  },
  rangeChip: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  rangeChipActive: {
    borderColor: colors.awsOrange,
    backgroundColor: 'rgba(236, 114, 17, 0.2)'
  },
  rangeChipText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  rangeChipTextActive: {
    color: colors.awsOrange,
    fontWeight: 'bold'
  },
  noticeBox: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 4
  },
  noticeText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

