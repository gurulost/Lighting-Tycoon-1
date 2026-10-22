# Lighting Tycoon privacy information

This describes the data handling implemented in this repository. Store releases
must link to a published copy and verify the service settings described in
[the release privacy inventory](docs/privacy.md).

Game progress and preferences are stored locally on your device. The app does not
provide cloud save synchronization. Playtest scenarios use separate local saves.
The app plays sound effects and does not request microphone recording permission.

Native builds configured with PostHog analytics send gameplay events, such as
merges, completed orders, progression, and tutorial interactions, along with app,
device, operating system, session, and build information. Events use a randomly
generated player identifier stored on the device; it is not a name or email
address. This identifier allows events from the same installation to be analyzed
together. Web and automated E2E builds do not initialize PostHog.

Release builds use Sentry for crash and error diagnostics, including error
messages, stack traces, app/device information, and diagnostic breadcrumbs.
Default personal-information enrichment and Sentry log ingestion are disabled.
Network requests necessarily reach the service infrastructure; these settings do
not make network traffic anonymous or determine service-side IP handling.

Screen replay is disabled by default. A production native build can explicitly
enable error-associated replay. When enabled, the app masks all text, images, and
vector graphics and does not sample ordinary full sessions. Such replay can still
reveal interface layout, timing, and interaction patterns.

The app does not configure advertising tracking, access the advertising ID, or
send names, email addresses, microphone recordings, contacts, or precise location
through its gameplay telemetry. Avoid putting personal information into bug
reports or diagnostic messages.

Uninstalling the app removes its local app data according to the device's storage
and backup behavior. Resetting game progress does not delete analytics or
diagnostic records already received by a service, and is not a privacy deletion
request. Remote retention periods and deletion procedures depend on the project's
PostHog and Sentry settings; these are not specified in source control and must be
confirmed by the project owner before publication as a store privacy policy.

Support currently uses the process in [SUPPORT.md](SUPPORT.md). No private privacy
request address is configured in this repository. A published store policy must
provide an owner-approved private contact and verified retention/deletion terms;
do not post identifiers or personal deletion requests in the public issue tracker.
