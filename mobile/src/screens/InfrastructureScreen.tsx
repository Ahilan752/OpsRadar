import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const InfrastructureScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { selectedRegion } = useAuth();
  const [instances, setInstances] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, running: 0, stopped: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');

  const filterOptions = ['ALL', 'RUNNING', 'STOPPED', 'PENDING', 'TERMINATED'];

  useEffect(() => {
    loadInstances();
  }, [selectedRegion, stateFilter]);

  const loadInstances = async () => {
    setLoading(true);
    try {
      const stateParam = stateFilter === 'ALL' ? '' : `&state=${stateFilter}`;
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const res = await api.get(`/api/aws/ec2/instances?region=${selectedRegion}${stateParam}${searchParam}`);
      if (res.data?.success) {
        setInstances(res.data.data.instances);
        setCounts({
          total: res.data.data.total,
          running: res.data.data.running,
          stopped: res.data.data.stopped
        });
      }
    } catch (_e) {}
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EC2 INFRASTRUCTURE</Text>
        <Text style={styles.headerSubtitle}>Region: {selectedRegion}</Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search instance name, ID, or IP..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={loadInstances}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); loadInstances(); }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {filterOptions.map(opt => {
            const isSelected = stateFilter === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setStateFilter(opt)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>{instances.length} INSTANCES FOUND</Text>
          <Text style={styles.countMeta}>Running: {counts.running} • Stopped: {counts.stopped}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.awsOrange} />
        </View>
      ) : instances.length === 0 ? (
        <EmptyState
          icon="hardware-chip-outline"
          title="No EC2 Instances"
          message={search || stateFilter !== 'ALL' ? 'No instances matched your filter.' : `No EC2 instances exist in ${selectedRegion}.`}
        />
      ) : (
        <FlatList
          data={instances}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EC2Detail', { instanceId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.instanceName} numberOfLines={1}>{item.name}</Text>
                <StatusBadge status={item.state} />
              </View>

              <View style={styles.detailsRow}>
                <View>
                  <Text style={styles.idText}>ID: {item.id}</Text>
                  <Text style={styles.metaText}>Type: {item.type} • AZ: {item.availabilityZone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>

              {(item.publicIp || item.privateIp) && (
                <View style={styles.ipsRow}>
                  {item.publicIp && <Text style={styles.publicIp}>Public: {item.publicIp}</Text>}
                  {item.privateIp && <Text style={styles.privateIp}>Private: {item.privateIp}</Text>}
                </View>
              )}
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
    flexWrap: 'wrap',
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
  filterChipActive: {
    borderColor: colors.awsOrange,
    backgroundColor: 'rgba(236, 114, 17, 0.2)'
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.awsOrange,
    fontWeight: 'bold'
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2
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
  instanceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  idText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace'
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  ipsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  publicIp: {
    fontSize: 11,
    color: colors.awsBlue,
    fontFamily: 'monospace'
  },
  privateIp: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

