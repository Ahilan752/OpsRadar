import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register, enableDemoMode } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) return;
    setLoading(true);
    setError(null);
    const res = await register(name.trim(), email.trim(), password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
        <Text style={styles.screenHeader}>Create Account</Text>
        <Text style={styles.subtitle}>OpsRadar AWS Infrastructure Monitoring</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Work Email</Text>
          <TextInput
            style={styles.input}
            placeholder="engineer@company.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password (min 8 chars, 1 uppercase, 1 digit)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, (!name || !email || password.length < 8 || loading) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={!name || !email || password.length < 8 || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR EXPLORE</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={enableDemoMode}
          >
            <Ionicons name="sparkles-outline" size={16} color={colors.awsOrange} style={{ marginRight: 6 }} />
            <Text style={styles.demoButtonText}>Explore Demo Mode (Instant Preview)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  screenHeader: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28
  },
  card: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 20
  },
  label: {
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
    fontSize: 14,
    marginBottom: 14
  },
  errorText: {
    fontSize: 12,
    color: colors.statusRed,
    marginBottom: 12
  },
  button: {
    backgroundColor: colors.awsOrange,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: 10,
    letterSpacing: 1
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E2632',
    borderColor: colors.awsOrange,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 6
  },
  demoButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  linkText: {
    color: colors.awsOrange,
    fontWeight: 'bold',
    fontSize: 13
  }
});
