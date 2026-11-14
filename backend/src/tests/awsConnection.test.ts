import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app';
import { config } from '../config/environment';
import { AWSConnectionService } from '../services/awsConnection.service';

describe('AWS IAM Role Connection & STS Tests', () => {
  const testUserId = '60c72b2f9b1d8b2badbee555';
  const testToken = jwt.sign({ userId: testUserId, email: 'test@opsradar.io' }, config.jwt.secret);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/aws/connections - should initiate connection instructions and return valid trust policy', async () => {
    const mockExternalId = 'opsradar-11112222-3333-4444-555566667777-abcdef12';
    jest.spyOn(AWSConnectionService, 'initiateConnection').mockResolvedValue({
      connectionId: '60c72b2f9b1d8b2badbee999' as any,
      accountName: 'Production AWS',
      externalId: mockExternalId,
      backendPrincipalArn: config.aws.backendRoleArn,
      backendAccountId: config.aws.backendAccountId,
      suggestedRoleName: 'OpsRadarReadOnlyRole',
      trustPolicyJson: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: config.aws.backendRoleArn },
            Action: 'sts:AssumeRole',
            Condition: { StringEquals: { 'sts:ExternalId': mockExternalId } }
          }
        ]
      }),
      permissionsPolicyJson: '{}',
      cloudFormationTemplateUrl: '/cloudformation/OpsRadarReadOnlyRole.template.yaml'
    });

    const res = await request(app)
      .post('/api/aws/connections')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        accountName: 'Production AWS',
        defaultRegion: 'us-east-1'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.externalId).toBe(mockExternalId);
    expect(res.body.data.backendPrincipalArn).toBe(config.aws.backendRoleArn);

    const trustPolicy = JSON.parse(res.body.data.trustPolicyJson);
    expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    expect(trustPolicy.Statement[0].Condition.StringEquals['sts:ExternalId']).toBe(mockExternalId);
  });

  it('POST /api/aws/connections/validate - should reject when Role ARN does not match Account ID', async () => {
    const res = await request(app)
      .post('/api/aws/connections/validate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        connectionId: '60c72b2f9b1d8b2badbee999',
        accountId: '123456789012',
        roleArn: 'arn:aws:iam::999999999999:role/MismatchedAccountRole',
        defaultRegion: 'us-east-1'
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/aws/connections/validate - should complete connection when STS AssumeRole succeeds', async () => {
    jest.spyOn(AWSConnectionService, 'completeConnection').mockResolvedValue({
      _id: '60c72b2f9b1d8b2badbee999',
      userId: testUserId as any,
      accountName: 'Production AWS',
      accountId: '123456789012',
      roleArn: 'arn:aws:iam::123456789012:role/OpsRadarReadOnly',
      externalId: 'opsradar-11112222-3333-4444-555566667777-abcdef12',
      defaultRegion: 'us-east-1',
      connectionStatus: 'CONNECTED',
      lastValidatedAt: new Date()
    } as any);

    const res = await request(app)
      .post('/api/aws/connections/validate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        connectionId: '60c72b2f9b1d8b2badbee999',
        accountId: '123456789012',
        roleArn: 'arn:aws:iam::123456789012:role/OpsRadarReadOnly',
        defaultRegion: 'us-east-1'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.connectionStatus).toBe('CONNECTED');
  });
});
