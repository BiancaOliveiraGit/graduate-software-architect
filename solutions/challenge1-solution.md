# Claims Online Integration Solution

## Scenario
A mid-sized insurance company wants to modernize its claims processing to be uploaded online.

## Business Objective

- Enable customers to submit claims online which includes photos and PDF documents.
- Enable internal claims processing teams to access and process claims efficiently. 
- Trackable claims progress for both customers and internal teams.
- Receive email notifications for claim status changes.
- Capability to submit claims 24/7

## Assumptions

- Existing Frontend portal for customer onboarding
- Current claims submission is manual and paper-based.
- Existing API email system is in place for notifications.
- Managing claims approval to remain a manual process for now, with potential for automation in the future.
- Existing Azure SQL Database Server.
- Existing Authentication system to Frontend for customers and internal teams.

## Constraints & Budget

- Tight delivery window.
- Moderate budget with emphasis on cloud native solutions.

## Functional Requirements

#### Customers
- Submit claims with attachments photos and PDFs.
- Receive email notifications for claim status changes.
- Trackable claims progress through the portal.
- Claims submission to be available 24/7.
#### Claims Processing Team
- View, update, and manage (approve/reject) claims.
- Add comments
- Search historical claims and filter by status, date, and customer.


## Non-Functional Requirements

- 99.95% availability.
- Must operate within Australian only.
- Data retained for seven years.
- Personally Identifiable Information (PII) must be encrypted.
- Must support growth from 5000 to 20000 customers over the next 5 years.
- Disaster recovery plan with RPO of 15 minutes and RTO of 4 hours.

## Azure Architecture

- Azure Front Door for global load balancing and SSL termination.
- Azure Functions for lightweight processing and scalability.
- Azure Functions deployed into two regions for high availability.
- Service Bus Topics for claims submissions.
- Service Bus Topics for claim status email notifications.
- Azure Blob Storage for storing attachments (photos and PDFs).
- Azure SQL Database for claims data storage.
- Azure Blob Storage backup policies for disaster recovery.
- Azure Key Vault for secrets management.
- Azure Monitor and Application Insights for observability and logging. 
- Spoke Network architecture with private endpoints for secure communication between services.
- Azure Managed Identities for secure access to Azure resources.

![Architecture Diagram](./architecture-solution/sd-architecture-challenge1.svg)


## Security Considerations

- Azure Managed Identities between resources.
- Encrypted transport and storage.
- Private networking where possible.

## Observability

- Azure Monitor and Application Insights for logging and monitoring.
- Attach 3rd party observability system to injest logs and metrics for advanced analytics.
- Dashboards in 3rd party observability system for claims processing team to monitor system health and performance.

## Disaster Recovery

- Azure Blob Storage backup policies for disaster recovery.
- Azure SQL Database backup and restore capabilities.
- Geo-replication for high availability.
- Geo-replication for Service Bus Namespace for high availability, fast failover.

## Risks

- Third-party Email API downtime.
- Message backlog during bursts.
- Additional cost due to redundancy and scaling.
- Service Bus in DR will have messages in flight loss when primary region fails over to DR region.

## Decision Matrix

| Option | Pros | Cons | Estimated Cost | Decision |
| --- | --- | --- | --- | --- |
| Managed API Gateway | Full API Management | Required per region for high availability | High | Not preferred |
| Front Door | Global not regional. Built in load balancer & WAF | Higher operational overhead. Security exposure to Internet | Low | Recommended |
| Flexible Serverless Functions | Scales automatically | Cold start latency | Low | Recommended |
| App Service Plan | Predictable cost | Higher cost | Medium | Not preferred |
| Blob Storage | Redundancy policies available | Limited query capabilities | Low | Recommended |
| Service Bus with Topics | Message durability & integrationdecoupling | Higher operational overhead | Medium | Recommended |

## Availability and Disaster Recovery
99.95% required availability equates to 4.38 hours of downtime per year. The proposed architecture is designed to meet this requirement through the use of Azure Front Door, Azure Functions deployed in multiple regions, and Service Bus with geo-replication.

| Component | Availability | Redundancy | Recovery Strategy | Single Point of Failure |
| --- | --- | --- | --- | --- |
| Azure Front Door | 99.99% | Global Load Balancing | Automatic failover to secondary region | No |
| Azure Functions | 99.95% | Deployed in two regions | Automatic failover | No |
| Service Bus | 99.95% | Geo-replication | Automatic failover | No |
| Azure Blob Storage | 99.99% | Geo-redundant storage | Automatic failover | No |
| Azure SQL Database | 99.99% | Geo-replication | Automatic failover | No |

The combined availability of the architecture is approximately 99.87%.
However, by deploying Azure Functions in an active-active patternand Service Bus in an active-passive with fast failover multi‑region configuration, the system no longer relies on a single serial dependency chain.
This parallel redundancy significantly increases effective availability and enables the solution to meet or exceed the 99.95% availability requirement

## Disaster Recovery Plan

RPO of 15 minutes and RTO of 4 hours
Configuration of Azure Blob Storage and Azure SQL Database for geo-replication ensures that data is replicated to a secondary region. In the event of a primary region failure, the system can failover to the secondary region, minimizing downtime and data loss.

## Load Metrics
#### Assumptions
- 5000 customers in the first year, growing to 20000 over 5 years
- Requests per user per day: 20
- Peak factor: 3× (traffic is not flat)
- Database data per user: 50 KB/day (rows, logs, metadata)
- Blob data per user: 200 KB/day (documents, small files, images)

| Metric	| 5,000 users | 20,000 users |
| --- | --- | --- |
| Avg RPS	| ~1–2	| ~4–5 |
| Peak RPS	| ~3–5	| ~12–15 |
| DB growth/year	| ~90 GB	| ~360–370 GB |
| Blob growth/year	| ~350–400 GB	| ~1.4–1.5 TB |

## Stakeholder Questions

- Which systems must be integrated first?
- What is the budget for the solution?

## Architecture Review Board
[Architecture Review Board](./review-board/review-challenge1.md)
