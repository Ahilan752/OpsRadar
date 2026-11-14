import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app';
import { AWSConnection } from '../models/AWSConnection';
import { config } from '../config/environment';

describe('User Multi-Tenant Isolation & Security Tests', () => {
  const userA_Id = '60c72b2f9b1d8b2badbee111';
  const userB_Id = '60c72b2f9b1d8b2badbee222';

  const userA_Token = jwt.sign({ userId: userA_Id, email: 'userA@opsradar.io' }, config.jwt.secret);
  const userB_Token = jwt.sign({ userId: userB_Id, email: 'userB@opsradar.io' }, config.jwt.secret);

  const userA_ConnectionId = '60c72b2f9b1d8b2badbeeAAA';

  beforeAll(() => {
    (AWSConnection as any).findOne = jest.fn().mockImplementation((query: any) => {
      // If userA queries their own connection, it is found
      if (query && query._id === userA_ConnectionId && query.userId === userA_Id) {
        return Promise.resolve({
          _id: userA_ConnectionId,
          userId: userA_Id,
          accountName: "User A's Production Account",
          accountId: '111111111111',
          roleArn: 'arn:aws:iam::111111111111:role/OpsRadarUserA',
          externalId: 'opsradar-user-a-ext-id',
          defaultRegion: 'us-east-1',
          connectionStatus: 'CONNECTED'
        });
      }
      // If userB tries to query userA's connection, findOne with query.userId = userB returns null!
      return Promise.resolve(null);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("User B should be strictly FORBIDDEN from accessing User A's AWS connection details", async () => {
    const res = await request(app)
      .get(`/api/aws/connections/${userA_ConnectionId}`)
      .set('Authorization', `Bearer ${userB_Token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("User B should be strictly PREVENTED from querying EC2 instances using User A's connection header", async () => {
    const res = await request(app)
      .get('/api/aws/ec2/instances')
      .set('Authorization', `Bearer ${userB_Token}`)
      .set('x-aws-connection-id', userA_ConnectionId);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONNECTION_NOT_FOUND');
  });

  it("User B should be strictly PREVENTED from querying Dashboard using User A's connection header", async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${userB_Token}`)
      .set('x-aws-connection-id', userA_ConnectionId);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONNECTION_NOT_FOUND');
  });
});
