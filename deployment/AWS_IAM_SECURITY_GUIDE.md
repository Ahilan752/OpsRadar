# OpsRadar Security & AWS Cross-Account Architecture Guide

This document outlines the security architecture, IAM policies, and trust boundaries implemented in **OpsRadar**.

---

## 1. Zero-Credential Architecture Principle

OpsRadar is architected with a **Zero Permanent Credential Storage** model:
- The mobile application **never** receives or handles AWS Access Keys, Secret Keys, or Session Tokens.
- The MongoDB database **never** stores AWS credentials or temporary STS session tokens.
- AWS authentication is strictly governed by **AWS STS `AssumeRole`** with cryptographically secure External IDs.

---

## 2. IAM Cross-Account Role Connection Workflow

```
+------------------+         +--------------------+         +-------------------+
|  OpsRadar Mobile |  HTTPS  |  OpsRadar Backend  |   STS   |   Customer AWS    |
|   (Android App)  | ------> |    (Express/Node)  | ------> |    (IAM Role)     |
+------------------+         +--------------------+         +-------------------+
```

### Steps:
1. **Initiation**: User opens "Connect AWS Account". The backend cryptographically generates a unique `ExternalId` (`opsradar-<uuid4>-<randomHex>`) and returns the customer IAM trust policy.
2. **Role Creation**: Customer creates the IAM Role (`OpsRadarReadOnlyRole`) in their AWS account using the CloudFormation template or the AWS IAM Console.
3. **Role Validation**: Customer enters their 12-digit AWS Account ID and Role ARN (`arn:aws:iam::<accountId>:role/OpsRadarReadOnlyRole`).
4. **AssumeRole Execution**: The OpsRadar Backend assumes the role via `sts:AssumeRole` requiring the matching `sts:ExternalId`.
5. **Temporary Credentials**: Temporary in-memory session credentials (15-minute duration) are issued by AWS and used strictly to retrieve monitoring data.

---

## 3. Customer IAM Trust Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:role/OpsRadarBackendExecutionRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "<UNIQUE_CUSTOMER_EXTERNAL_ID>"
        }
      }
    }
  ]
}
```

---

## 4. Customer IAM Read-Only Permissions Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "OpsRadarEC2ReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "ec2:DescribeTags",
        "ec2:DescribeInstanceStatus"
      ],
      "Resource": "*"
    },
    {
      "Sid": "OpsRadarCloudWatchReadOnly",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:DescribeAlarms",
        "cloudwatch:DescribeAlarmHistory",
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "OpsRadarCostExplorerReadOnly",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 5. Security Guardrails

| Requirement | Implementation |
| :--- | :--- |
| **Least Privilege** | Only `Describe*`, `Get*`, and `List*` read-only actions are requested. |
| **No Mutating Actions** | No `ec2:StartInstances`, `ec2:StopInstances`, `ec2:TerminateInstances`, or CloudWatch mutating calls. |
| **Confused Deputy Prevention** | Mandatory unique `ExternalId` condition on every assume role request. |
| **Account ID Validation** | Strict check ensuring the AWS Account ID in the Role ARN matches the provided Account ID. |
| **Multi-Tenant Isolation** | Database queries filter by `userId` and `AWSConnection` ownership on every API call. |
| **Log Sanitization** | Automatic redaction regex filters preventing tokens or credentials from appearing in server logs. |
| **At-Rest Encryption** | AES-256-GCM encryption with authenticated tags for sensitive connection metadata. |
