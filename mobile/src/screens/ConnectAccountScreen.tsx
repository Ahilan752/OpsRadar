import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme/colors';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ConnectAccountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { refreshConnections } = useAuth();

  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState('');
  const [defaultRegion, setDefaultRegion] = useState('us-east-1');
  const [accountId, setAccountId] = useState('');
  const [roleArn, setRoleArn] = useState('');

  const [initiationData, setInitiationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard!`);
  };

  // Step 1: Initiate
  const handleInitiate = async () => {
    if (!accountName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/aws/connections', {
        accountName: accountName.trim(),
        defaultRegion: defaultRegion.trim() || 'us-east-1'
      });
      if (res.data?.success) {
        setInitiationData(res.data.data);
        setStep(2);
      } else {
        setError(res.data?.message || 'Initiation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Cannot reach server');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete & Validate STS
  const handleComplete = async () => {
    if (accountId.trim().length !== 12 || !roleArn.trim().startsWith('arn:aws:iam::')) {
      setError('Please provide a valid 12-digit Account ID and Role ARN');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/aws/connections/validate', {
        connectionId: initiationData.connectionId,
        accountId: accountId.trim(),
        roleArn: roleArn.trim(),
        defaultRegion: defaultRegion.trim() || 'us-east-1'
      });
      if (res.data?.success) {
        await refreshConnections();
        Alert.alert('Success', 'AWS account connected successfully via STS AssumeRole!', [
          { text: 'Open Dashboard', onPress: () => navigation.navigate('Dashboard') }
        ]);
      } else {
        setError(res.data?.message || 'STS AssumeRole failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to assume AWS role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Connect AWS Account</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step Indicator */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.stepIndicator}>STEP {step} OF 3</Text>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'Account Setup' : step === 2 ? 'IAM Role Creation' : 'Validate & Connect'}
          </Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {step === 1 && (
          <View>
            <Text style={styles.title}>Identify Your AWS Account</Text>
            <Text style={styles.subtitle}>
              Enter a recognizable name for this AWS environment and choose the default region to monitor.
            </Text>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Production AWS, Staging"
                placeholderTextColor={colors.textMuted}
                value={accountName}
                onChangeText={setAccountName}
              />

              <Text style={styles.inputLabel}>Default Region</Text>
              <TextInput
                style={styles.input}
                placeholder="us-east-1"
                placeholderTextColor={colors.textMuted}
                value={defaultRegion}
                onChangeText={setDefaultRegion}
              />

              <TouchableOpacity
                style={[styles.primaryButton, (!accountName.trim() || loading) && styles.buttonDisabled]}
                onPress={handleInitiate}
                disabled={!accountName.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Generate Connection Credentials</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && initiationData && (
          <View>
            <Text style={styles.title}>Create IAM Monitoring Role</Text>
            <Text style={styles.subtitle}>
              OpsRadar uses AWS cross-account role assumption with an External ID. Create an IAM Role in your AWS console with the details below.
            </Text>

            {/* External ID Card */}
            <View style={styles.card}>
              <View style={styles.copyRow}>
                <Text style={styles.codeLabel}>UNIQUE EXTERNAL ID (REQUIRED)</Text>
                <TouchableOpacity onPress={() => copyText(initiationData.externalId, 'External ID')}>
                  <Ionicons name="copy-outline" size={18} color={colors.awsOrange} />
                </TouchableOpacity>
              </View>
              <Text style={styles.codeValueOrange}>{initiationData.externalId}</Text>
            </View>

            {/* Principal ARN Card */}
            <View style={styles.card}>
              <View style={styles.copyRow}>
                <Text style={styles.codeLabel}>BACKEND PRINCIPAL ARN</Text>
                <TouchableOpacity onPress={() => copyText(initiationData.backendPrincipalArn, 'Principal ARN')}>
                  <Ionicons name="copy-outline" size={18} color={colors.awsOrange} />
                </TouchableOpacity>
              </View>
              <Text style={styles.codeValue}>{initiationData.backendPrincipalArn}</Text>
            </View>

            {/* Copy Policy Buttons */}
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => copyText(initiationData.trustPolicyJson, 'IAM Trust Policy')}
            >
              <Ionicons name="copy-outline" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.outlineButtonText}>Copy IAM Trust Policy JSON</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => copyText(initiationData.permissionsPolicyJson, 'Read-Only Policy')}
            >
              <Ionicons name="copy-outline" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.outlineButtonText}>Copy Read-Only Permissions Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
              <Text style={styles.primaryButtonText}>I've Created the Role → Enter Role ARN</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Verify AWS Role Connection</Text>
            <Text style={styles.subtitle}>
              Enter your 12-digit AWS Account ID and the Role ARN created in your account.
            </Text>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>AWS Account ID (12 digits)</Text>
              <TextInput
                style={styles.input}
                placeholder="123456789012"
                placeholderTextColor={colors.textMuted}
                value={accountId}
                onChangeText={setAccountId}
                keyboardType="numeric"
                maxLength={12}
              />

              <Text style={styles.inputLabel}>IAM Role ARN</Text>
              <TextInput
                style={styles.input}
                placeholder="arn:aws:iam::123456789012:role/OpsRadarReadOnlyRole"
                placeholderTextColor={colors.textMuted}
                value={roleArn}
                onChangeText={setRoleArn}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (accountId.length !== 12 || !roleArn.startsWith('arn:aws:iam::') || loading) && styles.buttonDisabled
                ]}
                onPress={handleComplete}
                disabled={accountId.length !== 12 || !roleArn.startsWith('arn:aws:iam::') || loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>Validate & Connect via STS</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  backBtn: {
    marginRight: 12,
    padding: 4
  },
  navTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary
  },
  scroll: {
    padding: 16,
    paddingBottom: 32
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.awsOrange,
    letterSpacing: 1
  },
  stepLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.awsOrange
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 16
  },
  card: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.bgDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 14
  },
  primaryButton: {
    backgroundColor: colors.awsOrange,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13
  },
  buttonDisabled: {
    opacity: 0.5
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 11,
    borderRadius: 6,
    marginBottom: 10
  },
  outlineButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary
  },
  codeValueOrange: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: colors.awsOrange
  },
  codeValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textPrimary
  },
  errorText: {
    fontSize: 12,
    color: colors.statusRed,
    marginBottom: 14
  }
});
