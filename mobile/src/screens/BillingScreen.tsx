import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { SpendingChart } from '../components/SpendingChart';
import { EmptyState } from '../components/EmptyState';

export const BillingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/aws/billing/summary');
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load billing data');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Cannot load AWS billing');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBilling();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 6 }]}>
        <View>
          <Text style={styles.headerTitle}>AWS BILLING & COST EXPLORER</Text>
          <Text style={styles.headerSubtitle}>Real-time cloud spending & forecasts</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadBilling}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && !data ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.awsOrange} />
        </View>
      ) : error && !data ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Cost Explorer Notice"
          message={error}
          buttonText="Retry"
          onPressButton={loadBilling}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.awsOrange} />}
        >
          {/* Summary Cards */}
          <View style={styles.gridRow}>
            <StatCard
              title="Month-to-Date Spend"
              value={`${data?.currency || 'USD'} ${data?.currentMonthToDate ?? 0}`}
              subtitle="Updated daily by AWS"
              highlightColor={colors.awsOrange}
            />
            <StatCard
              title="Previous Month Total"
              value={`${data?.currency || 'USD'} ${data?.lastMonthTotal ?? 0}`}
              subtitle="Full billing cycle"
              highlightColor={colors.textPrimary}
            />
          </View>

          {data?.forecastCost && (
            <View style={{ marginBottom: 12 }}>
              <StatCard
                title="End-of-Month Forecast"
                value={`${data.currency} ${data.forecastCost}`}
                subtitle="Projected AWS monthly cost"
                highlightColor={colors.awsBlue}
              />
            </View>
          )}

          {/* Daily Spending Trend Chart */}
          {data?.dailyCosts?.length > 0 && (
            <SpendingChart
              title={`Daily Spend (${data.currency})`}
              currency={data.currency}
              dailyCosts={data.dailyCosts}
            />
          )}

          {/* Service-wise Breakdown */}
          <Text style={styles.sectionTitle}>SERVICE-WISE SPENDING BREAKDOWN</Text>

          {data?.serviceBreakdown?.map((item: any, idx: number) => (
            <View key={idx} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{item.service}</Text>
                <Text style={styles.serviceAmount}>
                  {data.currency} {item.amount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(Math.max(item.percentage, 3), 100)}%` }
                  ]}
                />
              </View>

              <Text style={styles.servicePercentage}>
                {item.percentage}% of total AWS spending
              </Text>
            </View>
          ))}

          {/* 24-hour Delay Notice */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              ℹ️ {data?.reportingDelayNotice || 'AWS Cost Explorer data is updated by AWS once per day and may reflect up to a 24-hour reporting delay.'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary
  },
  refreshBtn: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary
  },
  scroll: {
    padding: 16,
    paddingBottom: 32
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 10
  },
  serviceCard: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1
  },
  serviceAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: 'monospace'
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.awsOrange
  },
  servicePercentage: {
    fontSize: 10,
    color: colors.textMuted
  },
  noticeBox: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 8
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

