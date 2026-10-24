# Workspace instructions

Read the root instructions and database/multi-tenancy docs. Schema files follow domains. Use UTC timestamptz, UUID identifiers and explicit tenant ownership. Review generated SQL and test apply/reapply plus transaction rollback in eduos_test. Do not rewrite applied migrations or enable RLS without policies and tests. Auth text IDs contain UUID strings to match the adapter.
