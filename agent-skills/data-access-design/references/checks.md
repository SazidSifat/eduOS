# Persistence checks

- In a dedicated `eduos_test*` database, prove own-tenant success, foreign-resource denial, inactive membership denial and revocation after an earlier access check. Use synthetic fixtures and clean up only owned rows.
- Attempt foreign-tenant references through SQL and verify ownership constraints where schema changes introduce them. Verify tenant-scoped duplicate handling without preventing valid records in another institution.
- Force a failure after the first related write and verify rollback. Exercise the real service/transaction path rather than testing a standalone transaction helper alone.
- For contested transitions, coordinate two independent transactions at the relevant read/write point. Assert the resulting rows and domain outcomes: one winner, defined replay or safe serialization as required by the business rule. Avoid relying on timing sleeps.
- If adding transaction retries, verify retry exhaustion and that no external effect or partial write is duplicated.
- For bulk writes, verify all-or-nothing or partial-success behavior as specified, including an unauthorized resource among valid IDs.
- For query tuning, record realistic cardinality, SQL shape, plan and measured comparison without private parameters. Check stable pagination and bounded query counts where those motivated the change.
