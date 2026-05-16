# BiteCheck Social — Product Requirements Document

> Scope: Social feed, following graph, reactions, comments, profiles, notifications, discovery, photos (requires Firebase Blaze upgrade).
> Challenges, leaderboards, verified badges, and Contact Picker API are explicitly out of scope for v1 (see Todo).
>
> **Core social unit: the fishing trip, not the individual catch.** A trip is published immediately when the first catch is logged and updates live as more catches are added. Trips are closed explicitly by the user, not by a time heuristic.

---

## 1. Vision

BiteCheck becomes the Strava of fishing. Every fishing trip is a social moment — whether you land ten mackerel or nothing at all. Users follow friends and notable anglers, react to trips, leave comments, and discover new fishing spots and people through an engagement-ranked feed.

---

## 2. Core Concepts

| Concept | Description |
|---|---|
| **Trip** | The primary social unit. One fishing outing = one feed post. Contains 0–N catches. Publishes immediately on first catch or explicit start. Auto-closes after 8h of inactivity. Visibility is set per trip: Everyone / Followers / Only me. |
| **Catch** | A logged fish. Always belongs to a trip. Not a standalone feed item. Visibility is inherited from the trip. Location precision is set per catch (exact / approximate / hidden), defaulting to the user's profile preference. |
| **Feed** | Mixed stream of trips from followed users + discover content. |
| **Social Graph** | One-way follow relationships. Private accounts require approval. |
| **Reaction** | One of 👍 ✋ 😁 😭 😯 per trip per user. |
| **Comment** | Flat text comment on a trip. Supports @mentions. |
| **Companion** | A person tagged as present on the trip. BiteCheck users link to their profile and get a notification; non-users are stored as a display name only. |
| **Notification** | In-app + push event triggered by social actions. |
| **Profile** | Public page per user with stats, PRs, recent trips. |
| **Username** | Unique handle chosen on first login. Used for search and @mentions. |

---

## 3. Data Model (Firestore)

### 3.1 `users/{uid}`

```
{
  uid: string,
  username: string,           // unique, lowercase, chosen on first login
  displayName: string,        // from Google or manually set
  photoURL: string | null,
  mainLocation: string,       // free text e.g. "Tromsø"
  memberSince: Timestamp,
  isPrivate: boolean,         // account-level privacy — acts as ceiling: private account makes all trips followers-only regardless of trip visibility setting
  locationPref: 'exact' | 'approximate' | 'hidden',  // default for new catches; user can override per catch
  followersCount: number,     // denormalized
  followingCount: number,     // denormalized
  catchCount: number,         // denormalized
  speciesCount: number,       // denormalized, distinct species caught
}
```

### 3.2 `users/{uid}/followers/{followerId}`

```
{
  followerId: string,
  followedAt: Timestamp,
  status: 'active' | 'pending'   // pending = awaiting approval on private account
}
```

### 3.3 `users/{uid}/following/{followingId}`

```
{
  followingId: string,
  followedAt: Timestamp,
  status: 'active' | 'pending'
}
```

### 3.4 `trips/{tripId}`

The primary social entity. One trip = one feed post.

```
{
  tripId: string,
  uid: string,                          // owner
  status: 'open' | 'closed',           // open = still accepting catches; closed = final
  visibility: 'everyone' | 'followers' | 'only_me',  // who can see this trip. 'everyone' on a private account behaves like 'followers'.
  isMultiDay: boolean,                  // user-set flag; no UI difference except surfaced on trip card
  startedAt: Timestamp,
  closedAt: Timestamp | null,           // null while open; set on explicit user action only
  location: GeoPoint | null,            // location of first catch, or user's location at start
  locationShare: 'exact' | 'approximate' | 'hidden',
  approximateLocationName: string | null,
  catchCount: number,                   // denormalized
  species: string[],                    // denormalized list of distinct species caught
  companions: [                         // people on the trip
    { uid: string | null, displayName: string, username: string | null }
  ],
  note: string | null,                  // free text trip note
  weatherSnapshot: object | null,       // conditions at trip start (from useWeather)
  reactionCounts: { [emoji: string]: number },
  commentCount: number,
}
```

> **Close rule:** Trips are closed explicitly by the user only — no auto-close. When logging a catch, the confirmation screen offers two actions: **Continue trip** (trip stays open) or **End trip** (sets `status: 'closed'`, `closedAt: now`). Dismissing without choosing leaves the trip open. The `isMultiDay` flag has no effect on close logic — it is purely informational, surfaced on the trip card so followers know the trip spans multiple days.

### 3.5 `catches/{catchId}` (extended)

Existing fields kept. New fields:

```
{
  // ... existing fields ...
  tripId: string,                       // always set — every catch belongs to a trip
  locationShare: 'exact' | 'approximate' | 'hidden',  // defaults to user's locationPref; overridable per catch
  approximateLocationName: string | null,
  photoRefs: string[],                  // ordered list of Firebase Storage paths, max 10
                                        // empty until Firebase Blaze is enabled
}
```

> **Photos:** Each catch supports 0–10 photos stored in Firebase Storage at `catches/{catchId}/{filename}`. Photos can be added at log time (camera capture) or after the fact (camera roll). Requires Firebase Blaze plan — `photoRefs` is written as `[]` until Storage is enabled. The UI shows a photo add button that is visible but shows an "upgrade required" message until Blaze is active. This ensures the data model is in place before Storage is enabled.
>
> **Photo caching strategy (implement at upload time):**
> 1. **CDN cache header** — set `Cache-Control: public, max-age=31536000` on every upload. Firebase Storage serves via Google's CDN; this header makes the CDN cache the image for a year so repeat requests are served from edge at zero egress cost.
> 2. **Browser cache** — automatic once the CDN header is set. Same photo opened twice costs nothing after the first load.
> 3. **Service worker cache** — add a Workbox `CacheFirst` runtime strategy on `firebasestorage.googleapis.com` in `vite.config.ts`. Photos then work offline and survive app restarts without re-downloading.
> 4. **Compress on upload** — resize to max 1080px on the long edge, JPEG at 80% quality before uploading. Reduces a typical phone photo from 3–5 MB to 200–400 KB, cutting egress cost by ~10×.

### 3.6 `trips/{tripId}/reactions/{userId}`

```
{
  userId: string,
  emoji: '👍' | '✋' | '😁' | '😭' | '😯',
  createdAt: Timestamp,
}
```

### 3.7 `trips/{tripId}/comments/{commentId}`

```
{
  commentId: string,
  userId: string,
  username: string,         // denormalized for display
  photoURL: string | null,  // denormalized
  text: string,             // max 500 chars
  mentions: string[],       // list of uid mentioned via @username
  createdAt: Timestamp,
  editedAt: Timestamp | null,
}
```

### 3.8 `notifications/{uid}/items/{notificationId}`

```
{
  type: 'follow' | 'follow_request' | 'follow_accepted' | 'reaction' | 'comment' | 'mention' | 'companion_tag',
  fromUid: string,
  fromUsername: string,       // denormalized
  fromPhotoURL: string | null,
  tripId: string | null,      // null for follow notifications
  emoji: string | null,       // for reaction notifications
  commentSnippet: string | null,
  read: boolean,
  createdAt: Timestamp,
}
```

### 3.9 `feed/{uid}/items/{tripId}`

Fan-out-on-write feed. Written to by Cloud Functions when a trip is created/updated.

```
{
  tripId: string,
  authorUid: string,
  authorUsername: string,
  species: string[],          // distinct species on the trip
  catchCount: number,
  status: 'open' | 'closed',
  startedAt: Timestamp,
  engagementScore: number,    // updated on reactions/comments
  seenBy: string[],           // array of uids who have seen this item (capped)
}
```

> **Note:** Fan-out on write is the right pattern at this scale. When a trip is first published (first catch logged), a Cloud Function writes to each follower's feed. Subsequent catch additions update the existing feed item in place — followers see the live update without a new post appearing. For large follower counts (future "celeb" accounts) this may need a hybrid approach — defer to Todo.

### 3.9 `usernames/{username}` (lookup index)

```
{
  uid: string
}
```

Used to enforce uniqueness and enable username search without a full collection scan.

### 3.10 `personalRecords/{uid}`

```
{
  bySpecies: {
    [species: string]: {
      biggest: { weight: number | null, length: number | null, catchId: string, date: Timestamp },
      smallest: { weight: number | null, length: number | null, catchId: string, date: Timestamp },
    }
  }
}
```

Updated by a Cloud Function whenever a catch is logged.

---

## 4. Feature Specifications

### 4.1 Username Selection (First Login)

- Triggered on first login if `users/{uid}.username` is null.
- Full-screen modal, blocks app access until complete.
- Validation: 3–20 chars, alphanumeric + underscore, lowercase, unique.
- Uniqueness checked against `usernames/` collection (Firestore transaction).
- On submit: writes `users/{uid}` + `usernames/{username}`.

### 4.2 Profile Page

Accessible at `/profil/:username`.

**Own profile:** editable (display name, photo URL, main location, privacy settings, location preference).

**Others' profile:**
- Picture, username, display name, main location, member since.
- Follower / following counts (tappable → list).
- Follow / Unfollow / Pending button.
- PRs: biggest + smallest fish per species (from `personalRecords`).
- Total catch count, total species count.
- Top 3 favorite species (derived from catch history, most logged).
- Recent public catches grid/list.

**Private account + not following:** profile shows name + follower count only. Catches hidden.

### 4.3 Social Graph

#### Follow (public account)
1. User taps Follow.
2. Write `users/{targetUid}/followers/{myUid}` with `status: 'active'`.
3. Write `users/{myUid}/following/{targetUid}` with `status: 'active'`.
4. Increment `followersCount` on target, `followingCount` on self.
5. Write notification to target.

#### Follow (private account)
1. User taps Follow → button shows "Venter".
2. Write both subcollections with `status: 'pending'`.
3. Write follow_request notification to target.
4. Target sees request in notification center → Accept / Deny.
5. On accept: update status to `active`, increment counts, write follow_accepted notification.
6. On deny: delete both subcollection docs, no count change.

#### Unfollow
1. Delete both subcollection docs.
2. Decrement counts.
3. Remove target's catches from follower's feed (Cloud Function).

### 4.4 Feed

#### Layout
- Single mixed feed on the home/feed page.
- Infinite scroll, paginated (20 items per page).
- Two content pools, blended by algorithm:
  - **Following pool:** catches from users you follow.
  - **Discover pool:** high-engagement catches from non-followed users (public accounts only).

#### Ranking (v1 — simple, replace later)
Score per feed item = `engagementScore` × `recencyWeight` × `unreadBonus`

- `recencyWeight` = decays over 48 hours.
- `unreadBonus` = 2× if `uid` not in `seenBy` array.
- `engagementScore` = total reactions + (comments × 2).

The algorithm lives in one isolated module (`src/lib/social/feedRanking.ts`) so it can be swapped without touching UI.

#### Feed Card (condensed)
- Author avatar + username + main location + timestamp.
- Species name + size/weight.
- Tiny static map snippet (MapLibre static image or screenshot) — hidden if `locationShare: 'hidden'`.
- Reaction bar: 5 emoji + counts. Tap to react/unreact.
- Comment count (tappable → opens detail view).
- "..." menu: Report.

#### Feed Card Detail (full view)
- All card fields.
- Full-size map (if location shared).
- Weather/conditions at catch time: temp, pressure, wind, tide phase, bite score.
- Full comment thread + comment input.
- @mention autocomplete from followed users.

### 4.5 Reactions

- One reaction per user per catch (toggle: tap same emoji to remove, tap different to switch).
- Optimistic UI update.
- Counts denormalized on `catches/{catchId}.reactionCounts`.
- Notification sent to catch author (debounced — one notification per catch per hour max, not per reaction).

### 4.6 Comments

- Flat list, chronological, newest at bottom.
- Max 500 characters.
- @mention: type `@` → dropdown of followed users matching typed string.
- Stored mentions trigger mention notification to each mentioned user.
- Own comments: editable + deletable.
- Author can delete any comment on their catch.
- No threading. No quoting.

### 4.7 Trip Visibility & Catch Location Privacy

#### Trip visibility (set when starting or editing a trip)
Three options matching Strava's model:
- **Everyone** — visible to any authenticated user (subject to account-level ceiling: private accounts treat this as Followers).
- **Followers** — visible only to approved followers.
- **Only me** — private; never appears in any feed.

Default: Everyone (for public accounts) / Followers (for private accounts).

#### Per-catch location (shown in catch log form + edit view)
1. **Location precision:** overrides account default. Options: Exact / Approximate / Hidden.
2. **Approximate location name:** auto-filled from Nominatim reverse geocode of coordinates. User can edit to any free text (e.g. "Somewhere in Nordland 😄").

#### Account-level ceiling
`isPrivate: true` on the user profile forces all trips to be follower-gated, regardless of the trip's own `visibility` field. The trip's setting is preserved so it takes effect if the account is ever made public.

### 4.8 Discovery & Search

#### Username Search (`/søk`)
- Search input → query `usernames/` collection prefix match (Firestore `>=` / `<` trick on username field).
- Results: avatar, username, display name, follower count, follow button.

#### Email Invites
- User enters email address → app sends invite email via Firebase Extension (Trigger Email) or a simple Cloud Function.
- Email contains app URL + referral param `?invitedBy={uid}`.

#### Phone Contact Invites
- Uses Contact Picker API (`navigator.contacts.select`).
- Feature-detected at runtime — show button only if supported.
- Selected contacts get SMS/email invite (best-effort, platform-dependent).
- Unsupported browsers: show manual "Copy invite link" fallback.
- Full implementation: Todo.

#### "People you might know" (Discover section)
- Algorithm: Todo (v1 idea: users followed by ≥2 of your followings).
- For now: show most-followed public accounts not yet followed by the user.

### 4.9 Notifications

#### In-app Notification Center (`/varsler`)
- Bell icon in nav with unread count badge.
- List of notifications, newest first.
- Tap → navigate to relevant catch or profile.
- Mark all as read button.
- Notification types: new follower, follow request, follow accepted, reaction, comment, @mention.

#### Push Notifications
- Bundled with the solunar push notification work (Todo).
- Service worker handles both solunar alerts and social notifications.
- Permission requested once, covers both use cases.
- Payload: notification type + deep link URL.

### 4.10 Personal Records

- Tracked per user per species: biggest fish (weight, then length as tiebreak) + smallest fish.
- Updated by Cloud Function on every new catch write.
- Displayed on profile page.
- PRs for weight and length tracked separately (user may log one but not the other).

---

## 5. Implementation Verticals

Each vertical is independently deployable and testable. Suggested order:

### Vertical 1 — Identity Foundation
**Goal:** Every user has a username. Profiles exist.

- Username selection modal on first login.
- `users/` + `usernames/` Firestore collections.
- Basic profile page (`/profil/:username`) — own profile only, read/write.
- Privacy settings in profile edit.

**Testable:** Create account → forced to pick username → view own profile → change display name → toggle private account.

---

### Vertical 2 — Social Graph
**Goal:** Users can follow each other.

- Follow / Unfollow for public accounts.
- Follow Request flow for private accounts (request → accept/deny).
- Follower / following lists on profile.
- Follow button state (Following / Venter / Følg).
- Firestore rules: only authenticated users can write follows; only target can write accept/deny.

**Testable:** User A follows public User B → B gets notification → A sees "Following" → A unfollows → counts update. Then repeat with private account: A sends request → B accepts → relationship active.

---

### Vertical 3 — Trip & Catch Layer
**Goal:** Catches belong to trips. Social fields on catch. Feed cards display correctly.

- Trip creation on first catch log. Trip confirmation screen: **Continue trip** / **End trip** / **Multi-day trip** toggle.
- "Add to existing trip?" prompt when an open trip exists and user logs a new catch.
- Extend catch log form: visibility toggle, location privacy toggle, approximate location name, photo add button (shows "requires Blaze" if Storage not enabled).
- `tripId`, `isPublic`, `locationShare`, `approximateLocationName`, `photoRefs` written on new catches.
- Photo upload flow: camera capture + camera roll picker. Photos stored in Firebase Storage (requires Blaze). UI in place regardless.
- Trip card component (condensed feed view showing trip status, catch count, species list).
- Catch detail view (photo carousel at top, full conditions + map below).
- No feed yet — just the components, testable via a static list.

**Testable:** Log catch → prompted to continue or end trip → log second catch → offered to add to open trip → trip card shows 2 catches → add photo → photo appears in carousel → tap card → detail view shows conditions and photos.

---

### Vertical 4 — Reactions & Comments
**Goal:** Users can react to and comment on catches.

- Reaction bar component (5 emoji, toggle, optimistic update).
- `catches/{catchId}/reactions/` subcollection reads/writes.
- Comment list component (flat, chronological).
- Comment input with @mention autocomplete (from following list).
- `catches/{catchId}/comments/` subcollection reads/writes.
- Notification writes on reaction + comment.
- Denormalized counts updated via Cloud Function.

**Testable:** Open a catch detail → react → count increments → react again → unreact → leave comment → @mention a followed user → mentioned user sees notification.

---

### Vertical 5 — Feed
**Goal:** Users see a ranked mixed feed.

- Fan-out Cloud Function: on catch write → write to all followers' `feed/{uid}/items/`.
- Feed page with infinite scroll.
- Feed ranking module (`feedRanking.ts`) — v1 simple score.
- "Seen" tracking: mark items as seen when scrolled past.
- Discover pool: static query for high-engagement public catches not from followed users.

**Testable:** User A follows User B → B logs a catch → A opens feed → catch appears → scroll past it → re-open feed → item weighted lower.

---

### Vertical 6 — Notifications
**Goal:** In-app notification center works end-to-end.

- Notification center page (`/varsler`).
- Bell icon with unread badge in nav.
- Read/unread state, mark all read.
- Deep links from notifications to catch detail or profile.
- Push notification scaffold (service worker registration, permission request).

**Testable:** Get a new follower → bell badge shows 1 → open notifications → tap → navigate to follower's profile → badge clears.

---

### Vertical 7 — Search & Discovery
**Goal:** Users can find and invite others.

- Username search page (`/søk`).
- Firestore prefix query on `usernames/`.
- "People you might know" — most-followed public users not yet followed.
- Email invite form → Cloud Function sends email.
- Contact Picker API (feature-detected, fallback to copy-link).

**Testable:** Search for a username → results appear → tap → go to profile → follow. Send email invite → email arrives with app link.

---

### Vertical 8 — Personal Records
**Goal:** PRs tracked and displayed on profile.

- Cloud Function: on catch write, compare against existing PRs in `personalRecords/{uid}`.
- Profile page PR section: biggest + smallest per species.

**Testable:** Log a torsk at 3 kg → profile shows PR 3 kg → log another at 5 kg → PR updates → log one at 1 kg → smallest PR appears.

---

## 6. Code Architecture

Organize social code as distinct, swappable units. Each unit has no implicit dependencies on others — imports are explicit.

```
src/
  lib/
    social/
      graph.ts          — follow/unfollow/request/accept/deny logic
      feed.ts           — feed fetch + pagination
      feedRanking.ts    — ranking algorithm (swap this without touching anything else)
      reactions.ts      — reaction CRUD
      comments.ts       — comment CRUD + @mention parsing
      notifications.ts  — notification read/write
      invites.ts        — email + contact invite logic
      profile.ts        — profile read/write, username reservation
      personalRecords.ts — PR read logic (writes handled by Cloud Function)

  hooks/
    social/
      useFeed.ts
      useFollow.ts
      useProfile.ts
      useNotifications.ts
      useReactions.ts
      useComments.ts
      useSearch.ts

  components/
    social/
      FeedCard.tsx           — condensed catch card
      FeedCardDetail.tsx     — full catch detail + comments
      ReactionBar.tsx        — 5-emoji reaction strip
      CommentList.tsx        — flat comment thread
      CommentInput.tsx       — text input with @mention autocomplete
      FollowButton.tsx       — Follow / Venter / Følg med varsel
      UserAvatar.tsx         — avatar + fallback initials
      NotificationItem.tsx   — single notification row
      PersonalRecords.tsx    — PR display grid

  pages/
    Feed.tsx            — main feed page
    Profil.tsx          — user profile page
    Varsler.tsx         — notification center
    Søk.tsx             — search + discovery

  functions/             — Firebase Cloud Functions (separate deploy unit)
    src/
      feedFanout.ts      — on catch write: fan out to followers' feeds
      updatePRs.ts       — on catch write: update personalRecords
      updateCounts.ts    — on reaction/comment write: update denormalized counts
      sendInviteEmail.ts — HTTP function: send invite email
      // NOTE: no auto-close function — trips are closed explicitly by the user only
```

**Rules:**
- `lib/social/` contains pure logic — no React, no UI imports.
- `hooks/social/` wraps lib functions in React state — no direct Firestore calls.
- `components/social/` is pure UI — no Firestore, only hooks.
- Cloud Functions are a separate deploy unit — never imported by the PWA.
- `feedRanking.ts` is deliberately isolated — the entire ranking strategy lives here and nowhere else.

---

## 7. Firestore Security Rules (additions)

A `tripIsVisible()` helper centralises the visibility check so it isn't duplicated across trips, catches, reactions, and comments.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Central visibility check. Reads up to 3 documents (trip + user + follower).
    // Returns true for: owner, 'everyone' on a public account, or active follower on 'followers'/'everyone'.
    function tripIsVisible(tripId) {
      let trip = get(/databases/$(database)/documents/trips/$(tripId)).data;
      let ownerIsPrivate = get(/databases/$(database)/documents/users/$(trip.uid)).data.isPrivate;
      let followerDoc = /databases/$(database)/documents/users/$(trip.uid)/followers/$(request.auth.uid);
      let isActiveFollower = exists(followerDoc)
        && get(followerDoc).data.status == 'active';
      return trip.uid == request.auth.uid
        || (trip.visibility == 'everyone' && !ownerIsPrivate)
        || ((trip.visibility == 'everyone' || trip.visibility == 'followers') && isActiveFollower);
    }

    // Users: any authenticated user can read profiles; only owner can write.
    // NOTE: count fields (followersCount, followingCount, etc.) must only be written
    // by Cloud Functions via admin SDK — the client should never touch them directly.
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    // Usernames index: caller can only claim/release their own UID.
    // No updates — usernames are immutable once claimed (must release + re-claim to change).
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.uid == request.auth.uid;
    }

    // Followers: who follows {uid}.
    // On public accounts the follower may create an 'active' document directly.
    // On private accounts only 'pending' is allowed on create; only the target can accept.
    match /users/{uid}/followers/{followerId} {
      allow read: if request.auth.uid == uid || request.auth.uid == followerId;
      allow create: if request.auth.uid == followerId && (
        request.resource.data.status == 'pending' ||
        (request.resource.data.status == 'active'
          && !get(/databases/$(database)/documents/users/$(uid)).data.isPrivate)
      );
      allow update: if request.auth.uid == uid
        && resource.data.status == 'pending'
        && request.resource.data.status == 'active';
      allow delete: if request.auth.uid == followerId || request.auth.uid == uid;
    }

    // Following: who {uid} follows. Mirror of followers, written by the follower.
    // Validates that the doc body's followingId matches the path key.
    match /users/{uid}/following/{followingId} {
      allow read: if request.auth.uid == uid;
      allow create: if request.auth.uid == uid
        && request.resource.data.followingId == followingId;
      allow delete: if request.auth.uid == uid || request.auth.uid == followingId;
    }

    // Trips: primary social unit. Visibility enforced via tripIsVisible().
    // Prevent ownership transfer on update by asserting uid is immutable.
    match /trips/{tripId} {
      allow read: if request.auth != null && tripIsVisible(tripId);
      allow create: if request.auth.uid == request.resource.data.uid;
      allow update: if request.auth.uid == resource.data.uid
        && request.resource.data.uid == resource.data.uid;
      allow delete: if request.auth.uid == resource.data.uid;
    }

    // Catches: visibility inherited from parent trip.
    // locationShare is enforced at write time: store location: null when 'hidden',
    // store only approximateLocationName (not GeoPoint) when 'approximate'.
    // tripId must reference a trip owned by the same user to prevent cross-trip injection.
    match /catches/{catchId} {
      allow read: if request.auth != null && (
        resource.data.user_id == request.auth.uid ||
        tripIsVisible(resource.data.tripId)
      );
      allow create: if request.auth.uid == request.resource.data.user_id
        && get(/databases/$(database)/documents/trips/$(request.resource.data.tripId)).data.uid == request.auth.uid;
      allow update, delete: if request.auth.uid == resource.data.user_id;
    }

    // Reactions: gated on parent catch visibility. Doc ID = userId enforces one reaction per user.
    match /catches/{catchId}/reactions/{userId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/catches/$(catchId)).data.user_id == request.auth.uid ||
        tripIsVisible(get(/databases/$(database)/documents/catches/$(catchId)).data.tripId)
      );
      allow write, delete: if request.auth.uid == userId;
    }

    // Comments: gated on parent catch visibility.
    // Create validates userId ownership and enforces 500-char limit.
    match /catches/{catchId}/comments/{commentId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/catches/$(catchId)).data.user_id == request.auth.uid ||
        tripIsVisible(get(/databases/$(database)/documents/catches/$(catchId)).data.tripId)
      );
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.text.size() <= 500;
      allow delete: if request.auth.uid == resource.data.userId
        || request.auth.uid == get(/databases/$(database)/documents/catches/$(catchId)).data.user_id;
    }

    // Notifications: owner can read and delete their own. Cloud Functions create via admin SDK.
    match /notifications/{uid}/items/{notificationId} {
      allow read, delete: if request.auth.uid == uid;
    }

    // Feed: only owner can read; Cloud Functions write via admin SDK.
    match /feed/{uid}/items/{tripId} {
      allow read: if request.auth.uid == uid;
    }

    // Personal records: no PII, readable by all authenticated users.
    // Written exclusively by Cloud Functions via admin SDK.
    match /personalRecords/{uid} {
      allow read: if request.auth != null;
    }
  }
}
```

### Notes

**Location privacy — defense in depth:** Rules enforce *who* can read a document, but not *which fields* are safe. When a user sets `locationShare: 'hidden'`, the app must write `location: null` to Firestore (not just suppress display). For `'approximate'`, store only `approximateLocationName`, not the GeoPoint. This ensures exact coordinates are never in the database for those catches.

**Denormalized counts:** `followersCount`, `followingCount`, `catchCount`, `speciesCount` on user documents and `reactionCounts`, `commentCount` on trips are writable by the document owner (rules can't easily restrict individual fields without field-level diffs). These must only be written by Cloud Functions via admin SDK — the client UI must never touch count fields directly.

**Demo data:** The current `firestore.rules` allows any authenticated user to write catches with a `user_id` matching `demo-.*`. This must be replaced before launch — either restrict to a specific allowlist of known demo UIDs, or seed demo data exclusively via admin SDK and remove the exception from client rules entirely.

---

## 8. Todo (Out of Scope Now)

- **Photos (activate)** — data model and UI are in place (see §3.5). Activation requires upgrading to Firebase Blaze plan, creating a Storage bucket, and updating Firestore + Storage security rules. Once done, remove the "upgrade required" gate from the photo add button.
- **Challenges** — community goals and competitions
- **Leaderboards** — biggest fish / most catches by species, area, time window
- **Verified/celeb badge** — ✓ on notable angler profiles
- **Feed discover algorithm** — "people followed by your friends" graph traversal
- **Contact Picker API** — full phone contact invite (browser support patchy)
- **Push notifications** — bundle with solunar push work; needs service worker integration
- **Fan-out scaling** — hybrid approach for accounts with large follower counts
- **Reporting/moderation** — report a trip, block a user
- **Code-splitting** — MapLibre + SunCalc dynamic import (already in main Todo)
- **Map: tide forecast layer** — time-scrubber-aware, shows predicted tide level across map
- **Map: temperature forecast layer** — time-scrubber-aware, shows SST or air temp across map

---

## 9. Map Wind Layer

### 9.1 Overview

A 6th toggleable layer in the existing map layer panel. Animated wind particle flow (Yr.no-style) showing direction and speed. Shared time scrubber infrastructure at the bottom of the map screen.

### 9.2 Visualization

- Animated particles drift continuously across the map in the direction wind is blowing *to*.
- Particle color follows a green → yellow → red speed ramp.
- Speed legend pinned to left side of map: m/s as primary label, Beaufort scale in parentheses.
- Particle density is a single config constant (default: subtle).

Reference: Yr.no wind layer aesthetic.

### 9.3 Data

- **Zoomed out** (below zoom threshold): reuse `hourlyWeather[]` already returned by `useWeather.ts`. No extra API calls.
- **Zoomed in** (at or above zoom threshold): fetch wind forecast for the current map center from open-meteo. Re-fetch on pan, debounced.
- 12 hours of hourly wind data (direction + speed).
- All config in `WIND_CONFIG` object (see §9.6).

### 9.4 Time Scrubber

- Horizontal drag bar at the bottom of the map screen.
- Visible whenever at least one time-aware layer is active (wind layer now; tide + temperature forecast on Todo).
- Displays current selected timestamp.
- Drag to scrub manually through the 12-hour window.
- **Play button:** auto-advances timestamp, loops back to "now" after +12 hours.
- Scrubber is standalone shared infrastructure — not coupled to wind layer specifically.

### 9.5 Code Architecture

```
src/
  lib/
    windLayer.ts          — particle animation logic, color ramp, speed → Beaufort conversion
    windConfig.ts         — WIND_CONFIG and TIME_SCRUBBER_CONFIG constants (all tunables here)

  hooks/
    useWindData.ts        — selects hourly wind slice from useWeather or fetches for map center;
                           handles zoom threshold + debounced pan re-fetch

  components/
    map/
      WindParticleLayer.tsx   — MapLibre canvas overlay, renders animated particles
      WindLegend.tsx          — speed legend (m/s + Beaufort), pinned left
      MapTimeScrubber.tsx     — scrubber bar + play button, shared across time layers
```

- `windConfig.ts` is the single place to tune all constants — import it everywhere, change it once.
- `WindParticleLayer` and `MapTimeScrubber` are decoupled — scrubber emits a `timestamp` prop, layer consumes it.

### 9.6 Config Constants (`windConfig.ts`)

```ts
export const WIND_CONFIG = {
  PARTICLE_DENSITY: 60,            // number of simultaneous particles on screen
  ZOOM_THRESHOLD: 10,              // below this: use useWeather data; at/above: fetch for map center
  PAN_DEBOUNCE_MS: 800,            // debounce delay before re-fetching on pan
  FORECAST_HOURS: 12,              // how many hours ahead the scrubber covers
};

export const TIME_SCRUBBER_CONFIG = {
  PLAYBACK_MS_PER_HOUR: 1000,      // ms of real time per forecast hour during auto-play
  LOOP: true,                      // loop back to "now" after reaching end
};
```

### 9.7 Tune-After-Implementation Checklist

Test and adjust these after first working implementation:

- [ ] `PARTICLE_DENSITY` — does it look subtle enough? Can you still read the map underneath?
- [ ] `ZOOM_THRESHOLD` — does zoom 10 feel right for switching to local data?
- [ ] `PLAYBACK_MS_PER_HOUR` — does 1 second per hour feel readable or too fast/slow?
- [ ] `LOOP` — does looping feel natural or disorienting?
- [ ] `PAN_DEBOUNCE_MS` — does 800 ms feel responsive without hammering the API?
- [ ] Color ramp — are the green/yellow/red breakpoints at sensible m/s values for Norwegian coastal conditions?
- [ ] Legend placement — does left-side placement conflict with any existing map controls?
