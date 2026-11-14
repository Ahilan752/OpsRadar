import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, connections, serverUrl, updateServerUrl, logout, isDemoMode } = useAuth();
  const [alarmNotifs, setAlarmNotifs] = useState(true);
  const [infraNotifs, setInfraNotifs] = useState(true);
  const [editingUrl, setEditingUrl] = useState(serverUrl);
  const [urlSaved, setUrlSaved] = useState(false);

  const handleSaveUrl = async () => {
    await updateServerUrl(editingUrl.trim());
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of OpsRadar?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.headerTitle}>SETTINGS & CONFIGURATION</Text>

      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Ionicons name="sparkles" size={16} color={colors.awsOrange} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.demoBannerTitle}>DEMO PREVIEW ACTIVE</Text>
            <Text style={styles.demoBannerText}>Exploring preloaded AWS telemetry. Sign out anytime to connect your live backend.</Text>
          </View>
        </View>
      )}

      {/* User Profile Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>AUTHENTICATED USER</Text>
        <Text style={styles.userName}>{user?.name || 'DevOps Engineer'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@company.com'}</Text>
      </View>

      {/* Server URL Config Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>OPSRADAR BACKEND SERVER URL</Text>
        <Text style={styles.helperText}>Configure host IP when testing on mobile over local Wi-Fi:</Text>
        <View style={styles.urlInputRow}>
          <TextInput
            style={styles.urlInput}
            value={editingUrl}
            onChangeText={setEditingUrl}
            autoCapitalize="none"
            placeholder="http://192.168.1.37:5000"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrl}>
            <Text style={styles.saveUrlBtnText}>{urlSaved ? 'Saved!' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connected AWS Accounts */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.cardHeader}>CONNECTED AWS ACCOUNTS</Text>
        <TouchableOpacity
          style={styles.addAccountBtn}
          onPress={() => navigation.navigate('ConnectAccount')}
        >
          <Ionicons name="add" size={16} color={colors.awsOrange} />
          <Text style={styles.addAccountText}>Add Account</Text>
        </TouchableOpacity>
      </View>

      {connections.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>No AWS accounts connected</Text>
        </View>
      ) : (
        connections.map(conn => (
          <View key={conn._id} style={styles.accountCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>{conn.accountName}</Text>
              <Text style={styles.accountId}>ID: {conn.accountId}</Text>
              <Text style={styles.accountRegion}>Default Region: {conn.defaultRegion}</Text>
            </View>
            <StatusBadge status={conn.connectionStatus} />
          </View>
        ))
      )}

      {/* Notifications */}
      <Text style={[styles.cardHeader, { marginTop: 14 }]}>NOTIFICATIONS</Text>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>CloudWatch Alarm Alerts</Text>
            <Text style={styles.toggleSub}>Push notification when alarm triggers</Text>
          </View>
          <Switch
            value={alarmNotifs}
            onValueChange={setAlarmNotifs}
            trackColor={{ false: colors.border, true: 'rgba(236, 114, 17, 0.4)' }}
            thumbColor={alarmNotifs ? colors.awsOrange : colors.textMuted}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Infrastructure State Changes</Text>
            <Text style={styles.toggleSub}>Notify when EC2 instances stop</Text>
          </View>
          <Switch
            value={infraNotifs}
            onValueChange={setInfraNotifs}
            trackColor={{ false: colors.border, true: 'rgba(236, 114, 17, 0.4)' }}
            thumbColor={infraNotifs ? colors.awsOrange : colors.textMuted}
          />
        </View>
      </View>

      {/* Security Architecture Info */}
      <View style={[styles.card, { marginTop: 4 }]}>
        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={20} color={colors.statusGreen} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Zero Permanent Credentials</Text>
            <Text style={styles.securityText}>
              OpsRadar connects via AWS STS AssumeRole with read-only permissions and an External ID. AWS root credentials and secret keys are never requested or stored.
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.statusRed} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark
  },
  scroll: {
    padding: 16,
    paddingBottom: 40
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 14
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2632',
    borderColor: colors.awsOrange,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14
  },
  demoBannerTitle: {
    color: colors.awsOrange,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  demoBannerText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  card: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8
  },
  urlInput: {
    flex: 1,
    backgroundColor: colors.bgDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace'
  },
  saveUrlBtn: {
    backgroundColor: colors.awsOrange,
    paddingHorizontal: 14,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveUrlBtnText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 12
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addAccountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.awsOrange,
    marginLeft: 4
  },
  accountCard: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  accountName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  accountId: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2
  },
  accountRegion: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  emptyCard: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10
  },
  emptyCardText: {
    fontSize: 12,
    color: colors.textMuted
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  toggleSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  securityText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 4
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDark,
    borderColor: colors.statusRed,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 12,
    marginTop: 14
  },
  logoutText: {
    color: colors.statusRed,
    fontWeight: 'bold',
    fontSize: 13
  }
});

