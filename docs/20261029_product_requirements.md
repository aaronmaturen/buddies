# Buddies — Product Requirements

## Goal

Small, smoothly animated characters that feel alive in a browser, in the spirit of chat assistants' avatars, built from as little as possible: eyes, brows and head motion.

## Users

- The author, exploring avatar ideas for future products.
- Anyone visiting buddies.aaronmaturen.com to play with it.

## Requirements

### Characters
- Generated from a text seed; the same seed always produces the same character.
- Looks: 16 head shapes, 4 eye shapes, brows, color from weighted tones.
- Personality from motion: spring stiffness, blink rate, curiosity, attention to the cursor, resting tilt.
- Eyes always have whites and pupils.

### Motion
- Eyes lead, head follows.
- Idle life: breathing bob, noise drift, blinks (sometimes doubled), random glances.
- Cursor tracking when the character is "attending".
- Clicking the featured character boops it.

### Moods
- 15 moods: neutral, happy, sad, angry, surprised, curious, thinking, sleepy, skeptical, excited, shy, bored, confused, worried, smug.
- Mood changes blend smoothly; eyes never disappear.
- Optional automatic cycling through moods.

### Emotes
- 25 one-off reactions layered on the current mood.
- Mouths appear only during emotes.
- Cartoon symbols (hearts, !, ?, Z, sweat drop, anger mark, sparkles, blush) either turn with the head or float around it.
- Floating hands with no arms (white gloves or head-colored mittens, by seed) for wave, facepalm, peekaboo, thumbs up, shrug, clap, think and no.
- Accessories during emotes: worn (sunglasses, party hat, nightcap) and held (coffee mug, gift, magnifying glass that enlarges the eye behind it).
- Booping the featured buddy plays Love; the cast follows an emote a beat later.

### Page
- One featured character with the cast of 11 beneath it, each with a unique head shape and well-spread colors.
- Controls: mood, head mode (invisible / ghost / cel-shaded), shape, color, seed, reroll.
- Light and dark themes, phone width, reduced motion.

### Hosting
- Static, no build step, served from Cloudflare at buddies.aaronmaturen.com.
- Deploys automatically on push to `main`.

## Out of scope (for now)
- Permanent mouths and lip sync.
- WebGL rendering.
- Saving or sharing characters beyond the seed text.
