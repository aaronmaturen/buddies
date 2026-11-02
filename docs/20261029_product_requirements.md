# Buddies — Product Requirements

## Goal

Small, smoothly animated characters that feel alive in a browser, in the spirit of chat assistants' avatars, built from as little as possible: eyes, brows and head motion.

## Users

- The author, exploring avatar ideas for future products.
- Anyone visiting buddies.aaronmaturen.com to play with it.

## Requirements

### Characters
- Each buddy is a JSON config (name, head, eyes, brows, hands, personality); random buddies get random configs and names from a list.
- Looks: 16 head shapes, 4 eye shapes, brows, color from weighted tones, and a head style (cel-shaded, sticker, sketch, jelly, pixel, neon, inked, comic, clay, fuzzy, hologram, paper or chalk).
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
- 28 one-off reactions layered on the current mood, including blowing bubbles that drift off and pop, and whistling music notes.
- Mouths appear only during emotes.
- Cartoon symbols (hearts, !, ?, Z, sweat drop, anger mark, sparkles, blush) either turn with the head or float around it.
- Floating hands with no arms (white gloves or head-colored mittens, per buddy) for wave, facepalm, peekaboo, thumbs up, shrug, clap, think and no.
- Accessories during emotes: worn (sunglasses, party hat, nightcap) and held (coffee mug, gift, magnifying glass that enlarges the eye behind it).
- Booping the stage buddy plays Love; the cast follows an emote a beat later.
- Look away turns the head right around, with a peek over the shoulder. Idle buddies also turn away now and then.

### Morphs
- The buddy can morph into an object that acts on its own, then morph back: a balloon, rocket, bouncy ball, ghost, fish, star, a cat that licks its paw and a dog that wags its tail.
- The morph keeps the buddy's head style and colors, and its eyes ride along on the object.

### Page
- A cast of 12, each with a unique head shape and well-spread colors; the stage shows one of them, picked from the Cast view.
- Tunable traits for the stage buddy: eye shape, eye size, eye spacing, temper, attention, gaze and blink rate.
- Controls: mood, emotes, head style for the stage buddy (invisible, ghost, or any of the 13 drawn styles), shape, color, name, reroll, load a config.
- The viewer shows the cast grid or the stage: a card opens the stage, a grid icon goes back, and a copy icon copies the config. It stays in view while every control scrolls in one column.
- Away: everyone vanishes in a puff and stays gone until called back.
- Hold still stops idle motion while emotes and morphs still play.
- Leader mode: clicking a buddy opens a pie menu in place of the Emotes and Mood buttons. That buddy leads and the others follow.
- Light and dark themes, phone width, reduced motion, keyboard and screen reader use.

### Library
- The characters are a package, `@aaronmaturen/buddies`, that other apps can import: an ES module, a script tag build and types.
- Importing is safe during server-side rendering, and `destroy()` cleans up after a buddy.
- Leader picks are plain JSON command events, so they can drive buddies anywhere.

### Hosting
- Static files built with esbuild, served from Cloudflare at buddies.aaronmaturen.com.
- Deploys automatically on push to `main`.

## Out of scope (for now)
- Permanent mouths and lip sync.
- WebGL rendering.
- Saving buddies anywhere beyond copying and pasting their config.
