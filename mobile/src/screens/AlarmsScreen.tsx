import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const AlarmsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { selectedRegion } = useAuth();
  const [alarms, setAlarms] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, inAlarm: 0, ok: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');

  const filterOptions = ['ALL', 'ALARM', 'OK', 'INSUFFICIENT_DATA'];

  useEffect(() => {
    loadAlarms();
  }, [selectedRegion, stateFilter]);

  const loadAlarms = async () => {
    setLoading(true);
    try {
      const stateParam = stateFilter === 'ALL' ? '' : `&state=${stateFilter}`;
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const res = await api.get(`/api/aws/cloudwatch/alarms?region=${selectedRegion}${stateParam}${searchParam}`);
      if (res.data?.success) {
        setAlarms(res.data.data.alarms);
        setCounts({
          total: res.data.data.total,
          inAlarm: res.data.data.inAlarm,
          ok: res.data.data.ok
        });
      }
    } catch (_e) {}
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CLOUDWATCH ALARMS</Text>
        <Text style={styles.headerSubtitle}>Region: {selectedRegion}</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search alarm name..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadAlarms}
            returnKeyType="search"
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {filterOptions.map(opt => {
            const isSelected = stateFilter === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.filterChip,
                  isSelected && {
                    borderColor: opt === 'ALARM' ? colors.statusRed : opt === 'OK' ? colors.statusGreen : colors.awsOrange,
                    backgroundColor: opt === 'ALARM' ? 'rgba(248, 81, 73, 0.2)' : opt === 'OK' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(236, 114, 17, 0.2)'
                  }
                ]}
                onPress={() => setStateFilter(opt)}
              >
                <Text style={[styles.filterChipText, isSelected && { color: colors.textPrimary, fontWeight: 'bold' }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>{alarms.length} ALARMS</Text>
          <Text style={styles.countMeta}>
            <Text style={{ color: colors.statusRedText, fontWeight: 'bold' }}>In Alarm: {counts.inAlarm}</Text>
            {' • '}
            <Text style={{ color: colors.statusGreenText }}>OK: {counts.ok}</Text>
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.awsOrange} />
        </View>
      ) : alarms.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No CloudWatch Alarms"
          message={search || stateFilter !== 'ALL' ? 'No alarms matched your filter.' : `No CloudWatch alarms configured in ${selectedRegion}.`}
        />
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={item => item.alarmName}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                item.stateValue === 'ALARM' && { borderColor: 'rgba(248, 81, 73, 0.5)' }
              ]}
              onPress={() => navigation.navigate('AlarmDetail', { alarmName: item.alarmName, alarmData: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.alarmName} numberOfLines={1}>{item.alarmName}</Text>
                <StatusBadge status={item.stateValue} />
              </View>

              <Text style={styles.reasonText} numberOfLines={2}>{item.stateReason}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metricNamespaceText}>
                  {item.namespace || 'AWS'} / {item.metricName || 'Metric'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
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
    padding: 16,
    paddingBottom: 8,
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
    color: colors.textSecondary,
    marginBottom: 10
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10
  },
  filterChip: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  countText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  countMeta: {
    fontSize: 10,
    color: colors.textMuted
  },
  list: {
    padding: 16,
    gap: 10
  },
  card: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  alarmName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8
  },
  reasonText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metricNamespaceText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

