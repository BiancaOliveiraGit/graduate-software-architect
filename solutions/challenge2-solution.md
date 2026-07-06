# Resilient Customer Portal

## Scenario
- Summarize the business scenario and context for the solution.

## Business Objective

- Deliver a scalable self-service experience for customers.
- Improve support responsiveness through better monitoring.

## Assumptions

- A modern browser experience is required.
- Customer data is stored in approved services.

## Constraints & Budget

- Limited team size.
- Budget must prioritize reliability and security.

## Functional Requirements

- Authentication and profile management.
- Support ticket submission and status tracking.

## Non-Functional Requirements

- High availability.
- Fast page loads.
- Clear audit trails.

## Azure Architecture

- Azure App Service for the web frontend.
- Azure SQL Database for transactional data.
- Azure Monitor and Application Insights for observability.

## Security Considerations

- Conditional access and MFA.
- Role-based access control.
- Encryption in transit and at rest.

## Risks

- Data model complexity.
- Identity-related access issues.

## Decision Matrix

| Option | Pros | Cons | Estimated Cost | Decision |
| --- | --- | --- | --- | --- |
| App Service + SQL | Faster delivery | Less flexibility for custom hosting | Medium | Recommended |
| Container-based platform | More flexibility | Higher complexity | High | Not preferred |

## Stakeholder Questions

- Which customer journeys are highest priority?
- What compliance requirements apply to the portal?
