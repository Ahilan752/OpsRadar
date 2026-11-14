import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MOCK_CONNECTIONS,
  MOCK_REGIONS,
  MOCK_DASHBOARD_OVERVIEW,
  MOCK_EC2_INSTANCES,
  MOCK_EC2_METRICS,
  MOCK_ALARMS,
  MOCK_BILLING,
  MOCK_NOTIFICATION_PREFS,
  MOCK_USER
} from '../data/mockData';

export const DEFAULT_SERVER_URL = 'http://192.168.1.37:5000';

export const api = axios.create({
  baseURL: DEFAULT_SERVER_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Bearer token and active AWS connection ID
api.interceptors.request.use(async (config) => {
  const isDemo = await AsyncStorage.getItem('opsradar_demo_mode');
  if (isDemo === 'true') {
    // Intercept with mock adapter for seamless offline/preview mode
    config.adapter = async (cfg) => {
      const url = cfg.url || '';
      const method = (cfg.method || 'get').toLowerCase();
      let mockData: any = { success: true, data: null };

      if (url.includes('/api/aws/connections') && url.includes('/regions')) {
        mockData = { success: true, data: { regions: MOCK_REGIONS } };
      } else if (method === 'post' && url.includes('/api/aws/connections/validate')) {
        mockData = {
          success: true,
          data: {
            _id: 'conn-live-001',
            accountName: 'Connected AWS Account',
            accountId: '123456789012',
            roleArn: 'arn:aws:iam::123456789012:role/OpsRadarReadOnlyRole',
            defaultRegion: 'us-east-1',
            connectionStatus: 'CONNECTED'
          }
        };
      } else if (method === 'post' && url.includes('/api/aws/connections')) {
        mockData = {
          success: true,
          data: {
            connectionId: 'conn-live-001',
            externalId: 'opsradar-ee836de4-8fde-4d34-92c9-3cde38bc1781-91791c01ee9a796c',
            backendPrincipalArn: 'arn:aws:iam::111122223333:role/OpsRadarBackendExecutionRole'
          }
        };
      } else if (url.includes('/api/aws/connections')) {
        mockData = { success: true, data: MOCK_CONNECTIONS };
      } else if (url.includes('/api/dashboard/overview')) {
        mockData = { success: true, data: MOCK_DASHBOARD_OVERVIEW };
      } else if (url.includes('/api/monitoring/ec2/') && url.includes('/metrics')) {
        mockData = { success: true, data: MOCK_EC2_METRICS };
      } else if (url.match(/\/api\/monitoring\/ec2\/i-[a-z0-9]+/)) {
        const id = url.split('/api/monitoring/ec2/')[1]?.split('?')[0];
        const inst = MOCK_EC2_INSTANCES.find(i => i.instanceId === id) || MOCK_EC2_INSTANCES[0];
        mockData = {
          success: true,
          data: {
            ...inst,
            metrics: MOCK_EC2_METRICS
          }
        };
      } else if (url.includes('/api/monitoring/ec2')) {
        mockData = { success: true, data: MOCK_EC2_INSTANCES };
      } else if (url.match(/\/api\/monitoring\/alarms\/.+/)) {
        const rawName = url.split('/api/monitoring/alarms/')[1]?.split('?')[0];
        const alarmName = decodeURIComponent(rawName);
        const alarm = MOCK_ALARMS.find(a => a.alarmName === alarmName) || MOCK_ALARMS[0];
        mockData = {
          success: true,
          data: {
            ...alarm,
            history: [
              {
                historyItemType: 'StateUpdate',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                historySummary: 'Alarm updated from OK to ALARM'
              },
              {
                historyItemType: 'Action',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                historySummary: 'Notification published to SNS topic opsradar-alerts'
              }
            ]
          }
        };
      } else if (url.includes('/api/monitoring/alarms')) {
        mockData = { success: true, data: MOCK_ALARMS };
      } else if (url.includes('/api/monitoring/billing')) {
        mockData = { success: true, data: MOCK_BILLING };
      } else if (url.includes('/api/notifications/preferences')) {
        mockData = { success: true, data: MOCK_NOTIFICATION_PREFS };
      } else if (url.includes('/api/auth/register') || url.includes('/api/auth/login')) {
        mockData = {
          success: true,
          data: {
            user: MOCK_USER,
            tokens: { accessToken: 'demo-token-123', refreshToken: 'demo-refresh-123' }
          }
        };
      }

      return {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: cfg
      };
    };
  }

  const token = await AsyncStorage.getItem('opsradar_token');
  const connectionId = await AsyncStorage.getItem('opsradar_connection_id');
  const customUrl = await AsyncStorage.getItem('opsradar_server_url');

  if (customUrl) {
    config.baseURL = customUrl;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (connectionId) {
    config.headers['x-aws-connection-id'] = connectionId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});
