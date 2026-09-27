# Documentation rule

- `DASHBOARD_GUIDE.md` is the source of truth for the current Railway dashboard's user and operator workflows.
- Whenever a change adds, removes, renames, or changes a feature, API contract, configuration, access rule, calculation, or deployment procedure, update the relevant sections of `DASHBOARD_GUIDE.md` in the same commit. Update examples and the guide's change log when the behavior matters to users.
- Keep `README.md`, `RAILWAY_PORTFOLIO_MONITOR.md`, `FUND_ANALYTICS.md`, and `TRADE_LEDGER.md` consistent with the guide when touching their subjects. Remove obsolete claims rather than adding a contradictory note elsewhere.
- Check documentation links, commands, example payloads, permissions, and feature availability against the code before committing. Never put actual credentials, session cookies, or account data in documentation.
