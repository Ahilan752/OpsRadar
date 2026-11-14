import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { TopBar } from '../components/TopBar';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { SpendingChart } from '../components/SpendingChart';
import { EmptyState } from '../components/EmptyState';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { connections, selectedConnection, selectedRegion } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedConnection) {
      loadOverview();
    }
  }, [selectedConnection, selectedRegion]);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/dashboard/overview?region=${selectedRegion}`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Cannot connect to OpsRadar server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOverview();
  };

  return (
    <View style={styles.container}>
      <TopBar title="Dashboard" onRefresh={onRefresh} />

      {connections.length === 0 ? (
        <EmptyState
          icon="cloud-upload-outline"
          title="No AWS Account Connected"
          message="Connect your AWS Account using an IAM Read-Only role to view EC2 instances, CloudWatch alarms, and AWS costs."
          buttonText="Connect AWS Account"
          onPressButton={() => navigation.navigate('ConnectAccount')}
        />
      ) : loading && !data ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.awsOrange} />
        </View>
      ) : error && !data ? (
        <View style={styles.centerContainer}>
          <Ionicons name="warning-outline" size={40} color={colors.statusRed} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOverview}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.awsOrange} />}
        >
          {/* Overview Summary Cards */}
          <View style={styles.gridRow}>
            <StatCard
              title="Running EC2"
              value={`${data?.summary?.runningInstances ?? 0}`}
              subtitle={`of ${data?.summary?.totalInstances ?? 0} total`}
              highlightColor={colors.statusGreen}
            />
            <StatCard
              title="Active Alarms"
              value={`${data?.summary?.activeAlarms ?? 0}`}
              subtitle={data?.summary?.activeAlarms === 0 ? 'All healthy' : 'Needs attention'}
              highlightColor={data?.summary?.activeAlarms > 0 ? colors.statusRed : colors.statusGreen}
            />
          </View>

          <View style={styles.gridRow}>
            <StatCard
              title="Month-to-Date Spend"
              value={`${data?.summary?.currency || 'USD'} ${data?.summary?.monthToDateCost ?? 0}`}
              subtitle="Cost Explorer"
              highlightColor={colors.awsOrange}
            />
            <StatCard
              title="Stopped Instances"
              value={`${data?.summary?.stoppedInstances ?? 0}`}
              subtitle={`Region ${selectedRegion}`}
              highlightColor={colors.textSecondary}
            />
          </View>

          {/* 7-day Spending Trend Chart */}
          {data?.spendingTrend?.length > 0 && (
            <SpendingChart
              title="7-Day Spending Trend"
              currency={data?.summary?.currency || 'USD'}
              dailyCosts={data.spendingTrend}
            />
          )}

          {/* Active Alarms */}
          {data?.triggeredAlarms?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleRed}>TRIGGERED ALARMS</Text>
              {data.triggeredAlarms.map((alarm: any) => (
                <TouchableOpacity
                  key={alarm.alarmName}
                  style={[styles.itemCard, { borderColor: 'rgba(248, 81, 73, 0.5)' }]}
                  onPress={() => navigation.navigate('AlarmDetail', { alarmName: alarm.alarmName })}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{alarm.alarmName}</Text>
                    <StatusBadge status="ALARM" />
                  </View>
                  <Text style={styles.itemSubtitle} numberOfLines={2}>{alarm.stateReason}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent EC2 Instances */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>INSTANCES ({selectedRegion.toUpperCase()})</Text>
              <Text style={styles.sectionCount}>{data?.recentInstances?.length ?? 0} shown</Text>
            </View>

            {data?.recentInstances?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>No EC2 instances found in {selectedRegion}</Text>
              </View>
            ) : (
              data?.recentInstances?.map((inst: any) => (
                <TouchableOpacity
                  key={inst.id}
                  style={styles.itemCard}
                  onPress={() => navigation.navigate('EC2Detail', { instanceId: inst.id })}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName} numberOfLines={1}>{inst.name}</Text>
                    <StatusBadge status={inst.state} />
                  </View>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemMetaText}>{inst.id}</Text>
                    <Text style={styles.itemMetaDot}>•</Text>
                    <Text style={[styles.itemMetaText, { color: colors.awsBlue }]}>{inst.type}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  scroll: {
    padding: 16,
    paddingBottom: 24
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  section: {
    marginTop: 10
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  sectionTitleRed: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.statusRedText,
    letterSpacing: 0.5,
    marginBottom: 8
  },
  sectionCount: {
    fontSize: 11,
    color: colors.textMuted
  },
  itemCard: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8
  },
  itemSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace'
  },
  itemMetaDot: {
    color: colors.textMuted,
    marginHorizontal: 6
  },
  emptyCard: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    alignItems: 'center'
  },
  emptyCardText: {
    fontSize: 12,
    color: colors.textMuted
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16
  },
  retryButton: {
    borderColor: colors.awsOrange,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4
  },
  retryText: {
    color: colors.awsOrange,
    fontSize: 12,
    fontWeight: 'bold'
  }
});
