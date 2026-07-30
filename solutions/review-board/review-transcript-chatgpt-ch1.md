# Architecture Review Board — Challenge 1

## Verdict: **Approve with conditions**

This is a strong first architecture submission. You have moved beyond simply listing Azure services and have attempted to connect business requirements, operational constraints, service selection, resilience, capacity, risks, and trade-offs.

Your design shows good instincts around:

* Asynchronous claims processing.
* Separating documents from transactional data.
* Managed identities and private connectivity.
* Multi-region recovery.
* Monitoring and operational visibility.
* Explicitly documenting assumptions, risks, and stakeholder questions.

The architecture is directionally sound, but I would not yet approve it for implementation. The most important gaps are requirements traceability, inconsistent active-active versus active-passive design, data-residency clarification, and an incomplete end-to-end claims workflow.

---

# 1. What you did well

## Requirements are clearly organised

You separated business objectives, assumptions, functional requirements, non-functional requirements, risks, and decisions. That is good architecture discipline.

The solution clearly captures submission of photos and PDFs, claim tracking, status notifications, staff processing, comments, and historical searching.  

This makes the design much easier to review than an architecture diagram presented without context.

## Good choice of asynchronous messaging

Using Service Bus for claims submissions is a sensible choice because it:

* Decouples the external submission API from downstream processing.
* Protects the application during temporary database or processor failures.
* Supports retries and dead-letter handling.
* Smooths bursts in claim submissions.
* Creates a future path toward automated processing.

You also correctly identified message backlog as a risk. 

## Appropriate separation of data types

Using:

* Blob Storage for photos and PDFs.
* Azure SQL Database for claims, statuses, comments, and searchable metadata.

…is a reasonable separation.

Blob Storage is appropriate for large unstructured attachments, while SQL supports staff queries, status filtering, customer relationships, and transactional updates. Your load estimates also demonstrate that you considered both database and document growth rather than only request volume. 

## Security foundations are heading in the right direction

You included:

* Managed identities.
* Encryption in transit and at rest.
* Private endpoints.
* Key Vault.
* Private networking.

These are appropriate foundational controls. 

The diagram also attempts to show services inside network boundaries rather than treating Azure as one unrestricted network.

## You included architectural trade-offs

The decision matrix is one of the strongest parts of your submission. It shows that you considered alternatives rather than choosing services arbitrarily. 

This is exactly what an architecture review board and interview panel want to see.

---

# 2. Highest-priority issue: requirements drift

The original challenge specified:

* Growth to **250,000 customers**.
* A maximum budget of **AUD $12,000 per month**.

Your design instead states growth from 5,000 to **20,000 customers** and replaces the explicit budget with “moderate budget.”  

This is a significant architecture-review issue.

An architect must not silently change a requirement, even when the revised number seems more realistic. You can challenge or qualify it, but the document must preserve the stated requirement.

### Required correction

Change the requirement back to:

> The solution must support growth from 5,000 to 250,000 customers.

Then calculate at least three capacity points:

| Stage        | Customers | Estimated average RPS |  Estimated peak RPS |
| ------------ | --------: | --------------------: | ------------------: |
| Initial      |     5,000 |     approximately 1–2 |   approximately 3–5 |
| Intermediate |    20,000 |     approximately 4–5 | approximately 12–15 |
| Target       |   250,000 |      approximately 58 |   approximately 174 |

Those request figures follow your assumption of 20 requests per customer per day and a 3× peak factor. However, you should also state that requests are unlikely to be evenly spread across all 24 hours.

Under your current storage assumptions, 250,000 customers would produce roughly:

* **4.6 TB of SQL growth per year**
* **18.25 TB of Blob growth per year**

That should trigger a discussion about whether “50 KB per user per day” and “200 KB per user per day” are credible. Claims attachments could be much larger than 200 KB.

The AUD $12,000 monthly constraint should also appear in your decision matrix and cost assessment.

---

# 3. The logical claims workflow is incomplete

The architecture lists services, but it does not clearly describe the complete sequence of events.

A reviewer needs to understand:

1. How a claim ID is created.
2. How the browser uploads large files.
3. When the claim becomes officially submitted.
4. How attachment metadata is associated with the claim.
5. How duplicate submissions are prevented.
6. How staff update claim status.
7. How a status update generates an email.
8. What happens when an email fails.
9. How the customer retrieves the latest status.

## Recommended submission pattern

A stronger flow would be:

1. Customer authenticates through the existing portal.
2. Portal calls a Claims API through Front Door.
3. Claims API creates a draft claim and returns:

   * Claim ID.
   * Short-lived upload authorization for Blob Storage.
4. Browser uploads attachments directly to Blob Storage.
5. Portal calls `Submit Claim`.
6. API validates attachment references and publishes a `ClaimSubmitted` command.
7. Claims processor consumes the message and updates SQL.
8. Status changes produce a `ClaimStatusChanged` event.
9. Notification subscriber calls the existing email API.
10. Customer and staff query the Claims API for current status.

### Why this is better

It prevents large PDF and image files from being routed through Azure Functions and Service Bus.

Service Bus messages should contain references such as:

```text
claimId
customerId
attachmentBlobUris
submittedAt
correlationId
```

They should not contain the actual PDF or photo bytes.

This design also creates a clear boundary between commands, events, and document storage.

---

# 4. Authentication and authorisation need to appear in the architecture

Your assumptions say that an existing authentication system is available for customers and internal teams. 

That is a valid assumption, but the diagram still needs to show the trust boundary.

At minimum, add:

* Customer identity provider.
* Workforce identity provider.
* Claims API token validation.
* Customer role or scope.
* Claims assessor role.
* Claims approver role.
* Administrative role.

You must also describe **object-level authorisation**:

> A valid customer token is not sufficient by itself. The API must verify that the authenticated customer owns the requested claim.

Otherwise, one customer could potentially request another customer’s claim by changing a claim identifier.

For staff, consider separating:

* Read access.
* Assessment/update access.
* Approval/rejection permission.

That provides appropriate separation of duties.

---

# 5. Front Door and the Australia-only requirement

Your design uses Azure Front Door for global routing and TLS termination. 

That is reasonable for resilience, WAF protection, and regional failover. However, it introduces an important stakeholder question because Front Door is a **global resource**, with its configuration distributed to edge locations worldwide. ([Microsoft Learn][1])

You need to clarify what “must operate only in Australia” means:

### Possible interpretations

**Interpretation A — stored business data must remain in Australia**

Your regional application, SQL, Service Bus, and Blob resources can be restricted to Australian Azure regions. Front Door may still be acceptable, subject to security and compliance review.

**Interpretation B — all data processing, routing, telemetry and caching must remain in Australia**

A global edge service may not satisfy the requirement. Microsoft documents that global edge services such as Front Door can transfer or cache customer data at global edge locations in some regulatory-boundary contexts. ([Microsoft Learn][2])

You should therefore add this stakeholder question:

> Does the Australia-only requirement apply only to persistent data storage, or also to traffic processing, caching, logs, metadata and support access?

Also configure:

* Caching disabled for claims APIs.
* No PII in URLs or query strings.
* Front Door log scrubbing.
* WAF policy.
* Origin access restricted to Front Door.
* End-to-end HTTPS, not just client-to-edge TLS.

Microsoft provides log-scrubbing controls specifically to prevent sensitive values such as PII appearing in Front Door logs. ([Microsoft Learn][3])

---

# 6. Active-active versus active-passive is inconsistent

Your document says:

> Azure Functions deployed into two regions for high availability.

It later describes the Functions as active-active.  

However, the diagram labels parts of Region B as **passive DR**.

You must select and clearly document one model.

## Recommended model for this challenge

### Public Claims API: active-active

* Function/API deployment in both Australian regions.
* Front Door routes to both healthy origins.
* Both instances are stateless.
* Both use the same logical database and messaging endpoints.

### Background processing: active-passive initially

* Processor runs in the primary region.
* Secondary processor is deployed but disabled or scaled to zero/minimum.
* DR automation activates it after failover.
* Prevents duplicate concurrent consumption and keeps operational behaviour simpler.

You could run processors active-active, but then you must explicitly design:

* Idempotent message handling.
* Duplicate detection.
* Concurrency control.
* Safe database updates.
* Poison-message handling.
* Ordering requirements.

For a moderate-budget, early-stage claims platform, active-active APIs with active-passive processing is a defendable compromise.

---

# 7. Service Bus terminology and DR risk need updating

Your solution refers both to “geo-replication” and to the risk that messages in flight will be lost during Service Bus failover. 

Azure Service Bus now distinguishes between:

* **Geo-Disaster Recovery**, which replicates namespace metadata but not messages.
* **Geo-Replication**, which can replicate metadata and message data.

Microsoft currently recommends Geo-Replication for most Service Bus disaster-recovery scenarios, and Premium supports replication of messages, message state and properties. ([Microsoft Learn][4])

Therefore, your risk is correct **only if you choose metadata-only Geo-DR** or if replication lag/failover conditions leave recent data unreplicated.

### Required correction

State the exact choice:

> Use Service Bus Premium Geo-Replication between Australian regions, with asynchronous or synchronous replication selected according to latency, cost and RPO requirements.

Then document:

* Required Premium tier.
* Number of Messaging Units.
* Replication mode.
* Expected failover procedure.
* RPO expectations.
* Cost of running the replica.
* Whether clients use an alias or another stable endpoint.
* What happens to producer and consumer applications during failover.

Premium Geo-Replication also affects your cost model because each replica runs with corresponding Messaging Unit capacity. ([Microsoft Learn][5])

---

# 8. Availability analysis needs revision

You state that the component SLAs combine to approximately 99.87%, and then infer that parallel redundancy raises effective availability above 99.95%. 

The instinct is good, but this is not sufficiently demonstrated.

## Why simple SLA multiplication is inadequate

A customer submission depends on more than the listed resource SLAs. It may require:

* Authentication provider.
* DNS.
* Front Door.
* API Function.
* Storage.
* SQL.
* Service Bus.
* Email API, depending on the journey.
* Network and private DNS.
* Application deployment correctness.

You must first define what “available” means.

For example:

> The claims submission journey is available when an authenticated customer can create a claim, upload all required attachments, submit it successfully, and receive a durable confirmation within 30 seconds.

Then define separate service-level indicators:

* Successful claims submission rate.
* Claim-status query success rate.
* Staff update success rate.
* Notification delivery latency.
* Message-processing delay.

The 99.95% target should apply to a defined customer journey, not simply to a collection of Azure resource SLAs.

## Failover is not automatically guaranteed

The table marks every component as having no single point of failure and “automatic failover.” 

That is too absolute.

Questions remain:

* Who initiates Storage account failover?
* Is SQL configured with a failover group?
* What failover policy and grace period are used?
* Does the secondary processor start automatically?
* Are private DNS records and endpoints valid in Region B?
* Does Service Bus failover require an operational action?
* Are deployment artefacts and configuration available in both regions?
* Has the email provider been tested from the secondary region?

Azure Storage regional failover requires a deliberate design and can involve customer-managed failover rather than universally automatic failover. ([Microsoft Learn][6])

Azure SQL failover groups provide a better-defined mechanism for cross-region replication, listener endpoints, and failover than the generic term “geo-replication.” ([Microsoft Learn][7])

---

# 9. RTO and RPO require a component-level plan

Your document restates the overall RPO of 15 minutes and RTO of four hours, but it does not prove that every critical component can meet them. 

Create a matrix like this:

| Component        | DR mechanism                         |              Target RPO | Target RTO | Failover mode                | Owner             |
| ---------------- | ------------------------------------ | ----------------------: | ---------: | ---------------------------- | ----------------- |
| Claims API       | Pre-deployed second region           |                       0 |    <15 min | Front Door health routing    | Platform team     |
| SQL Database     | Failover group                       |                 <15 min |    <1 hour | Automatic/manual policy      | Database team     |
| Blob attachments | GZRS/RA-GZRS or separate strategy    |                 <15 min |   <2 hours | Account/application failover | Platform team     |
| Service Bus      | Premium Geo-Replication              |                 ≤15 min |    <1 hour | Planned/manual workflow      | Integration team  |
| Processor        | Warm standby deployment              |    0 configuration loss |    <1 hour | Automated scale/enable       | Application team  |
| Key Vault        | Regional vault per region            | Configuration dependent |    <1 hour | Application switches locally | Security/platform |
| Monitoring       | Regional ingestion plus central view |             Best effort |    <1 hour | Preconfigured                | Operations        |

Geo-redundant Storage uses asynchronous cross-region replication, so you must validate whether the selected redundancy option supports the required RPO rather than simply assuming it does. ([Microsoft Learn][8])

Also include:

* DR runbook.
* Quarterly failover exercise.
* Restore test.
* Failback process.
* Decision authority for declaring disaster.
* Evidence that the four-hour target has been tested.

---

# 10. Seven-year retention is not fully designed

The requirement says data must be retained for seven years. 

That is not the same as saying backups exist.

You need to distinguish:

### Operational retention

Claims and documents remain available to authorised business users for seven years.

### Backup retention

The system can recover from deletion, corruption, or ransomware.

### Immutable regulatory retention

Records cannot be modified or deleted before the retention period expires, when required by policy or regulation.

Recommended considerations:

* Blob lifecycle management.
* Blob versioning.
* Soft delete.
* Point-in-time restore where applicable.
* Immutable Blob Storage or legal hold if required.
* Azure SQL long-term retention backups.
* Archive tier strategy for closed claims.
* Deletion or anonymisation after retention expires.
* Encryption-key lifecycle covering the entire retention period.

Azure SQL supports long-term backup retention for periods extending up to ten years, but this needs to be explicitly configured. ([Microsoft Learn][9])

---

# 11. Diagram review

## Strengths

The diagram successfully communicates:

* Two Azure regions.
* Front Door routing.
* Function-based processing.
* Service Bus.
* SQL and Blob storage.
* A third-party email dependency.
* A DR region.
* Broad network boundaries.

That is a useful foundation.

## Improvements required

### Add actors and entry points

The diagram needs:

* Customer.
* Claims staff.
* Existing frontend portal.
* Authentication provider.
* Browser-to-Blob upload flow.
* Staff administration flow.

Currently, the cloud icon above Front Door does not tell the reviewer who is using the system.

### Add a legend

Several Azure icons are unlabeled or only indirectly labelled. A reviewer should not have to identify services purely from icons.

Label every resource with both:

* Logical purpose.
* Azure service.

For example:

> Claims Submission API
> Azure Functions

### Clarify message flow

The arrows around Functions and Service Bus are difficult to follow.

Use numbered arrows:

1. Create claim.
2. Upload attachments.
3. Submit claim command.
4. Process claim.
5. Update database.
6. Publish status event.
7. Send notification.

Use distinct visual conventions for:

* Synchronous HTTPS.
* Asynchronous Service Bus messages.
* Database connections.
* Replication.
* Monitoring/telemetry.

### Fix the hub-and-spoke representation

The diagram labels a Service Bus/SQL area as “Hub Network,” but a hub network generally contains shared connectivity services such as:

* Azure Firewall.
* VPN/ExpressRoute gateway.
* Bastion.
* Private DNS resolver.
* Shared DNS and routing.

Application data services normally sit behind private endpoints associated with workload spokes, or their private endpoints are placed in dedicated endpoint subnets according to the network design.

Either:

* Show a genuine hub-and-spoke topology, or
* Rename the boundaries to “Claims workload VNet — Region A/B.”

Do not introduce hub-and-spoke merely because it sounds enterprise-grade. At this scale, two simple regional workload VNets with appropriate private endpoints may be easier to operate.

### Show private endpoints explicitly

Your text says private endpoints are used, but the diagram should show:

* Storage private endpoint.
* SQL private endpoint.
* Service Bus private endpoint.
* Key Vault private endpoint.
* Private DNS zones or their logical role.
* Public network access disabled where supported.

### Show security and monitoring as cross-cutting concerns

Key Vault and Application Insights currently appear as floating icons.

Connect them to the workloads and label:

* Managed identity access to Key Vault.
* Application telemetry to Application Insights.
* Diagnostic settings to Log Analytics or the third-party platform.
* Alerts to the operations team.

### Show DR direction and state

Use clear replication arrows from Region A to Region B and label:

* SQL failover group.
* Storage replication mode.
* Service Bus Geo-Replication.
* Configuration deployment.
* Active, standby, or read-only state.

Right now, the diagram mixes a “GEO-DR failover” label with a “GEO-DR pair” and a general “DR replica,” making it hard to know which technology is being used.

---

# 12. Cost and complexity challenge

Your design uses:

* Azure Front Door.
* Functions in two regions.
* Service Bus Premium with geographic resilience.
* SQL geographic replication.
* Geo-redundant storage.
* Private endpoints.
* Key Vault.
* Application Insights.
* A third-party observability platform.

This could fit within AUD $12,000 per month, but it is not automatically a low-cost architecture.

The largest cost concerns are likely to be:

* Service Bus Premium and replicated capacity.
* SQL secondary capacity.
* Functions hosting choice and private networking.
* Private endpoint and network traffic charges.
* Log ingestion and retention.
* Third-party observability licensing.
* Long-term storage and SQL growth.
* Front Door/WAF requests and data processing.

Your decision matrix labels Front Door as “Low” and Service Bus as “Medium,” but those labels need estimated monthly ranges.

An architect does not need a perfect cost estimate at this stage, but should provide an order-of-magnitude model:

| Category                  | Initial estimate | Growth driver                          |
| ------------------------- | ---------------: | -------------------------------------- |
| Application compute       |            $X–$Y | Executions and plan size               |
| SQL primary and secondary |            $X–$Y | Tier, storage and replicas             |
| Service Bus               |            $X–$Y | Premium Messaging Units and replicas   |
| Blob Storage              |            $X–$Y | Stored TB, transactions and redundancy |
| Observability             |            $X–$Y | Log volume and retention               |
| Networking/Front Door     |            $X–$Y | Requests and data transfer             |
| Contingency               |           15–20% | Unmodelled usage                       |

---

# 13. Risk register additions

Your current risks are valid, but add:

| Risk                                 | Impact                                   | Mitigation                                                        |
| ------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------- |
| Duplicate message processing         | Duplicate emails or claim updates        | Idempotency key, message ID and database uniqueness constraint    |
| Poison claim message                 | Processing blockage or repeated failures | Dead-letter queue, alert and replay procedure                     |
| Malware uploaded in attachments      | Security incident                        | File-type validation, size limits and malware scanning workflow   |
| PII exposed in logs                  | Privacy breach                           | Structured logging policy, redaction and Front Door log scrubbing |
| Cross-customer claim access          | Serious privacy breach                   | Object-level authorisation on every claim request                 |
| SQL and Blob inconsistency           | Claim references missing attachments     | Draft/submitted state machine and reconciliation process          |
| Regional dependencies not replicated | DR failure                               | Deployment manifest and DR readiness validation                   |
| Third-party email outage             | Notifications delayed                    | Retry, circuit breaker, dead-lettering and operational dashboard  |
| Excessive observability costs        | Budget breach                            | Sampling, filtering, retention limits and cost alerts             |
| Seven-year data becomes unreadable   | Compliance failure                       | Restore testing and long-term key-management plan                 |

---

# 14. Recommended revision priorities

## Must fix before approval

1. Restore the 250,000-customer and AUD $12,000 requirements.
2. Draw the complete customer and staff journeys.
3. Add authentication and object-level authorisation.
4. Resolve active-active versus active-passive inconsistencies.
5. Name the exact SQL, Storage and Service Bus DR mechanisms.
6. Clarify the Australia-only residency requirement and Front Door suitability.
7. Replace blanket “automatic failover/no SPOF” statements with tested component-level recovery procedures.
8. Define how seven-year retention is implemented.

## Should fix

1. Add dead-letter queues, retries and idempotency.
2. Add malware scanning and attachment validation.
3. Add WAF, rate limiting and origin restrictions.
4. Add a cost estimate.
5. Improve the diagram’s arrows, labels and network boundaries.
6. Expand stakeholder questions.

## Could improve later

1. Add automated claims-processing subscribers.
2. Add event history/audit capability.
3. Add archival tiers for closed claims.
4. Add deployment architecture and Bicep modules.
5. Add a formal threat model.

---

# 15. Mentor scorecard

| Area                        | Score | Feedback                                                                          |
| --------------------------- | ----: | --------------------------------------------------------------------------------- |
| Business alignment          |  7/10 | Good structure, but original scale and budget requirements changed                |
| Service selection           |  8/10 | Appropriate Azure building blocks                                                 |
| Integration design          |  7/10 | Good asynchronous direction; workflow needs more precision                        |
| Security                    |  6/10 | Strong foundations but identity, authorisation and threat controls are incomplete |
| Reliability and DR          |  6/10 | Good intent; failover behaviour and SLA conclusions need stronger evidence        |
| Data architecture           |  7/10 | Correct storage split; retention, consistency and audit require work              |
| Operability                 |  7/10 | Monitoring included, but alerts, runbooks and ownership are missing               |
| Cost awareness              |  5/10 | Trade-offs included, but no AUD $12,000 validation                                |
| Diagram clarity             |  6/10 | Main components visible, but flows and boundaries are ambiguous                   |
| Architectural communication |  8/10 | Very good first submission and clearly structured                                 |

**Overall: 7/10 — a credible first Solution Architect design with several implementation-blocking details still to resolve.**

This is above the level of a typical developer’s first architecture exercise. Your strongest qualities are that you considered asynchronous processing, multi-region recovery, security, capacity and trade-offs together. The next stage is to become more exact: preserve requirements, define journeys, name precise recovery mechanisms, and avoid claiming availability until the failure behaviour is demonstrable.

# Architecture-board questions for you

Prepare answers to these before revising the design:

1. Does the Australia-only requirement apply to Front Door edge processing and logs, or only to persistent claims data?
2. Why are claims submissions sent through Service Bus rather than written synchronously to SQL?
3. Can a customer receive confirmation before the claim has been committed to the database?
4. What happens when Blob upload succeeds but claim submission fails?
5. How do you prevent the same Service Bus message being processed twice?
6. How does a customer prove they are authorised to view a particular claim?
7. Which components are active in Region B during normal operation?
8. Who declares a regional disaster, and which recovery steps are automatic versus manual?
9. How will you demonstrate that the complete system meets a four-hour RTO?
10. What Service Bus feature are you selecting: Geo-DR or Geo-Replication, and why?
11. What prevents uploaded PDFs from containing malware?
12. How will claims staff search seven years of data without degrading the transactional system?
13. What is your estimated monthly cost at 5,000, 20,000 and 250,000 customers?
14. What evidence supports the claim that the end-to-end workload meets 99.95% availability?
15. How would the design change if Front Door were rejected because of the residency interpretation?

[1]: https://learn.microsoft.com/en-us/azure/frontdoor/front-door-faq?utm_source=chatgpt.com "Azure Front Door frequently asked questions (FAQ)"
[2]: https://learn.microsoft.com/en-us/privacy/eudb/eu-data-boundary-excluded-services?utm_source=chatgpt.com "Services excluded from the EU Data Boundary"
[3]: https://learn.microsoft.com/en-us/azure/frontdoor/standard-premium/sensitive-data-protection?utm_source=chatgpt.com "Azure Front Door sensitive data protection"
[4]: https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-geo-dr?utm_source=chatgpt.com "Azure Service Bus Geo-Disaster Recovery"
[5]: https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-geo-replication?utm_source=chatgpt.com "Azure Service Bus Geo-Replication"
[6]: https://learn.microsoft.com/en-us/azure/storage/common/storage-disaster-recovery-guidance?utm_source=chatgpt.com "Azure storage disaster recovery planning and failover"
[7]: https://learn.microsoft.com/en-us/azure/azure-sql/database/failover-group-sql-db?view=azuresql&utm_source=chatgpt.com "Failover Groups Overview & Best Practices - Azure SQL ..."
[8]: https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy?utm_source=chatgpt.com "Data redundancy - Azure Storage"
[9]: https://learn.microsoft.com/en-us/azure/azure-sql/database/automated-backups-overview?view=azuresql&utm_source=chatgpt.com "Automatic, Geo-Redundant Backups - Azure SQL Database"
