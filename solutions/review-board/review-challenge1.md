## Architecture Review Board Summary

### Challenge Reviewed
- Challenge: Claims Online Integration Solution

### Review Summary - From Agent V1
- The proposed architecture uses Azure Front Door, active-active regional routing, Service Bus for decoupled messaging, Azure SQL Database, Azure Blob Storage, Key Vault, and managed identities to address availability, security, and integration needs.
- Key strengths identified include service bus-based decoupling, multi-region resilience, and the use of private networking and encryption controls for sensitive data.
- Main concerns raised include the processing bottleneck in the claim-processing function during bursts, the cost of multi-region resilience, and the operational complexity of failover and recovery.
- Recommendations from the review include validating autoscaling behavior under peak traffic, defining explicit monitoring and alerting, and testing disaster recovery procedures for failover and restoration.

### Review Summary - From ChatGPT V1
**Overall: 7/10 — a credible first Solution Architect design with several implementation-blocking details still to resolve.**

This is above the level of a typical developer’s first architecture exercise. Your strongest qualities are that you considered asynchronous processing, multi-region recovery, security, capacity and trade-offs together. The next stage is to become more exact: preserve requirements, define journeys, name precise recovery mechanisms, and avoid claiming availability until the failure behaviour is demonstrable.

### Recommended revision priorities

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


### Architecture-board questions for you

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

### Related Document
- Review Agent's transcript: [review-transcript-agent-ch1.md](review-transcript-agent-ch1.md)
- Review ChatGPT's transcript: [review-transcript-chatgpt-ch1.md](review-transcript-chatgpt-ch1.md)