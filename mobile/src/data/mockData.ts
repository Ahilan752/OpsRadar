export const MOCK_USER = {
  id: 'demo-user-001',
  name: 'Ahilan (Cloud Architect)',
  email: 'ahilan@opsradar.io'
};

export const MOCK_CONNECTIONS = [
  {
    _id: 'conn-prod-001',
    accountName: 'Production AWS (Main)',
    accountId: '123456789012',
    roleArn: 'arn:aws:iam::123456789012:role/OpsRadarReadOnlyRole',
    externalId: 'opsradar-prod-ext-4491',
    defaultRegion: 'us-east-1',
    connectionStatus: 'CONNECTED' as const
  },
  {
    _id: 'conn-staging-002',
    accountName: 'Staging Environment',
    accountId: '987654321098',
    roleArn: 'arn:aws:iam::987654321098:role/OpsRadarReadOnlyRole',
    externalId: 'opsradar-stg-ext-7712',
    defaultRegion: 'us-west-2',
    connectionStatus: 'CONNECTED' as const
  }
];

export const MOCK_REGIONS = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-south-1'];

export const MOCK_DASHBOARD_OVERVIEW = {
  summary: {
    totalInstances: 4,
    runningInstances: 3,
    stoppedInstances: 1,
    activeAlarms: 1,
    totalAlarms: 3,
    monthToDateCost: 1248.50,
    lastMonthCost: 1180.20,
    currency: 'USD'
  },
  recentAlarms: [
    {
      alarmName: 'Production-API-HighCPU',
      state: 'ALARM',
      reason: 'Threshold Crossed: 1 out of 1 datapoints (88.4%) was greater than threshold (80.0%)',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2'
    },
    {
      alarmName: 'RDS-StorageSpace-Low',
      state: 'OK',
      reason: 'FreeStorageSpace is 42.5 GB (Threshold: 10 GB)',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      metricName: 'FreeStorageSpace',
      namespace: 'AWS/RDS'
    }
  ],
  topInstances: [
    {
      instanceId: 'i-0a8b9c0d1e2f3a4b',
      name: 'prod-api-server-01',
      type: 't3.xlarge',
      state: 'running',
      cpuUtilization: 88.4
    },
    {
      instanceId: 'i-0987654321fedcba',
      name: 'db-replica-reader',
      type: 'r6g.large',
      state: 'running',
      cpuUtilization: 34.2
    },
    {
      instanceId: 'i-1122334455667788',
      name: 'background-worker-node',
      type: 'c6i.xlarge',
      state: 'running',
      cpuUtilization: 19.8
    }
  ],
  costTrend: [
    { date: '11-01', amount: 41.20 },
    { date: '11-03', amount: 43.50 },
    { date: '11-05', amount: 39.80 },
    { date: '11-07', amount: 45.10 },
    { date: '11-09', amount: 42.00 },
    { date: '11-11', amount: 46.80 },
    { date: '11-13', amount: 44.30 }
  ]
};

export const MOCK_EC2_INSTANCES = [
  {
    instanceId: 'i-0a8b9c0d1e2f3a4b',
    name: 'prod-api-server-01',
    instanceType: 't3.xlarge',
    state: 'running',
    availabilityZone: 'us-east-1a',
    publicIp: '54.210.12.89',
    privateIp: '10.0.1.45',
    launchTime: '2026-10-15T08:30:00.000Z',
    cpuUtilization: 88.4,
    tags: {
      Environment: 'Production',
      Project: 'OpsRadar',
      Owner: 'InfraTeam'
    }
  },
  {
    instanceId: 'i-0987654321fedcba',
    name: 'db-replica-reader',
    instanceType: 'r6g.large',
    state: 'running',
    availabilityZone: 'us-east-1b',
    publicIp: null,
    privateIp: '10.0.2.112',
    launchTime: '2026-09-20T14:15:00.000Z',
    cpuUtilization: 34.2,
    tags: {
      Environment: 'Production',
      Component: 'Database'
    }
  },
  {
    instanceId: 'i-1122334455667788',
    name: 'background-worker-node',
    instanceType: 'c6i.xlarge',
    state: 'running',
    availabilityZone: 'us-east-1c',
    publicIp: '52.90.77.201',
    privateIp: '10.0.3.78',
    launchTime: '2026-11-01T10:00:00.000Z',
    cpuUtilization: 19.8,
    tags: {
      Environment: 'Production',
      Service: 'QueueWorker'
    }
  },
  {
    instanceId: 'i-9988776655443322',
    name: 'staging-cache-redis',
    instanceType: 't3.medium',
    state: 'stopped',
    availabilityZone: 'us-east-1a',
    publicIp: null,
    privateIp: '10.0.1.99',
    launchTime: '2026-11-10T11:45:00.000Z',
    cpuUtilization: 0.0,
    tags: {
      Environment: 'Staging'
    }
  }
];

export const MOCK_EC2_METRICS = {
  cpu: [
    { timestamp: '16:00', value: 45.2 },
    { timestamp: '16:15', value: 52.8 },
    { timestamp: '16:30', value: 68.4 },
    { timestamp: '16:45', value: 74.1 },
    { timestamp: '17:00', value: 88.4 },
    { timestamp: '17:15', value: 85.9 }
  ],
  networkIn: [
    { timestamp: '16:00', value: 1204000 },
    { timestamp: '16:15', value: 1850000 },
    { timestamp: '16:30', value: 3400000 },
    { timestamp: '16:45', value: 4800000 },
    { timestamp: '17:00', value: 6100000 },
    { timestamp: '17:15', value: 5900000 }
  ],
  networkOut: [
    { timestamp: '16:00', value: 4200000 },
    { timestamp: '16:15', value: 6800000 },
    { timestamp: '16:30', value: 12400000 },
    { timestamp: '16:45', value: 18900000 },
    { timestamp: '17:00', value: 24500000 },
    { timestamp: '17:15', value: 23100000 }
  ]
};

export const MOCK_ALARMS = [
  {
    alarmName: 'Production-API-HighCPU',
    state: 'ALARM',
    stateReason: 'Threshold Crossed: 1 out of 1 datapoints (88.4%) was greater than the threshold (80.0%).',
    stateUpdatedTimestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metricName: 'CPUUtilization',
    namespace: 'AWS/EC2',
    statistic: 'Average',
    period: 300,
    evaluationPeriods: 1,
    threshold: 80.0,
    comparisonOperator: 'GreaterThanThreshold',
    dimensions: [
      { name: 'InstanceId', value: 'i-0a8b9c0d1e2f3a4b' }
    ]
  },
  {
    alarmName: 'RDS-StorageSpace-Low',
    state: 'OK',
    stateReason: 'Threshold not crossed: FreeStorageSpace is 42.5 GB.',
    stateUpdatedTimestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    metricName: 'FreeStorageSpace',
    namespace: 'AWS/RDS',
    statistic: 'Average',
    period: 300,
    evaluationPeriods: 1,
    threshold: 10.0,
    comparisonOperator: 'LessThanThreshold',
    dimensions: [
      { name: 'DBInstanceIdentifier', value: 'prod-aurora-postgres-cluster' }
    ]
  },
  {
    alarmName: 'Lambda-Errors-Production',
    state: 'INSUFFICIENT_DATA',
    stateReason: 'No datapoints were received for the Lambda invocation metrics.',
    stateUpdatedTimestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    metricName: 'Errors',
    namespace: 'AWS/Lambda',
    statistic: 'Sum',
    period: 60,
    evaluationPeriods: 1,
    threshold: 5.0,
    comparisonOperator: 'GreaterThanThreshold',
    dimensions: [
      { name: 'FunctionName', value: 'image-resizer-worker' }
    ]
  }
];

export const MOCK_BILLING = {
  currency: 'USD',
  monthToDateCost: 1248.50,
  lastMonthCost: 1180.20,
  dailyCosts: [
    { date: '11-01', amount: 41.20 },
    { date: '11-02', amount: 42.10 },
    { date: '11-03', amount: 43.50 },
    { date: '11-04', amount: 40.80 },
    { date: '11-05', amount: 39.80 },
    { date: '11-06', amount: 44.00 },
    { date: '11-07', amount: 45.10 },
    { date: '11-08', amount: 43.90 },
    { date: '11-09', amount: 42.00 },
    { date: '11-10', amount: 46.10 },
    { date: '11-11', amount: 46.80 },
    { date: '11-12', amount: 45.20 },
    { date: '11-13', amount: 44.30 },
    { date: '11-14', amount: 43.70 }
  ],
  serviceBreakdown: [
    { serviceName: 'Amazon Elastic Compute Cloud - Compute', amount: 620.40, percentage: 49.7 },
    { serviceName: 'Amazon Relational Database Service', amount: 345.80, percentage: 27.7 },
    { serviceName: 'Amazon Simple Storage Service', amount: 128.30, percentage: 10.3 },
    { serviceName: 'AmazonCloudWatch', amount: 82.50, percentage: 6.6 },
    { serviceName: 'AWS Key Management Service', amount: 41.00, percentage: 3.3 },
    { serviceName: 'Others', amount: 30.50, percentage: 2.4 }
  ]
};

export const MOCK_NOTIFICATION_PREFS = {
  alarmNotifications: true,
  stateChangeNotifications: true,
  dailyCostDigest: false,
  fcmTokenConfigured: true
};

