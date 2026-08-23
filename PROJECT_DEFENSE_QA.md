# Event-Horizon Project Defense Q&A

This document contains likely questions that can be asked during a project defense, demonstration, viva, or presentation of the Event-Horizon system. Each question is followed by a detailed but easy-to-understand answer.

## 1. Project Overview Questions

### Q1. What is this project about?
**Answer:**  
Event-Horizon is a full-stack event ticketing and booking web application. It allows users to discover events, view event details, choose ticket types, upload payment proof, and receive digital tickets after admin approval. On the admin side, it provides tools for creating events, verifying bookings, managing users, and updating payment information.  

In simple terms, the system connects event organizers and attendees in one place. Instead of handling bookings manually through chats or phone calls, the platform centralizes the process and makes it more organized, trackable, and scalable.

### Q2. What problem does this project solve?
**Answer:**  
Many event booking processes are still handled manually. People often advertise events on social media, collect payments through mobile money, and then verify receipts through screenshots sent in private messages. That creates several problems:
- Poor organization of bookings
- Difficulty tracking who has paid
- Risk of losing proof of payment
- Delays in confirmation
- No proper ticket issuance process

This project solves those problems by introducing a structured workflow where the user books through the system, uploads proof in a dedicated interface, and waits for admin approval before receiving a digital ticket.

### Q3. Who are the main users of this system?
**Answer:**  
The system has two main categories of users:
- Normal users: They browse events, make bookings, upload payment proof, and download approved tickets.
- Admin users: They manage events, review bookings, verify uploaded payment proof, approve or reject requests, and update payment numbers displayed to users.

This role separation is important because it ensures that normal users cannot access administrative actions, while admins have enough control to manage the platform effectively.

### Q4. How does the project work from start to finish?
**Answer:**  
The flow of the system is as follows:
1. A user creates an account or logs in.
2. The user browses available events from the home page or catalogue.
3. The user opens an event details page to see ticket types, date, location, and description.
4. The user starts a booking by selecting ticket quantities.
5. The system shows payment instructions using Mobile Money and Orange Money.
6. The user pays externally and uploads payment proof.
7. The booking is stored with a pending approval status.
8. The admin reviews the proof from the admin dashboard.
9. The admin either approves or rejects the booking.
10. If approved, the user can download a digital ticket with a QR code.

This flow was designed to mirror real-life payment behavior in contexts where direct online payment integration may not be available or practical.

## 2. Functional Questions

### Q5. Why does the system use payment proof upload instead of direct online payment?
**Answer:**  
The system uses payment proof upload because the target context supports practical local payment methods like Mobile Money and Orange Money, which are widely used. In many real environments, integrating a full online payment gateway can be expensive, legally complex, or unavailable.

By allowing the user to pay externally and then upload a screenshot of the receipt, the platform still achieves controlled booking verification without needing a full payment processor. It is a practical and realistic design choice for the environment the system is intended for.

### Q6. How does the booking approval process work?
**Answer:**  
When a user submits a booking, the system stores the booking together with the uploaded payment proof URL and marks it as pending approval. The admin sees this booking inside the dashboard, opens the proof image, checks if the payment appears valid, and then either approves or rejects the booking.

If the booking is approved, the system updates the status to approved and allows the user to access a downloadable digital ticket. If rejected, the status changes to rejected and the user is informed through the dashboard status display.

### Q7. What happens when an event is terminated?
**Answer:**  
When an event date has passed, the system treats it as terminated. In that state, users should not be allowed to make new bookings because the event is no longer active.

The system handles this by disabling the booking button on the event details page. Instead of allowing interaction, it displays a message showing that the event is terminated. This prevents invalid reservations and improves system correctness.

### Q8. Why is it important to disable booking for terminated events?
**Answer:**  
It is important because allowing bookings for past events would create invalid data, confuse users, and reduce trust in the platform. A user should never be allowed to reserve a ticket for an event that has already happened.

From a system design perspective, this rule also protects business logic. It ensures that bookings represent only real, actionable events and not expired ones.

### Q9. How are ticket quantities handled during booking?
**Answer:**  
Each event can have multiple ticket types, such as VIP or General Admission. Every ticket type has a price, a total quantity, and an available count. When the user books tickets, they choose quantities for each type.

When a booking is approved, the system reduces the available number of those tickets. This is important because it prevents over-selling and keeps the available inventory accurate.

### Q10. How does the system generate tickets after approval?
**Answer:**  
Once the admin approves a booking, the user can access a ticket page from the dashboard. That ticket page shows event information such as title, category, date, time, and location, together with a QR code and ticket identifier.

The QR code represents the approved booking and can be used later for validation or check-in. This gives the ticket a more professional and digital form compared to a handwritten or manually sent confirmation.

### Q11. Why did you allow the admin to edit the payment numbers?
**Answer:**  
If payment numbers are hardcoded in the interface, every change would require editing the code and redeploying the system. That is not practical.

Allowing the admin to update the Mobile Money and Orange Money numbers from the dashboard makes the system more maintainable and easier to operate. If the receiving number changes, the admin can update it directly without developer intervention.

## 3. Architecture Questions

### Q12. What type of application architecture does this project use?
**Answer:**  
This project uses a full-stack web application architecture with three major layers:
- Frontend layer
- Backend/API layer
- Database layer

The frontend is responsible for user interaction and display. The backend exposes API endpoints and enforces business rules. The database stores persistent data such as users, events, tickets, and bookings.

This layered architecture improves organization and makes the project easier to scale and maintain.

### Q13. What is the role of the frontend in this project?
**Answer:**  
The frontend is the part of the system that users and admins interact with in the browser. It handles:
- Page rendering
- Forms
- Search and filtering
- Opening booking modals
- Uploading images and payment proof
- Displaying booking status
- Displaying digital tickets

In this project, the frontend was built to be responsive, interactive, and visually clear. It focuses on user experience while relying on the backend for data and business logic.

### Q14. What is the role of the backend?
**Answer:**  
The backend is responsible for the logic of the application. It:
- Receives requests from the frontend
- Validates incoming data
- Checks authentication and authorization
- Reads and writes data in the database
- Handles uploads
- Applies business rules such as booking approval and ticket availability updates

Without the backend, the frontend would only be a static interface. The backend makes the platform function like a real application.

### Q15. Why did you keep a shared contract between frontend and backend?
**Answer:**  
The project uses shared route definitions and shared schema types so that the frontend and backend agree on the same data structures. This reduces the risk of mismatch errors.

For example, if the backend expects a booking payload with certain fields, the frontend can use the same definitions. That improves consistency, reduces duplication, and makes the codebase safer to maintain.

## 4. Technology Choice Questions

### Q16. Why did you use React for the frontend?
**Answer:**  
React was chosen because it is component-based, widely used, flexible, and efficient for building interactive user interfaces. This project contains many reusable UI pieces, such as event cards, booking modals, dashboard cards, and forms. React makes it easy to break the interface into manageable components.

React also has a strong ecosystem, making it easier to integrate routing, server-state management, UI libraries, and modern development practices.

### Q17. Why React instead of Angular or Vue?
**Answer:**  
React was a good choice here because it gives strong flexibility without forcing a rigid application structure. Compared with Angular, React is lighter and easier to start with for a project of this size. Angular is powerful, but it can introduce more complexity than necessary for a project like this.

Compared with Vue, React had the advantage of a larger ecosystem in this project context, especially when combined with TypeScript, React Query, and shadcn/ui components. The choice was not because Vue or Angular are bad, but because React matched the project’s component-heavy and ecosystem-driven needs better.

### Q18. Why did you use TypeScript instead of plain JavaScript?
**Answer:**  
TypeScript improves reliability by introducing static typing. In a project like this, there are many important data structures: events, tickets, bookings, users, payment settings, and API responses. If those are handled with plain JavaScript, it is easier to make mistakes that only appear at runtime.

TypeScript helps catch those issues early during development. It improves code readability, makes refactoring safer, and helps the developer understand expected data shapes more clearly.

### Q19. Why did you use Vite?
**Answer:**  
Vite was chosen because it provides a fast development environment and efficient build process for modern frontend applications. It starts quickly, refreshes changes rapidly, and works well with React and TypeScript.

Compared with older tooling like Create React App, Vite offers a better developer experience and faster performance, especially during active development.

### Q20. Why did you use Wouter for routing instead of React Router?
**Answer:**  
Wouter is lightweight and simple. For this project, routing needs are straightforward: home page, catalogue, event details, dashboard, admin page, create event page, ticket view, and auth page.

React Router is more feature-rich, but Wouter was enough for the routing complexity of this application. Using it kept the setup smaller and simpler without sacrificing needed functionality.

### Q21. Why did you use React Query?
**Answer:**  
React Query was used for server-state management. In this project, many parts of the frontend depend on data coming from the backend, such as events, bookings, users, and admin data.

React Query helps with:
- Data fetching
- Caching
- Loading states
- Error states
- Refreshing stale data after mutations

For example, after approving a booking, the frontend should refresh related data. React Query makes that easier and more structured than managing every fetch manually with `useEffect`.

### Q22. Why React Query instead of Redux?
**Answer:**  
Redux is mainly useful for complex client-side global state management. This project’s main data challenges were server-driven rather than purely client-driven. The system mostly needs to fetch, cache, and update data from APIs.

React Query is better suited for server-state problems. It avoids much of the boilerplate that Redux would introduce for this use case. In short, Redux could work, but React Query was the more direct and efficient tool for the problem.

### Q23. Why did you use Tailwind CSS?
**Answer:**  
Tailwind CSS allows fast and consistent UI development using utility classes. It makes it easier to build custom layouts, responsive views, and polished components without writing large amounts of separate CSS.

For a project with many pages and panels, Tailwind helps keep styling close to the components while still maintaining consistency. It also speeds up iteration during development.

### Q24. Why use shadcn/ui components?
**Answer:**  
shadcn/ui provides reusable UI primitives built on accessible foundations. It helped accelerate the development of buttons, modals, forms, tabs, tables, calendars, dialogs, and other interface elements.

The advantage is that it combines speed and flexibility. It is not a rigid theme system; the components can still be customized to match the application’s design.

### Q25. Why did you use Node.js and Express for the backend?
**Answer:**  
Node.js and Express were chosen because they are simple, flexible, and well-suited to building REST APIs for JavaScript/TypeScript applications. Since the frontend already uses JavaScript/TypeScript, using Node.js on the backend creates language consistency across the stack.

Express is also lightweight and gives direct control over routes and middleware. That made it suitable for handling authentication, bookings, event management, and file uploads without unnecessary complexity.

### Q26. Why Express instead of NestJS, Django, or Laravel?
**Answer:**  
Express was chosen because the project did not need the heavier structure of frameworks like NestJS, Django, or Laravel.

- Compared with NestJS: NestJS is excellent for large enterprise systems, but Express is lighter and faster to set up for a medium-sized project like this.
- Compared with Django: Django is powerful, but it uses Python, which would introduce a different language stack from the frontend.
- Compared with Laravel: Laravel is strong for web backends, but again it would mean switching to PHP and a different ecosystem.

Express fit the project because it gave just enough structure while staying simple and flexible.

### Q27. Why did you use PostgreSQL as the database?
**Answer:**  
PostgreSQL was chosen because it is reliable, mature, relational, and well-suited for structured data. This project has strongly related entities:
- users
- events
- tickets
- bookings
- booking items
- payment settings

These entities have clear relationships, so a relational database is the right fit. PostgreSQL also provides strong data integrity, which is important when handling bookings and ticket counts.

### Q28. Why PostgreSQL instead of MongoDB?
**Answer:**  
MongoDB is good for flexible or document-based data, but this project uses highly structured relationships. For example:
- One event has many tickets
- One booking belongs to one user
- One booking contains multiple booking items
- Admin operations depend on consistent relations between records

PostgreSQL is better for this kind of relational model. It also helps preserve consistency and transactional correctness more naturally.

### Q29. Why did you use Drizzle ORM?
**Answer:**  
Drizzle ORM was chosen because it works well with TypeScript and provides typed database schemas. It helps define tables and types in a way that integrates cleanly with the rest of the application.

The major benefit is type safety between the database layer and the application layer. It also keeps the schema definitions close to the code and reduces mismatch risk.

### Q30. Why Drizzle instead of Prisma or Sequelize?
**Answer:**  
Drizzle was a suitable choice because it is lightweight, type-friendly, and close to SQL concepts.

- Compared with Sequelize: Drizzle offers stronger TypeScript integration and a more modern developer experience.
- Compared with Prisma: Prisma is powerful and productive, but Drizzle is often preferred when the developer wants tighter control and a more SQL-like feel.

The choice was mainly about balancing type safety, simplicity, and control.

### Q31. Why did you use Zod?
**Answer:**  
Zod was used for runtime validation of inputs and API payloads. TypeScript helps during development, but it does not validate data at runtime when requests come from the browser or external clients.

Zod makes sure that the data received by the backend has the expected structure. That improves security, reduces invalid requests, and gives more reliable API behavior.

## 5. Security and Access Control Questions

### Q32. How do you manage authentication in this project?
**Answer:**  
The project uses session-based authentication. A user signs up or logs in using email and password. Once authenticated, the server keeps track of the session and uses it to identify the user on future requests.

This allows the system to protect pages and routes such as the user dashboard, booking submission, and admin dashboard.

### Q33. Why did you use session-based authentication instead of JWT?
**Answer:**  
Session-based authentication was a reasonable choice because the application is a server-backed web app where both frontend and backend are closely connected. Sessions simplify logout handling, server-side access control, and user identity management.

JWT can be useful for distributed APIs and stateless services, but for this project, sessions were simpler and more practical.

### Q34. How do you ensure that only admins can access admin actions?
**Answer:**  
The backend checks whether the authenticated user has administrative privileges before allowing access to admin endpoints such as:
- viewing all bookings
- viewing all users
- creating or editing events
- approving or rejecting bookings
- updating payment numbers

This is important because frontend hiding alone is not enough. Real protection must happen on the server.

## 6. Data and Business Logic Questions

### Q35. How is booking status managed in the system?
**Answer:**  
A booking moves through status stages:
- pending approval
- approved
- rejected

When the booking is first submitted with payment proof, it enters pending approval. After admin review, it becomes approved or rejected. This status is then shown to the user in the dashboard.

This status-based approach makes the workflow explicit and easy to understand.

### Q36. Why is status management important?
**Answer:**  
Status management is important because it gives structure to the lifecycle of a booking. Without status, the system would not clearly know whether a booking is awaiting review, accepted, or denied.

It also helps both users and admins:
- Users know what is happening to their booking
- Admins know which requests still need action

### Q37. How does the system prevent ticket overselling?
**Answer:**  
The project updates ticket availability when a booking is approved. That means only validated bookings reduce the remaining quantity.

This helps avoid overselling because the system checks inventory before reducing ticket counts. It is a key business rule in any ticketing platform.

### Q38. Why not reduce ticket count immediately when the booking is submitted?
**Answer:**  
If ticket count is reduced immediately on submission, users could block tickets without actually having a valid payment. Since this platform uses manual proof verification, it is more logical to finalize inventory reduction at approval stage.

That way, only verified bookings consume real ticket inventory.

## 7. User Experience Questions

### Q39. What design considerations did you make for user experience?
**Answer:**  
The UI was designed to keep important actions clear and easy to follow. Some examples include:
- Search and filter tools for easier event discovery
- Event cards that summarize important details
- A booking modal that keeps the reservation flow in one place
- Payment instructions displayed directly inside the booking process
- Dashboard status badges for quick understanding
- Ticket view formatted like a real digital pass

The goal was to reduce friction and make the system intuitive for both technical and non-technical users.

### Q40. Why is the admin dashboard divided into tabs?
**Answer:**  
The admin dashboard covers multiple responsibilities: booking approvals, history, users, payments, and events. If all of these were placed on one page without structure, the interface would become cluttered and confusing.

Tabs separate concerns clearly and help the admin move quickly between tasks.

## 8. File Upload and Ticket Questions

### Q41. Why did you support file uploads in the system?
**Answer:**  
File uploads are important for two main reasons:
- Event organizers need to upload event cover images
- Users need to upload payment proof screenshots

Without file uploads, the system would not be practical for real event display or payment verification.

### Q42. What is the purpose of the QR code on the ticket?
**Answer:**  
The QR code gives the ticket a unique, scannable identity. It can later be used for verification at entry points or during check-in.

Even if full scanning infrastructure is not yet implemented, adding the QR code establishes a professional digital ticket model and prepares the system for future expansion.

## 9. Comparison and Tradeoff Questions

### Q43. Could this project have been built as a mobile app instead of a web app?
**Answer:**  
Yes, it could have been built as a mobile app, but a web application was the better starting point because:
- It is accessible from any browser
- It does not require app installation
- It is easier to deploy and test quickly
- Admin management is often more comfortable on larger screens

For this project stage, the web platform offered faster delivery and wider accessibility.

### Q44. What are the main tradeoffs of the current payment-proof approach?
**Answer:**  
The biggest advantage is practicality, but there are tradeoffs:
- Admins must verify proofs manually
- Approval may take time
- There is more operational work than with automated gateways
- Fraud detection depends more on admin attention

However, the approach remains useful where local transfer-based payment is the reality. It is a realistic compromise between automation and accessibility.

### Q45. What are the main limitations of the current system?
**Answer:**  
Some current limitations include:
- No direct online payment gateway
- No automatic email or SMS notification
- Manual proof verification requires admin effort
- Limited analytics and reporting
- No full venue-side ticket scanning workflow yet
- Scalability improvements such as pagination can still be added

These limitations do not make the system invalid; they simply mark clear areas for future enhancement.

## 10. Future Improvement Questions

### Q46. If you had more time, what would you improve first?
**Answer:**  
The first improvements I would prioritize are:
- Integrating a real payment gateway
- Sending automatic booking and approval notifications
- Adding scanning/check-in support for QR tickets
- Improving analytics for admins
- Adding stronger reporting and pagination for larger datasets

These upgrades would move the project from a strong prototype or practical platform to a more production-ready solution.

### Q47. How can this project be made more scalable?
**Answer:**  
To improve scalability, the system can be extended with:
- Better indexing and optimized database queries
- Pagination for event and admin lists
- Background jobs for notifications
- Separate services for uploads or media storage
- Caching of frequently requested data
- Improved monitoring and logging

The current architecture already supports future growth because it separates frontend, backend, and shared contracts cleanly.

### Q48. Can this system be adapted for different types of events?
**Answer:**  
Yes. The system was built around general event concepts such as title, description, date, location, category, and ticket types. Because of that, it can support many event categories including:
- music concerts
- conferences
- workshops
- sports events
- food festivals
- networking events

This flexibility makes the project reusable beyond a single niche.

## 11. Strong Closing Questions

### Q49. What is the biggest strength of this project?
**Answer:**  
The biggest strength of this project is that it solves a real operational problem with a practical workflow. It does not only display events; it manages the full journey from event discovery to booking request, payment proof verification, and digital ticket issuance.

That makes it more than a simple event listing site. It is a functioning event operations platform.

### Q50. Why should someone consider this project successful?
**Answer:**  
This project should be considered successful because it achieves its main objectives:
- it supports event discovery
- it supports structured booking
- it handles proof-of-payment verification
- it gives admins operational control
- it issues digital tickets after approval
- it enforces business rules like disabling booking for terminated events

Most importantly, it addresses a real-world use case with technologies that are modern, maintainable, and appropriate for the problem.

## 12. Short Rapid-Fire Questions

### Q51. Why not use plain CSS instead of Tailwind?
**Answer:**  
Tailwind allowed faster and more consistent UI building, especially across many pages and components.

### Q52. Why not use MySQL?
**Answer:**  
MySQL could work, but PostgreSQL was preferred for strong relational modeling, reliability, and developer comfort in this project.

### Q53. Why not store everything on the frontend only?
**Answer:**  
Because bookings, users, and tickets must persist securely and be shared across users and admins. That requires a backend and database.

### Q54. Why does the admin verify payments manually?
**Answer:**  
Because the system is designed around external local payment methods rather than direct gateway integration.

### Q55. Why is TypeScript especially useful here?
**Answer:**  
Because the project contains many related data models and API interactions, so stronger typing reduces errors and improves maintainability.

## 13. Final Defense Answer You Can Reuse

### Q56. In one statement, how would you defend the value of this project?
**Answer:**  
Event-Horizon is valuable because it transforms a common but disorganized event booking process into a structured digital workflow that supports event discovery, proof-based booking verification, admin control, and QR-based ticket delivery using a modern full-stack architecture.

