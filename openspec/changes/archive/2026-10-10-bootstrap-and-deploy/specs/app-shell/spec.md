# Spec Delta: app-shell

## Purpose

The page frame every screen shares: header, navigation, footer, responsive container, design tokens and the accessibility baseline, plus the fallbacks shown for unknown pages and unexpected crashes.

## ADDED Requirements

### Requirement: Shared header and footer
Every page SHALL render a header with the "Volunteer Shift Board" wordmark (linking to the events list) and primary navigation, and a footer reading "Volunteer Shift Board · Demo data for portfolio review". The navigation item for the current page SHALL be marked active.

#### Scenario: Visiting the events list
- **WHEN** a visitor opens `/`
- **THEN** the header shows the wordmark and the links "Events" and "My shifts"
- **AND** "Events" has `aria-current="page"` and the active style (`primary-tint` background, `primary-ink` text)
- **AND** the footer text is shown

### Requirement: Compact navigation on narrow screens
Below 640px wide, the header SHALL show the short wordmark "Shift Board" and put the navigation behind a menu button that works from the keyboard and announces whether it is expanded.

#### Scenario: Opening the menu on a phone
- **WHEN** the viewport is 390px wide and the user activates the menu button
- **THEN** the navigation links are shown and the button has `aria-expanded="true"`

#### Scenario: Closing the menu with Escape
- **WHEN** the menu is open and the user presses Escape
- **THEN** the menu closes and focus returns to the menu button

### Requirement: Design tokens
The interface SHALL use the colors, Figtree typography, radii, spacing and container widths defined in `docs/design/tokens.md`.

#### Scenario: Base page styling
- **WHEN** any page renders
- **THEN** the page background is `#F3F7F6`, primary text is `#14302E`, the font is Figtree with a `system-ui, sans-serif` fallback, and content sits in a container at most 1120px wide with 24px side padding (16px below 640px)

### Requirement: Accessible controls
Interactive elements SHALL be native links, buttons and form controls at least 44px tall, and SHALL show a 3px solid `#0F766E` focus ring offset by 2px when focused.

#### Scenario: Keyboard navigation
- **WHEN** a keyboard user tabs through the header
- **THEN** each link and button receives focus in visual order and shows the focus ring

### Requirement: No sideways page scrolling
The page body SHALL never scroll horizontally; content wider than the screen (such as tables) SHALL scroll inside its own container.

#### Scenario: Small phone
- **WHEN** any page is viewed at 360px wide
- **THEN** the document does not scroll horizontally

### Requirement: Not-found page
Unknown client routes SHALL show a "Page not found" message with a link back to the events list.

#### Scenario: Mistyped URL
- **WHEN** a visitor opens `/does-not-exist`
- **THEN** the page shows "Page not found" inside the normal header and footer, with a link to `/`

### Requirement: Crash fallback
If a page fails with an unexpected client-side error, the app SHALL show a "Something went wrong" message with a "Reload page" button instead of a blank screen.

#### Scenario: Rendering error
- **WHEN** a component throws while rendering
- **THEN** the header and footer stay visible and the content area shows "Something went wrong" with a "Reload page" button
