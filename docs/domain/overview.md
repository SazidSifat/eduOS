# Product scope

Source: [EduOS Domain & Module Feature Specification v1.0, 20 October 2026](https://docs.google.com/document/d/1obDBm1LT7Amqz7lyFg8Zx5gjuuAzkLfZ91qXRwiwNbw/edit), inspected during bootstrap. This is a proposed discovery specification, not confirmed universal school policy.

EduOS serves private schools in Bangladesh, initially Classes 1–10. Its planned first product slice is academic setup, enrollment, teaching assignments and daily attendance. Exams/results and fees follow. College credit/semester systems, payroll, transport and biometric integrations are outside the initial scope.

**Implemented now:** identity, sessions, minimum institution/membership persistence, membership listing and authorized workspace reads. There are no school business modules, invitation workflows, role management, provisioning UI or sample analytics.

Preserve durable student identities, separate year-specific enrollments, effective-dated transfers and historical teaching assignments. Attendance corrections must preserve original submissions. Published results need policy versions; posted financial entries need authorized reversals. These are design constraints for future modules, not implemented functionality.

Open discovery decisions: school medium/language, session boundaries, roll uniqueness, permitted attendance statuses, correction authority, subject-period attendance, grading rules, guardian authority, retention and communication consent. Confirm with at least two institutions using synthetic/anonymized records.

Bootstrap assumptions: one institution is one tenant; campus support is deferred; a user can belong to several institutions; timestamps are UTC and presentation defaults to Asia/Dhaka; self-registration is disabled; application authorization remains independent of Better Auth. No universal business roles or grading policy are coded.
