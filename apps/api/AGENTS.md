# Workspace instructions

Read the root instructions and backend/authentication/multi-tenancy docs. Use the app factory for testable dependencies. Route handlers validate and delegate to capability services. Session → active membership → permission → ownership is mandatory. Keep raw errors and request payloads out of logs. Cover forbidden and cross-tenant requests in integration tests.
