# BiteCheck Social — Product Requirements Document

> Scope: Social feed, following graph, reactions, comments, profiles, notifications, discovery.
> Challenges, leaderboards, verified badges, photos, and Contact Picker API are explicitly out of scope (see Todo).

---

## 1. Vision

BiteCheck becomes the Strava of fishing. Every logged catch is a potential social moment. Users follow friends and notable anglers, react to catches, leave comments, and discover new fishing spots and people through an engagement-ranked feed.

---

## 2. Core Concepts

| Concept | Description |
|---|---|
| **Catch** | A logged fishing event. Already exists. Extended with social fields. |
| **Feed** | Mixed stream of catches from followed users + discover content. |
| **Social Graph** | One-way follow relationships. Private accounts require approval. |
| **Reaction** | One of 👍 ✋ 😁 😭 😯 per catch per user. |
| **Comment** | Flat text comment on a catch. Supports @mentions. |
| **Notification** | In-app + push event triggered by social actions. |
| **Profile** | Public page per user with stats, PRs, recent catches. |
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
  isPrivate: boolean,         // account-level privacy
  locationPref: 'exact' | 'approximate' | 'hidden',  // account-level default
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

### 3.4 `catches/{catchId}` (extended)

Existing fields kept. New social fields added:

```
{
  // ... existing fields ...
  isPublic: boolean,                    // false = hidden from everyone
  locationShare: 'exact' | 'approximate' | 'hidden',  // overrides account default
  approximateLocationName: string | null,   // e.g. "Mjøsa", user-editable
  reactionCounts: { [emoji: string]: number },  // denormalized
  commentCount: number,                 // denormalized
}
```

### 3.5 `catches/{catchId}/reactions/{userId}`

```
{
  userId: string,
  emoji: '👍' | '✋' | '😁' | '😭' | '😯',
  createdAt: Timestamp,
}
```

### 3.6 `catches/{catchId}/comments/{commentId}`

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

### 3.7 `notifications/{uid}/items/{notificationId}`

```
{
  type: 'follow' | 'follow_request' | 'follow_accepted' | 'reaction' | 'comment' | 'mention',
  fromUid: string,
  fromUsername: string,       // denormalized
  fromPhotoURL: string | null,
  catchId: string | null,     // null for follow notifications
  emoji: string | null,       // for reaction notifications
  commentSnippet: string | null,
  read: boolean,
  createdAt: Timestamp,
}
```

### 3.8 `feed/{uid}/items/{catchId}`

Fan-out-on-write feed. Written to by Cloud Functions when a catch is created/updated.

```
{
  catchId: string,
  authorUid: string,
  authorUsername: string,
  species: string,
  createdAt: Timestamp,
  engagementScore: number,    // updated on reactions/comments
  seenBy: string[],           // array of uids who have seen this item (capped)
}
```

> **Note:** Fan-out on write is the right pattern at this scale. When a user posts, a Cloud Function writes to each follower's feed collection. For large follower counts (future "celeb" accounts) this may need a hybrid approach — defer to Todo.

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

### 4.7 Catch Visibility & Location Privacy

#### Per-catch toggles (shown in catch log form + edit view)
1. **Visibility toggle:** "Vis i feed" (on by default). Off = `isPublic: false`, invisible to all.
2. **Location toggle:** overrides account default. Options: Exact / Vis omtrentlig sted / Skjul sted.
3. **Approximate location name:** auto-filled from Nominatim reverse geocode of coordinates. User can edit to any free text (e.g. "Et sted i Nordland 😄").

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

### Vertical 3 — Social Catch Layer
**Goal:** Catches have social fields. Feed cards display correctly.

- Extend catch log form with visibility toggle + location privacy toggle + approximate location name.
- `isPublic`, `locationShare`, `approximateLocationName` written on new catches.
- Catch card component (condensed view).
- Catch detail view (full conditions + map).
- No feed yet — just the components, testable via a static list.

**Testable:** Log catch with "Skjul sted" → card shows no map → log catch with "Vis omtrentlig sted" → card shows Nominatim-derived name → tap card → detail view shows conditions.

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
```

**Rules:**
- `lib/social/` contains pure logic — no React, no UI imports.
- `hooks/social/` wraps lib functions in React state — no direct Firestore calls.
- `components/social/` is pure UI — no Firestore, only hooks.
- Cloud Functions are a separate deploy unit — never imported by the PWA.
- `feedRanking.ts` is deliberately isolated — the entire ranking strategy lives here and nowhere else.

---

## 7. Firestore Security Rules (additions)

```
// Users can read any public profile; only owner can write
match /users/{uid} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == uid;
}

// Usernames index: anyone can read; only enforced by transaction
match /usernames/{username} {
  allow read: if request.auth != null;
  allow write: if request.auth != null; // transactions handle uniqueness
}

// Followers: target can read; follower can write own entry
match /users/{uid}/followers/{followerId} {
  allow read: if request.auth.uid == uid || request.auth.uid == followerId;
  allow write: if request.auth.uid == followerId;
  allow delete: if request.auth.uid == followerId || request.auth.uid == uid; // deny = delete
}

// Catches: visible if public AND (exact: anyone / approximate: anyone / hidden: anyone — location filtered client-side)
// Private catches: only owner
match /catches/{catchId} {
  allow read: if request.auth != null &&
    (resource.data.isPublic == true || resource.data.user_id == request.auth.uid);
  allow write: if request.auth.uid == resource.data.user_id;
}

// Reactions: any authenticated user can react to a public catch
match /catches/{catchId}/reactions/{userId} {
  allow read: if request.auth != null;
  allow write, delete: if request.auth.uid == userId;
}

// Comments: any authenticated user can comment; owner or commenter can delete
match /catches/{catchId}/comments/{commentId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow delete: if request.auth.uid == resource.data.userId
    || request.auth.uid == get(/databases/$(database)/documents/catches/$(catchId)).data.user_id;
}

// Notifications: only owner can read/write
match /notifications/{uid}/items/{notificationId} {
  allow read, write: if request.auth.uid == uid;
}

// Feed: only owner can read; Cloud Functions write (admin SDK bypasses rules)
match /feed/{uid}/items/{catchId} {
  allow read: if request.auth.uid == uid;
}

// Personal records: anyone authenticated can read; Cloud Functions write
match /personalRecords/{uid} {
  allow read: if request.auth != null;
}
```

---

## 8. Todo (Out of Scope Now)

- **Challenges** — community goals and competitions
- **Leaderboards** — biggest fish / most catches by species, area, time window
- **Verified/celeb badge** — ✓ on notable angler profiles
- **Photos on catches** — requires Firebase Blaze plan + Storage setup
- **Feed discover algorithm** — "people followed by your friends" graph traversal
- **Contact Picker API** — full phone contact invite (browser support patchy)
- **Push notifications** — bundle with solunar push work; needs service worker integration
- **Fan-out scaling** — hybrid approach for accounts with large follower counts
- **Reporting/moderation** — report a catch, block a user
- **Code-splitting** — MapLibre + SunCalc dynamic import (already in main Todo)
