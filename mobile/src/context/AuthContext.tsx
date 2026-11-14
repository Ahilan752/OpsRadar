import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, DEFAULT_SERVER_URL } from '../api/client';
import { MOCK_USER, MOCK_CONNECTIONS, MOCK_REGIONS } from '../data/mockData';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AWSConnection {
  _id: string;
  accountName: string;
  accountId: string;
  roleArn: string;
  externalId: string;
  defaultRegion: string;
  connectionStatus: 'PENDING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED';
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  serverUrl: string;
  connections: AWSConnection[];
  selectedConnection: AWSConnection | null;
  selectedRegion: string;
  availableRegions: string[];
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  selectConnection: (connection: AWSConnection) => Promise<void>;
  selectRegion: (region: string) => Promise<void>;
  refreshConnections: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
  enableDemoMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);

  const [connections, setConnections] = useState<AWSConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<AWSConnection | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');
  const [availableRegions, setAvailableRegions] = useState<string[]>([
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-south-1'
  ]);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('opsradar_server_url');
      if (savedUrl) setServerUrl(savedUrl);

      const demoFlag = await AsyncStorage.getItem('opsradar_demo_mode');
      if (demoFlag === 'true') {
        setIsDemoMode(true);
        setUser(MOCK_USER);
        setIsLoggedIn(true);
        setConnections(MOCK_CONNECTIONS);
        setSelectedConnection(MOCK_CONNECTIONS[0]);
        setSelectedRegion('us-east-1');
        return;
      }

      const token = await AsyncStorage.getItem('opsradar_token');
      const savedUser = await AsyncStorage.getItem('opsradar_user');
      const savedRegion = await AsyncStorage.getItem('opsradar_region');
      const savedConnId = await AsyncStorage.getItem('opsradar_connection_id');

      if (savedRegion) setSelectedRegion(savedRegion);

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
        await loadConnections(savedConnId);
      }
    } catch (e) {
      console.warn('Failed to restore session', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnections = async (preferredId?: string | null) => {
    try {
      const isDemo = (await AsyncStorage.getItem('opsradar_demo_mode')) === 'true' || isDemoMode;
      const res = await api.get('/api/aws/connections');
      let conns: AWSConnection[] = res.data?.success && res.data.data?.length > 0 ? res.data.data : [];
      if (conns.length === 0 && isDemo) {
        conns = MOCK_CONNECTIONS;
      }
      setConnections(conns);

      let active = conns.find(c => c._id === preferredId);
      if (!active && conns.length > 0) {
        active = conns[0];
      }

      if (active) {
        setSelectedConnection(active);
        setSelectedRegion(active.defaultRegion || 'us-east-1');
        await AsyncStorage.setItem('opsradar_connection_id', active._id);
        loadRegions(active._id);
      }
    } catch (e) {
      console.warn('Failed to load AWS connections', e);
      if (isDemoMode) {
        setConnections(MOCK_CONNECTIONS);
        setSelectedConnection(MOCK_CONNECTIONS[0]);
      }
    }
  };

  const loadRegions = async (connectionId: string) => {
    try {
      const res = await api.get(`/api/aws/connections/${connectionId}/regions`);
      if (res.data?.success && res.data.data?.regions?.length > 0) {
        setAvailableRegions(res.data.data.regions);
      }
    } catch (_e) {}
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.post('/api/auth/login', { email, password: pass });
      if (res.data?.success) {
        const { user: userData, tokens } = res.data.data;
        await AsyncStorage.setItem('opsradar_token', tokens.accessToken);
        await AsyncStorage.setItem('opsradar_refresh_token', tokens.refreshToken);
        await AsyncStorage.setItem('opsradar_user', JSON.stringify(userData));

        setUser(userData);
        setIsLoggedIn(true);
        await loadConnections();
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Network connection failed'
      };
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const res = await api.post('/api/auth/register', { name, email, password: pass });
      if (res.data?.success) {
        const { user: userData, tokens } = res.data.data;
        await AsyncStorage.setItem('opsradar_token', tokens.accessToken);
        await AsyncStorage.setItem('opsradar_refresh_token', tokens.refreshToken);
        await AsyncStorage.setItem('opsradar_user', JSON.stringify(userData));

        setUser(userData);
        setIsLoggedIn(true);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Registration failed'
      };
    }
  };

  const enableDemoMode = async () => {
    await AsyncStorage.setItem('opsradar_demo_mode', 'true');
    await AsyncStorage.setItem('opsradar_token', 'demo-token-123');
    await AsyncStorage.setItem('opsradar_user', JSON.stringify(MOCK_USER));
    await AsyncStorage.setItem('opsradar_connection_id', MOCK_CONNECTIONS[0]._id);
    await AsyncStorage.setItem('opsradar_region', 'us-east-1');
    setIsDemoMode(true);
    setUser(MOCK_USER);
    setIsLoggedIn(true);
    setConnections(MOCK_CONNECTIONS);
    setSelectedConnection(MOCK_CONNECTIONS[0]);
    setSelectedRegion('us-east-1');
    setAvailableRegions(MOCK_REGIONS);
  };

  const logout = async () => {
    try {
      if (!isDemoMode) {
        await api.post('/api/auth/logout');
      }
    } catch (_e) {}
    await AsyncStorage.multiRemove([
      'opsradar_token',
      'opsradar_refresh_token',
      'opsradar_user',
      'opsradar_connection_id',
      'opsradar_demo_mode'
    ]);
    setIsDemoMode(false);
    setUser(null);
    setIsLoggedIn(false);
    setSelectedConnection(null);
    setConnections([]);
  };

  const selectConnection = async (conn: AWSConnection) => {
    setSelectedConnection(conn);
    setSelectedRegion(conn.defaultRegion || 'us-east-1');
    await AsyncStorage.setItem('opsradar_connection_id', conn._id);
    loadRegions(conn._id);
  };

  const selectRegion = async (region: string) => {
    setSelectedRegion(region);
    await AsyncStorage.setItem('opsradar_region', region);
  };

  const updateServerUrl = async (url: string) => {
    setServerUrl(url);
    await AsyncStorage.setItem('opsradar_server_url', url);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        isDemoMode,
        serverUrl,
        connections,
        selectedConnection,
        selectedRegion,
        availableRegions,
        login,
        register,
        logout,
        selectConnection,
        selectRegion,
        refreshConnections: () => loadConnections(selectedConnection?._id),
        updateServerUrl,
        enableDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
