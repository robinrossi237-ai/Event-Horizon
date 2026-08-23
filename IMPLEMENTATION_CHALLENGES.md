# Event-Horizon Implementation Challenges

This document summarizes major problems and difficulties encountered while implementing the project.

## 1. Requirements and Scope Drift
- Features changed while core flows were already built (for example, payment-proof flow later requiring provider cards and editable numbers).
- Some requirements were UI-only at first, then required backend persistence and admin controls.
- Late requirement updates forced refactors across `client`, `server`, and `shared` layers.

## 2. Authentication and Authorization
- Mixing public routes, authenticated routes, and admin-only routes increased complexity.
- Admin checks were needed in multiple endpoints to prevent privilege bypass.
- Session-based auth created edge cases around expired sessions and unauthorized API calls.

## 3. Data Modeling and Schema Evolution
- Core entities (`events`, `tickets`, `bookings`) evolved as features expanded.
- New settings-like data (payment numbers) did not fit existing tables and required a dedicated model.
- Schema changes required synchronized updates in TypeScript types, route contracts, and DB state.

## 4. API Contract Synchronization
- The app relies on shared contracts (`shared/routes.ts`, `shared/schema.ts`), so small changes cascade.
- Any mismatch between client payloads and backend validation caused runtime failures.
- New endpoints had to be added consistently for read/write access with proper validation.

## 5. File Upload and Payment Proof Handling
- Upload flow had multiple moving parts: frontend file input, multipart POST, storage path, and preview URL.
- Handling both returned `url` and fallback `objectPath` safely was necessary for compatibility.
- UI had to enforce proof upload before allowing booking submission.

## 6. Ticket Inventory and Booking Consistency
- Booking approval impacts ticket availability, requiring transactional updates.
- Race conditions can happen when many approvals occur concurrently.
- Inventory checks had to be performed at approval time to avoid overselling.

## 7. Date/Time Handling
- Date values move between client forms, JSON, and database timestamps.
- Invalid or inconsistent date formats caused parsing and rendering issues.
- Timezone differences introduced display confusion in admin and user views.

## 8. Frontend State Management
- React Query invalidation needed careful handling after booking and admin actions.
- Keeping event availability, booking status, and dashboard data in sync required extra query refreshes.
- Conditional loading and permission-based screens increased component complexity.

## 9. Admin Dashboard Complexity
- The dashboard combines multiple concerns: bookings review, users, events, and settings.
- More tabs and actions increased code size and maintainability pressure.
- Error handling for partial data load failures had to be explicit and user-friendly.

## 10. UX and Visual Consistency
- Payment cards needed provider-specific styling while staying consistent with existing UI patterns.
- Asset management (logos and static files) required stable paths and naming conventions.
- Clean visual hierarchy was needed in dense modals and dashboard forms.

## 11. Environment and Deployment Friction
- Correct `.env` configuration is mandatory (`DATABASE_URL`, session/auth variables).
- Schema updates require DB sync (`drizzle-kit push`) before new features work.
- Local, staging, and production parity can break when environment assumptions differ.

## 12. Testing and Reliability Gaps
- The project currently depends heavily on manual verification for key flows.
- Critical paths (booking creation, approval, payment settings updates) need stronger automated coverage.
- Missing integration tests increase risk during refactors and feature additions.

## 13. Performance and Scalability Considerations
- Some filtering and aggregation are done in memory, which can degrade with larger datasets.
- Admin pages fetching broad datasets can become heavy as usage grows.
- Future optimization may require pagination, indexed queries, and tighter API responses.

## 14. Maintenance Tradeoffs
- Fast delivery decisions improved speed but introduced technical debt in some areas.
- Cross-cutting changes (auth, routes, schema, UI) require disciplined coordination.
- Documentation must be kept current to reduce onboarding and regression risk.

