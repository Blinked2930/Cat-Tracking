## Product Requirements Document (PRD)

**App Name (Working Title):** StraySync (or PunkPaws)
**Core Concept:** A real-time, shared PWA for roommates to track cat care (feeding, meds, etc.) featuring a gritty, punk-sketch aesthetic and a dynamic "ink-fill" progress visualization.

**User Flow:**
1. **Onboarding & Auth:** User logs in via Clerk. If they have no household, they are prompted to either "Start a Squat" (create a household) or "Join the Crew" (enter a 6-digit invite code).
2. **Initial Setup:** The household creator adds the cats (names, optional photos) and defines their daily routines using a flexible configuration (e.g., Feed: Checkbox 2x/day, Meds: Counter 1x/day). 
3. **The Dashboard (Home):** A vertically split screen displaying a hand-drawn, jagged cat silhouette for each cat. As roommates complete tasks, the silhouette fills with a messy, ink-scribble texture from bottom to top. 
4. **Cat Details:** Tapping a cat expands their profile to reveal the specific tasks for the day. Checking off a task instantly syncs across all roommates' devices.
5. **Activity Log:** A scrolling feed at the bottom of the cat profile showing a history of who did what and when (e.g., "Aline fed Iggy @ 8:15 AM").
6. **Daily Reset:** Tasks automatically clear at midnight local time, leaving the silhouettes empty for the next day.