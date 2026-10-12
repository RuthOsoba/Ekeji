# Real-time messaging and notifications

## What you will get
- Messages show up the moment they are sent, with no refresh or waiting.
- A "typing..." indicator while the other person is writing.
- "Seen" under your last message once they have opened it.
- Unread counts: a badge on the Messages icon (desktop and phone), and bold unread conversations in the inbox with a count on each.
- The inbox updates live: new conversations and the latest message move to the top.
- A pop-up toast ("New message from Ada: ...") anywhere in the app, with a button to open the chat. No toast if you are already viewing that chat.
- A bell in the header showing all notifications (messages, sales, delivery updates, reviews), updating live, with "mark all as read".
- Optional browser notifications when the tab is in the background (asked once, can be turned off in Settings).

## Technical details
- Migration: add `read_at` to messages; add `messages`, `conversations` and `notifications` to the `supabase_realtime` publication (they are missing now, so the existing subscription gets nothing); add a `mark_conversation_read(conversation_id)` security-definer function; stop inserting a notification row per message (the unread badge covers messages, which avoids double alerts). Keep the order and review notifications.
- One `RealtimeProvider` in `__root.tsx` for signed-in users: a single channel listening to message inserts/updates (RLS limits rows to the user's conversations) and notification inserts; it updates the React Query caches (`messages`, `conversations`, `notifications`, unread counts) directly and fires toasts.
- Chat page: remove the 8s polling; optimistic send; a Presence/broadcast channel per conversation for typing; call `mark_conversation_read` on open and when new messages arrive while viewing.
- `NotificationBell` component and unread badges in `SiteChrome`.
- Verify with two Playwright browser sessions (the user plus the demo auto-reply) that messages and the badge appear instantly.
