# Contract checks

- Exercise representative success and expected error responses through `createApp`; parse bodies with shared schemas and verify status, request ID and protected cache headers.
- Cover malformed JSON, invalid IDs, query coercion edge cases, out-of-range limits and attempts to set protected fields where applicable.
- Verify anonymous, inactive-member, insufficient-permission and foreign-resource requests. Check that failure responses do not reveal resource existence or private values.
- For list endpoints, check stable ordering for equal sort values, page boundaries, filter preservation and foreign-tenant or invalid cursors. Test mutation-between-pages behavior only to the guarantee the API actually offers.
- For mutations, test the chosen duplicate/replay and stale-version behavior. Test any required custom headers through CORS preflight as well as direct HTTP calls.
- Compare OpenAPI parameters, request bodies, security, status codes and JSON schemas with the running route behavior. Cover central error mapping when introducing a new domain error/status.
- Use real database integration coverage for ownership, uniqueness and concurrency guarantees; mocked HTTP services cannot demonstrate those guarantees.
