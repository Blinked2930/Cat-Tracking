## Technical Specification

**The Stack:**
*   **Frontend:** Next.js (App Router) + React. Ideal for vibe coding in Cursor/Windsurf, excellent PWA support via `next-pwa`, and plays perfectly with Clerk and Convex.
*   **Styling:** Tailwind CSS + Framer Motion (for the choppy, punk-rock fill animations).
*   **Database & Sync:** Convex. Handles real-time WebSockets out of the box so roommates see checks instantly.
*   **Authentication:** Clerk. Simple, drop-in auth.

**Architecture Notes:**
*   **Timezones & Resets:** Instead of running a midnight Cron job (which gets messy with roommates in different timezones or late-night feedings), the frontend will query Convex for task completions strictly for the *current local day*. If no completions exist for today, the UI naturally appears reset. 
*   **Punk Sketch Vibes:** Use SVG masks for the silhouettes. The "fill" can be an SVG `pattern` of scribbles that animates upward using Framer Motion as the completion percentage increases. UI elements should use brutalist, thick black borders (`border-4 border-black`), rough shadows, and a high-contrast palette (black, off-white paper texture, neon pink/green accents).