# Requirements Document

## Introduction

This feature upgrades an existing personal portfolio website to deliver richer project case studies, enhanced blogging, visitor engagement (contact, newsletter, testimonials), an admin dashboard, analytics, and a set of technical hardening improvements. The backend is an Express + TypeScript service using Prisma over PostgreSQL, with JWT authentication (including 2FA and email verification), Cloudinary uploads, Resend email delivery, Zod validation, and Swagger documentation. The frontend is a React + Vite single-page application.

The work is grouped into clear, independently testable requirements spanning rich project detail pages, portfolio filtering and search, blog enhancements (comments, reactions, categories/tags, related posts, reading time, accurate view counting), a contact form with email delivery and persistence, newsletter subscriptions, testimonials, an admin management dashboard, analytics, and cross-cutting technical improvements (rate limiting, security hardening, SEO, caching, consistent pagination, and increased test coverage). A small refactor renames the misspelled `src/cummon` folder to `src/common`. On the frontend, the React + Vite application's router is migrated from `react-router-dom` to TanStack Router to align with the existing TanStack data-fetching stack.

## Glossary

- **Portfolio_Service**: The backend module responsible for creating, reading, updating, deleting, filtering, and searching portfolio projects.
- **Project_Detail**: The set of rich content fields for a single portfolio project, including problem statement, solution, results, gallery, demo link, repository link, and tech stack.
- **Blog_Service**: The backend module responsible for managing blog posts, comments, reactions, categories, tags, related posts, reading time, and view counting.
- **Comment**: A user-submitted text response attached to a blog post.
- **Reaction**: A like or emoji response attached to a blog post.
- **Contact_Service**: The backend module responsible for receiving contact form submissions, persisting them, and sending notification email.
- **Newsletter_Service**: The backend module responsible for managing newsletter subscriptions.
- **Testimonial_Service**: The backend module responsible for managing testimonials.
- **Admin_Dashboard**: The authenticated administrative interface (frontend and supporting backend endpoints) for managing portfolio projects and blog posts.
- **Analytics_Service**: The backend module that records visits and computes statistics on visits, popular posts, and popular projects.
- **Email_Provider**: The Resend integration used to deliver transactional email.
- **Rate_Limiter**: The middleware that restricts the number of requests a client may make within a time window.
- **SEO_Service**: The backend or frontend mechanism that generates sitemaps, dynamic meta tags, and Open Graph metadata.
- **Cache_Layer**: The mechanism that stores responses of public read endpoints for a bounded duration to reduce database load.
- **Public_Endpoint**: An API endpoint accessible without authentication, used to serve published content to site visitors.
- **Admin_User**: An authenticated user with administrative privileges.
- **Visitor**: An unauthenticated user browsing the public portfolio website.
- **Reading_Time**: The estimated number of minutes required to read a blog post, computed from word count.
- **Pagination_Metadata**: The standard response object containing total, page, limit, totalPages, hasNext, and hasPrev.
- **Slug**: A URL-safe unique identifier string for a content item.
- **Frontend_App**: The React + Vite single-page application located in the `react-vite-starter` project.
- **TanStack_Router**: The `@tanstack/react-router` routing library that is the target router for the Frontend_App.
- **Router_Migration**: The replacement of the existing `react-router-dom` routing implementation in the Frontend_App with TanStack_Router.
- **Protected_Route**: A Frontend_App route that requires an authenticated Admin_User session to render, such as the Admin_Dashboard routes.

## Requirements

### Requirement 1: Rich Project Detail / Case Study

**User Story:** As a Visitor, I want to view a rich case study for each project, so that I can understand the problem, solution, results, and technologies used.

#### Acceptance Criteria

1. THE Portfolio_Service SHALL store a problem statement, a solution description, and a results description as distinct fields for each Project_Detail.
2. WHEN a Visitor requests a published project by Slug, THE Portfolio_Service SHALL return the project including its problem statement, solution, results, image gallery, demo link, repository link, category, tags, and tech stack.
3. WHERE a project has associated tech stack entries, THE Portfolio_Service SHALL include each tech stack entry's name and icon reference in the project response.
4. WHEN a Visitor requests a project by a Slug that does not exist, THE Portfolio_Service SHALL return a 404 response with a descriptive error message.
5. IF a Visitor requests a project that is not published, THEN THE Portfolio_Service SHALL return a 404 response.
6. THE Portfolio_Service SHALL return image gallery entries ordered by their position value in ascending order.

### Requirement 2: Portfolio Filtering and Search

**User Story:** As a Visitor, I want to filter and search projects by category, tag, and tech stack, so that I can find relevant work quickly.

#### Acceptance Criteria

1. WHEN a Visitor requests the public project list with a category filter, THE Portfolio_Service SHALL return only published projects belonging to the specified category.
2. WHEN a Visitor requests the public project list with one or more tag filters, THE Portfolio_Service SHALL return only published projects associated with all specified tags.
3. WHEN a Visitor requests the public project list with one or more tech stack filters, THE Portfolio_Service SHALL return only published projects associated with all specified tech stack entries.
4. WHEN a Visitor requests the public project list with a search term, THE Portfolio_Service SHALL return published projects whose title or short description contains the search term, matched case-insensitively.
5. WHEN a Visitor requests the public project list without filters, THE Portfolio_Service SHALL return only published projects.
6. WHEN a Visitor requests the public project list with a featured filter set to true, THE Portfolio_Service SHALL return only published projects marked as featured.
7. THE Portfolio_Service SHALL include Pagination_Metadata in every public project list response.
8. IF a Visitor requests the public project list with a page value less than 1 or a limit value less than 1, THEN THE Portfolio_Service SHALL respond with a 400 validation error.

### Requirement 3: Blog Categories and Tags

**User Story:** As an Admin_User, I want to organize blog posts with categories and tags, so that readers can navigate related content.

#### Acceptance Criteria

1. THE Blog_Service SHALL associate each blog post with at most one category and zero or more tags.
2. WHEN an Admin_User assigns a category to a blog post, THE Blog_Service SHALL persist the association and return the updated post including its category.
3. WHEN an Admin_User assigns tags to a blog post, THE Blog_Service SHALL persist the associations and return the updated post including its tags.
4. WHEN a Visitor requests the public blog list filtered by a category Slug, THE Blog_Service SHALL return only published posts in that category.
5. WHEN a Visitor requests the public blog list filtered by a tag Slug, THE Blog_Service SHALL return only published posts associated with that tag.
6. WHEN a Visitor requests the public blog list filtered by a category or tag that has no published posts, THE Blog_Service SHALL return an empty list with Pagination_Metadata.
7. IF an Admin_User assigns a category that does not exist to a blog post, THEN THE Blog_Service SHALL respond with a 400 validation error.

### Requirement 4: Blog Comments

**User Story:** As a Visitor, I want to leave comments on blog posts, so that I can engage with the content.

#### Acceptance Criteria

1. WHEN a Visitor submits a comment with a name, email, and body on a published post, THE Blog_Service SHALL persist the comment associated with that post and return the created comment.
2. WHEN a Visitor requests the comments of a published post, THE Blog_Service SHALL return the approved comments for that post ordered by creation time in descending order.
3. IF a Visitor submits a comment with a body that is empty or exceeds 2000 characters, THEN THE Blog_Service SHALL respond with a 400 validation error.
4. WHERE a comment body consists only of whitespace and is under 2000 characters, THE Blog_Service SHALL accept the comment as valid.
5. IF a Visitor submits a comment with an invalid email format, THEN THE Blog_Service SHALL respond with a 400 validation error.
6. WHEN an Admin_User deletes an existing comment, THE Blog_Service SHALL remove the comment and return a success response only after the deletion succeeds.
7. WHERE comment moderation is enabled, THE Blog_Service SHALL set newly created comments to an unapproved state and exclude them from public comment responses until an Admin_User approves them.

### Requirement 5: Blog Reactions

**User Story:** As a Visitor, I want to react to blog posts, so that I can express appreciation without writing a comment.

#### Acceptance Criteria

1. WHEN a Visitor submits a reaction to a published post, THE Blog_Service SHALL increment the post's reaction count and return the updated count.
2. THE Blog_Service SHALL include the current reaction count in each public blog post response.
3. IF a Visitor submits a reaction to a post that does not exist, THEN THE Blog_Service SHALL respond with a 404 error.

### Requirement 5b: Accurate Blog View Counting

**User Story:** As an Admin_User, I want accurate view counts on blog posts, so that I can measure real readership.

#### Acceptance Criteria

1. WHEN a unique Visitor session views a published post, THE Blog_Service SHALL increment the post's view count exactly once for that session within a 24-hour window.
2. WHILE the same Visitor session re-requests the same post within the 24-hour window, THE Blog_Service SHALL leave the post's view count unchanged.
3. THE Blog_Service SHALL include the current view count in each public blog post response.
4. WHEN the accurate view-counting system is first deployed, THE Blog_Service SHALL reset every existing post's view count to 0 and begin counting under the new tracking system.

### Requirement 6: Reading Time and Related Posts

**User Story:** As a Visitor, I want to see estimated reading time and related posts, so that I can plan my reading and discover more content.

#### Acceptance Criteria

1. WHEN a Visitor requests a published post, THE Blog_Service SHALL include a Reading_Time value computed as the post word count divided by 200 words per minute, rounded up to the nearest whole minute, with a minimum value of 1.
2. WHEN a Visitor requests a published post, THE Blog_Service SHALL include up to 3 related published posts selected by shared category or shared tags, excluding the requested post.
3. WHERE a post has no category and no tags, THE Blog_Service SHALL return the most recent published posts as related posts, excluding the requested post.

### Requirement 7: Contact Form

**User Story:** As a Visitor, I want to send a message through a contact form, so that I can reach the site owner.

#### Acceptance Criteria

1. WHEN a Visitor submits a contact message with a name, email, subject, and body, THE Contact_Service SHALL persist the message and return a success response.
2. WHEN a contact message is persisted, THE Contact_Service SHALL send a notification email to the configured owner address through the Email_Provider.
3. IF the Email_Provider fails to send the notification email, THEN THE Contact_Service SHALL persist the message and return a success response indicating the message was received.
4. IF a Visitor submits a contact message with a missing required field or an invalid email format, THEN THE Contact_Service SHALL respond with a 400 validation error and SHALL NOT persist the message.
5. WHEN an Admin_User requests the contact message list, THE Contact_Service SHALL return persisted messages ordered by creation time in descending order with Pagination_Metadata.

### Requirement 8: Newsletter Subscription

**User Story:** As a Visitor, I want to subscribe to a newsletter, so that I receive updates.

#### Acceptance Criteria

1. WHEN a Visitor submits a newsletter subscription with a valid email, THE Newsletter_Service SHALL persist the subscription and return a success response.
2. IF a Visitor submits a newsletter subscription with an email that is already subscribed, THEN THE Newsletter_Service SHALL return a success response without creating a duplicate subscription, including when the existing subscription status cannot be verified.
3. IF a Visitor submits a newsletter subscription with an invalid email format, THEN THE Newsletter_Service SHALL respond with a 400 validation error.
4. WHEN a Visitor requests unsubscribe using a valid unsubscribe token, THE Newsletter_Service SHALL mark the subscription as inactive and return a success response.

### Requirement 9: Testimonials

**User Story:** As an Admin_User, I want to manage testimonials, so that visitors can see social proof.

#### Acceptance Criteria

1. WHEN an Admin_User creates a testimonial with an author name, author role, and quote, THE Testimonial_Service SHALL persist the testimonial and return the created record.
2. WHEN a Visitor requests the public testimonial list, THE Testimonial_Service SHALL return only published testimonials.
3. WHEN an Admin_User updates the published state of a testimonial, THE Testimonial_Service SHALL persist the new state and return the updated testimonial.
4. IF an Admin_User creates a testimonial with a missing required field, THEN THE Testimonial_Service SHALL respond with a 400 validation error.

### Requirement 10: Admin Dashboard for Content Management

**User Story:** As an Admin_User, I want a dashboard to manage portfolio projects and blog posts, so that I can maintain site content efficiently.

#### Acceptance Criteria

1. WHILE an Admin_User is authenticated, THE Admin_Dashboard SHALL provide create, read, update, and delete operations for portfolio projects.
2. WHILE an Admin_User is authenticated, THE Admin_Dashboard SHALL provide create, read, update, and delete operations for blog posts.
3. IF an unauthenticated client requests an Admin_Dashboard management endpoint, THEN THE backend SHALL respond with a 401 response.
4. WHEN an Admin_User requests the admin project list, THE Admin_Dashboard SHALL return both published and unpublished projects with Pagination_Metadata.
5. WHEN an Admin_User requests the admin blog list, THE Admin_Dashboard SHALL return both published and unpublished posts with Pagination_Metadata.
6. WHEN an Admin_User toggles the published state of a project or post, THE Admin_Dashboard SHALL persist the new state and return the updated record.

### Requirement 11: Analytics and Statistics

**User Story:** As an Admin_User, I want analytics on visits and popular content, so that I can understand audience behavior.

#### Acceptance Criteria

1. WHEN a Visitor views a Public_Endpoint page tracked for analytics, THE Analytics_Service SHALL record a visit event with the path and timestamp.
2. WHEN an Admin_User requests the analytics summary, THE Analytics_Service SHALL return the total visit count, the visit count for the last 30 days, the top 5 most-viewed blog posts, and the top 5 most-viewed projects.
3. THE Analytics_Service SHALL return aggregated counts of projects grouped by category, tag, and tech stack.
4. IF an unauthenticated client requests the analytics summary, THEN THE Analytics_Service SHALL respond with a 401 response.

### Requirement 12: Rate Limiting and Security Hardening

**User Story:** As an Admin_User, I want the API protected against abuse, so that the service stays available and secure.

#### Acceptance Criteria

1. WHEN a client exceeds the configured request limit for authentication endpoints within the configured time window, THE Rate_Limiter SHALL respond with a 429 response.
2. WHEN a client exceeds the configured request limit for public write endpoints within the configured time window, THE Rate_Limiter SHALL respond with a 429 response.
3. THE backend SHALL set security-related HTTP response headers on every response.
4. THE backend SHALL restrict cross-origin requests to the configured allowed origins.
5. WHEN any request body is received, THE backend SHALL validate the body against its Zod schema and respond with a 400 error for invalid input before processing.
6. IF a request requiring a body is received with no body at all, THEN THE backend SHALL respond with a 400 validation error.

### Requirement 13: SEO Support

**User Story:** As a Visitor and search engine, I want sitemaps and dynamic metadata, so that content is discoverable and shareable.

#### Acceptance Criteria

1. WHEN the sitemap is requested, THE SEO_Service SHALL return an XML sitemap that includes the canonical URL of every published project and published blog post.
2. WHEN a Visitor loads a published project or post page, THE SEO_Service SHALL provide a page title, meta description, and Open Graph tags derived from that content item.
3. WHERE a content item defines a meta image, THE SEO_Service SHALL use the meta image as the Open Graph image regardless of other metadata derivation rules.
4. WHERE a content item does not define a meta description, THE SEO_Service SHALL derive the meta description from the content item's short description or excerpt.

### Requirement 14: Caching of Public Endpoints

**User Story:** As a Visitor, I want fast public pages, so that browsing is responsive.

#### Acceptance Criteria

1. WHEN a Public_Endpoint read request is served, THE Cache_Layer SHALL store the response for a bounded duration not exceeding the configured time-to-live.
2. WHILE a cached response for a Public_Endpoint read request is valid, THE Cache_Layer SHALL serve the cached response without querying the database.
3. WHEN content served by a Public_Endpoint is created, updated, or deleted, THE Cache_Layer SHALL invalidate the cached responses affected by that change.

### Requirement 15: Consistent Pagination

**User Story:** As a frontend developer, I want consistent pagination across list endpoints, so that the client can render lists uniformly.

#### Acceptance Criteria

1. THE backend SHALL return Pagination_Metadata containing total, page, limit, totalPages, hasNext, and hasPrev for every list endpoint.
2. WHERE a list request omits page or limit, THE backend SHALL apply the default page value of 1 and the default limit value of 10.
3. IF a list request provides a page or limit value that is not a positive integer, THEN THE backend SHALL respond with a 400 validation error.
4. WHEN a list request provides a page value greater than totalPages, THE backend SHALL return an empty data list with Pagination_Metadata rather than an error.

### Requirement 16: Test Coverage Improvement

**User Story:** As an Admin_User, I want automated tests for the new functionality, so that regressions are caught early.

#### Acceptance Criteria

1. THE test suite SHALL include automated tests covering the success and validation-error paths of the contact, newsletter, testimonial, blog comment, blog reaction, and portfolio filtering endpoints.
2. WHEN the test suite is executed, THE test suite SHALL run to completion and report passing results for all covered endpoints.
3. THE test suite SHALL include a round-trip test verifying that generating the sitemap XML and parsing it back yields the same set of canonical URLs.

### Requirement 17: Rename Misspelled Common Folder

**User Story:** As a developer, I want the misspelled `src/cummon` folder renamed to `src/common`, so that the codebase is consistent and readable.

#### Acceptance Criteria

1. THE backend source tree SHALL contain a `src/common` directory and SHALL NOT contain a `src/cummon` directory.
2. THE backend SHALL update every import path that referenced `src/cummon` to reference `src/common`.
3. WHEN the backend is compiled after the rename, THE TypeScript compiler SHALL report no module resolution errors caused by the rename.
4. WHEN the test suite is executed after the rename, THE test suite SHALL report the same passing results as before the rename.

### Requirement 18: Migrate Frontend Router to TanStack Router

**User Story:** As a developer, I want to replace `react-router-dom` with TanStack_Router in the Frontend_App, so that routing aligns with the existing TanStack ecosystem already used for data fetching.

#### Acceptance Criteria

1. THE Frontend_App SHALL define all routes using TanStack_Router.
2. WHEN the Router_Migration is complete, THE Frontend_App SHALL render every public route that existed under `react-router-dom` at the same URL path with equivalent content.
3. WHEN the Router_Migration is complete, THE Frontend_App SHALL render every Protected_Route that existed under `react-router-dom` at the same URL path with equivalent content.
4. WHEN a Visitor opens a public route URL directly through deep-linking or a bookmark, THE Frontend_App SHALL render the corresponding route without redirecting to a different path.
5. WHILE an Admin_User is not authenticated, THE Frontend_App SHALL redirect requests for any Protected_Route to the login route.
6. WHILE an Admin_User is authenticated, THE Frontend_App SHALL render the requested Protected_Route for the Admin_Dashboard.
7. WHEN a Visitor requests a URL path that matches no defined route, THE Frontend_App SHALL render a not-found view.
8. WHEN the Router_Migration is complete, THE Frontend_App SHALL list no `react-router-dom` dependency in its `package.json` and SHALL contain no import that references `react-router-dom`.
9. WHEN the Frontend_App is built after the Router_Migration, THE build process SHALL complete without module resolution errors caused by routing imports.
