## ADDED Requirements

### Requirement: Authenticated read paths use private cache scope
The system SHALL cache eligible authenticated read operations using private cache semantics so cached responses are isolated per user/session and never shared across users.

#### Scenario: Same user reuses private cached read
- **WHEN** an authenticated user repeats the same eligible read request within the configured private cache lifetime
- **THEN** the system MUST reuse the private cached result for that user/session

#### Scenario: Different users never share cached personalized data
- **WHEN** two different authenticated users request the same personalized route or read operation
- **THEN** the system MUST maintain separate cache entries and MUST NOT serve one user's cached data to another user

### Requirement: Private cache freshness is preserved on user-affecting changes
The system SHALL invalidate private cache entries for affected users when user-specific data changes or session identity changes.

#### Scenario: User mutation invalidates affected private cache
- **WHEN** an authenticated user updates data that is consumed by privately cached reads
- **THEN** the system MUST invalidate relevant private cache tags so the next request returns updated data
