import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const TopBar: React.FC<{ title: string; onRefresh?: () => void }> = ({ title, onRefresh }) => {
  const { connections, selectedConnection, selectedRegion, availableRegions, selectConnection, selectRegion } = useAuth();
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Text style={styles.brandOps}>OPS</Text>
          <Text style={styles.brandRadar}>RADAR</Text>
          <View style={styles.badgeDivider} />
          <Text style={styles.screenTitle}>{title.toUpperCase()}</Text>
        </View>

        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.iconButton}>
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.selectorsRow}>
        {/* Account Selector Button */}
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => connections.length > 0 && setAccountModalVisible(true)}
        >
          <Ionicons name="cloud-outline" size={14} color={colors.awsOrange} style={{ marginRight: 6 }} />
          <Text style={styles.selectorText} numberOfLines={1}>
            {selectedConnection?.accountName || (connections.length === 0 ? 'No Account' : 'Select Account')}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Region Selector Button */}
        <TouchableOpacity
          style={styles.regionButton}
          onPress={() => setRegionModalVisible(true)}
        >
          <Ionicons name="globe-outline" size={13} color={colors.awsBlue} style={{ marginRight: 4 }} />
          <Text style={styles.regionText}>{selectedRegion}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.textSecondary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Account Modal */}
      <Modal visible={accountModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAccountModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select AWS Account</Text>
            <FlatList
              data={connections}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item._id === selectedConnection?._id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    selectConnection(item);
                    setAccountModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{item.accountName}</Text>
                  <Text style={styles.modalItemId}>{item.accountId} • {item.defaultRegion}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Region Modal */}
      <Modal visible={regionModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRegionModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select AWS Region</Text>
            <FlatList
              data={availableRegions}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item === selectedRegion && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    selectRegion(item);
                    setRegionModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgDark,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandOps: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1
  },
  brandRadar: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.awsOrange,
    letterSpacing: 1
  },
  badgeDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
    marginHorizontal: 10
  },
  screenTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  iconButton: {
    padding: 6,
    backgroundColor: colors.surfaceDark,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 8
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  selectorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  regionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'monospace'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    maxHeight: 360
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 4
  },
  modalItemSelected: {
    backgroundColor: 'rgba(236, 114, 17, 0.15)'
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  modalItemId: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2
  }
});
