# BrightAce Academy — Admin History Population Fix V23

Focused change only: Admin History now loads its records directly from `adminListWorkHistory` instead of making the entire page depend on a second `adminListWorkAssignments` request.

This prevents an unrelated active-work/assignment request failure from blanking the History dashboard. The backend history endpoint already returns the lifecycle records needed by this page, including pending/active, completed and rejected work.

Existing restore/delete behavior, navigation, permissions, financial preservation and all unrelated functionality remain unchanged.
