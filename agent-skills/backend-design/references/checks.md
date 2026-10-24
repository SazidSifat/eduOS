# Design checks

- Can a reviewer trace one request through identity, membership, permission, resource ownership, service and scoped SQL?
- Does each invariant have an owner and an enforcement mechanism? Include a rejected transition as well as the successful case.
- For multi-write operations, what survives a failure between writes? Can a nested service accidentally commit independently?
- For concurrent requests, retries and timeouts after commit, can the operation duplicate effects or lose an update? Specify the expected outcome for the applicable cases.
- Can membership revocation or a resource change invalidate an earlier check? Explain the data-boundary guard and the required consistency for writes.
- Are external effects recoverable when delivery fails after a database commit? Keep delivery machinery conditional on actual requirements.
- Are dependencies justified by the requested workflow? Identify the simpler existing path when rejecting added layers or infrastructure.
- Have proposed school policies and deferred capabilities remained visibly separate from confirmed behavior?
