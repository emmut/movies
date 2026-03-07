## ADDED Requirements

### Requirement: Logged-out content is remotely cacheable
The system SHALL serve logged-out routes and deterministic public read paths through remote caching so repeated anonymous requests do not trigger fresh server execution.

#### Scenario: Anonymous request reuses cached result
- **WHEN** an unauthenticated user requests a cache-enabled public route after the initial render
- **THEN** the system MUST return the cached result from remote cache until invalidation or expiration

### Requirement: Public cache invalidation is explicit and domain-tagged
The system SHALL assign domain cache tags to public content and MUST invalidate those tags when related source data changes.

#### Scenario: Public content mutation invalidates cached pages
- **WHEN** a mutation updates data used by public logged-out pages
- **THEN** the system MUST revalidate the corresponding public cache tags so subsequent requests receive fresh content
