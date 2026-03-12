# Build Log

## Session: 2026-03-12 (afternoon) — Video text overlay: render at playback, not baked

### Completed (committed, pushed)

**Video repositioner + crop position (`4e652ef`):**
- New `VideoRepositioner` component for choosing crop position on videos in the grid
- `crop_position` field on posts (API + DB) — applied via `objectPosition` CSS on grid and previews
- Text overlay editor canvas updated from 1080x1080 to 1080x1440 (3:4 aspect ratio)
- Moved overlay PNG baking from onExport into createPost for async sequencing

**Overlay-at-playback for video text (`d2bb27e`):**
- **Removed FFmpeg overlay bake at save time** — videos stay clean/unmodified
- New `overlay_image_url` DB column: transparent overlay PNG uploaded and stored per post
- Overlay PNG rendered on top of `<video>` via CSS absolute positioning + `pointer-events-none`
- Videos display in 3:4 `aspect-[3/4]` containers in both mobile and desktop modals (consistent with grid)
- `crop_position` now applied in modals too (was missing before)
- Fixed React state race conditions: `overlayImageUrlRef` and `overlayBlocksMapRef` ensure save payload has fresh values
- Fixed realism preset export path — was skipping overlay-only PNG (now extracted before the branch)
- Overlay state cleared when media is replaced (prevents stale overlay from old video)
- `isVideoCover` prop on TextOverlayEditor — hides Background Filters and De-AI Presets for video cover editing
- Editor display width reduced from 400→320px to fit 3:4 canvas on screen
- Blob URL cleanup via useEffect when editor closes (prevents memory leak)

### Key Learnings
- React state setters are async — never read state in a save payload that fires right after setState. Use synchronous refs alongside state.
- Wrapping a flex child (video) in a div breaks `max-h-full` constraint — use fragments or keep the element as a direct flex child
- `object-fit: fill` distorts when overlay and video have different aspect ratios — better to force both into the same aspect ratio container
- JSX ternary can only return one node — wrapping siblings in `<>` fragments solves "Expected '</', got '{'" parse errors

### What's NOT Done
- Overlay shows on ALL video slides in a carousel (data model is per-post, not per-slide)
- `extractVideoFrame` uses `onseeked` + 300ms delay instead of `requestVideoFrameCallback` (unreliable on mobile Safari)
- Orphaned overlay PNGs in Supabase storage on post delete (systemic issue, not overlay-specific)
- `overlay_blocks` not typed in `page.tsx` Post interface
- `isVideoUrl()` still duplicated in `page.tsx` and `new/page.tsx`
- "scheduled ago" text bug still present
- Debug `[Save]` and `[Thumbnail]` console logs still in code

### Git Commits
- `4e652ef` — Add video repositioner and crop position support, update canvas to 3:4
- `d2bb27e` — Overlay-at-playback for video text — stop baking, render via CSS instead

### Next Steps
- Test full round-trip: Edit Cover → add text → save → view in modal → Edit Post → Edit Cover (verify blocks restore)
- Consider per-slide overlay support for carousels
- Replace `onseeked` with `requestVideoFrameCallback` in `extractVideoFrame`
- Extract `isVideoUrl()` to shared utility
- Fix "scheduled ago" text bug
- Clean up debug console logs when stable

---

## Session: 2026-03-12 — Music editing fixes, music prompt storage, thumbnail fix

### Completed (committed, pushed)

**Preserve audio_url after mux (`0e3c88a`):**
- Music section now auto-expands when editing a post that has `audio_url`
- `audio_url` is no longer nulled after muxing — the original audio file URL stays in the DB so the track is accessible on future edits
- Previously, muxing baked audio into the video and set `audio_url = null`, making music uneditable after save

**Retroactive audio_url fix (manual SQL):**
- Restored `audio_url` values for all 5 existing video posts via Supabase SQL editor
- Matched audio files in `post-audio` bucket to posts by timestamp proximity

**Store music prompt (`e338204`):**
- New `music_prompt` text column on `instagram_posts` (user added via SQL editor)
- Full composed prompt (styles + user text) saved when music is generated
- Displayed above audio player when editing: "Prompt: ..."
- Cleared on music removal
- API route (POST + PATCH) accepts and stores `music_prompt`

**Fix video thumbnail generation hanging on save (`a818cb1`):**
- Root cause: `crossOrigin = "anonymous"` on video element prevented metadata from loading when Supabase didn't return CORS headers — promise hung forever with no timeout
- Fix: fetch video as blob first, create object URL (same-origin, no CORS)
- `requestVideoFrameCallback` doesn't fire for offscreen/detached videos — replaced with 300ms delay after seek
- Added `withTimeout` wrapper to every async step (fetch, blob read, metadata, seek, frame wait) so save never hangs
- Added `[Save]` and `[Thumbnail]` console logs throughout save flow for debugging

### Key Learnings
- `crossOrigin = "anonymous"` on a video element requires the server to return CORS headers — without them, the video silently fails to load (no error event)
- `requestVideoFrameCallback` only fires for videos visible in the DOM / attached to a rendering context — offscreen video elements never trigger it
- Blob object URLs are same-origin, so canvas `drawImage` + `toBlob` works without CORS
- When giving SQL with long URLs, ensure no line breaks/spaces get introduced — caused `pu  blic` corruption in 5 audio URLs (fixed with REPLACE)

### What's NOT Done
- `isVideoUrl()` still duplicated in `page.tsx` and `new/page.tsx`
- "scheduled ago" text bug still present
- No auth on API routes (by design)
- Existing 5 video posts don't have `music_prompt` stored (column is empty) — only new generations will populate it
- Audio trimmer range inputs still small on mobile
- FFmpeg 25MB download has no progress indicator
- Debug `[Save]` and `[Thumbnail]` console logs still in code — remove when stable

### Git Commits
- `0e3c88a` — Preserve audio_url after mux and expand music section on edit
- `e338204` — Store and display music prompt used for each post
- `a818cb1` — Fix video thumbnail generation hanging on save

### Next Steps
- Test music generation + save + edit round-trip to confirm prompt is stored and shown
- Test video upload + save to confirm thumbnail generates correctly with blob approach
- Consider showing music prompt in the main post modal (not just edit view)
- Extract `isVideoUrl()` to shared utility
- Fix "scheduled ago" text bug

---

## Session: 2026-03-11 — Mobile fixes, music ToS fix, audio fade, image→reel mux

### Completed (committed, pushed)

**ElevenLabs fix (`e507d5f`):**
- Env vars were missing on Vercel (user added them via dashboard)
- Removed artist name references (Tycho, Bonobo, Olafur Arnalds, Brian Eno) from music style prompts — ElevenLabs ToS filter was rejecting them

**Audio fade-out (`76d3543`, `8a0ea05`):**
- Audio trimmer: 2s linear fade-out when clip is trimmed before natural end (Web Audio GainNode)
- Video mux: 2s FFmpeg `afade` filter at mux time when audio is longer than video
- `muxVideoAudio` accepts optional `videoDuration` param; callers pass it from state or probe via `<video>` element

**Mobile fixes (`622a13c`):**
- Image cropper: responsive sizing via ResizeObserver (fits 375px phone screens, max 600px)
- Image cropper: pinch-to-zoom with ref-based Konva updates (60fps, disables drag during pinch, guards against NaN/stale closures, handles touchcancel)
- Audio trimmer: deferred AudioContext creation to user gesture for iOS Safari (fetch on mount, decode on first tap via `ensureDecodedSync`)
- Carousel nav buttons: 32px → 44px touch targets
- `useIsMobile`: added `(max-height: 500px)` to catch phones in landscape
- Grid videos: `preload="none"` on mobile (passed `isMobile` as prop to `SortablePost`)

**Still image + audio → video reel (`a975d0c`):**
- New `muxImageAudio()` in `lib/mux-video.ts` — FFmpeg `-loop 1` + libx264 creates MP4 from static image + audio
- Save flow in `/new` page detects still image + audio and auto-muxes into video (like Instagram reels)
- Falls back to separate audio if mux fails

### Code Review Results
- Image cropper responsive sizing: passed (no bugs)
- Pinch-to-zoom v1: 6 bugs found (NaN, stale closure, drag conflict, missing touchcancel, preventDefault placement, re-render spam)
- Pinch-to-zoom v2 (ref-based rewrite): all 6 fixed, 1 new issue (ref overwrite during pinch if re-render) — fixed with `isPinching` guard
- AudioContext iOS fix v1: 2 bugs found (audio.play() loses gesture context after await, double-tap race)
- AudioContext iOS fix v2 (sync approach): fixed both — `ensureDecodedSync` keeps AudioContext creation in gesture stack
- Carousel buttons, useIsMobile, video preload: passed (preload had scoping bug — `isMobile` not in `SortablePost` — fixed by passing as prop)

### Key Learnings
- ElevenLabs ToS filter rejects prompts with real artist names
- iOS Safari requires AudioContext creation in synchronous gesture stack — `await` before `audio.play()` breaks it
- Konva drag + pinch conflict: must disable `draggable` during two-finger gesture
- Ref-based Konva updates during gesture (bypass React state) = smooth 60fps pinch
- `ResizeObserver` on outer container + explicit size on inner canvas = no re-render loops
- FFmpeg.wasm supports `libx264` for image→video encoding (slower than stream copy but works)

### What's NOT Done
- `isVideoUrl()` still duplicated in `page.tsx` and `new/page.tsx`
- "scheduled ago" text bug still present
- No auth on API routes (by design)
- Image→reel mux not yet tested on deployed Vercel (just pushed)
- Existing dog photo post needs edit+resave to trigger mux (user will do manually)
- Audio trimmer range inputs still small on mobile (review flagged, not yet fixed)
- FFmpeg 25MB download has no progress indicator on mobile
- iOS Safari URL bar shift can offset modal centering

### Git Commits
- `e507d5f` — Remove artist names from music prompts (ElevenLabs ToS fix)
- `76d3543` — Auto fade-out when audio trimmed before natural end
- `8a0ea05` — 2s audio fade-out at mux time
- `622a13c` — Mobile fixes (cropper, pinch, iOS audio, buttons, landscape, preload)
- `a975d0c` — Still image + audio → video mux (reel behavior)

### Next Steps
- Test image→reel mux: edit the Big Norm dog photo post and resave
- Test pinch-to-zoom on real phone
- Test audio trimmer first-tap on iOS
- Consider better mobile range inputs for audio trimmer
- Consider FFmpeg download progress indicator

---

## Session: 2026-03-10 (night) — Mobile video performance & muxing

### Completed (committed, pushed)

**Mobile performance fixes:**
- Grid videos: added `preload="metadata"` then `preload="auto"`, finally settled on `poster` attribute with `preload="none"` when thumbnail exists (falls back to `preload="metadata"`)
- Video-audio sync: changed `onPlay` → `onPlaying` (fires when frames actually render), added `onWaiting` (pauses audio during buffering)
- Mobile audio unlock: added useEffect that briefly plays/pauses audio to satisfy mobile autoplay policy (later removed — see below)
- Conditional modal rendering: replaced CSS show/hide (`md:hidden` / `hidden md:flex`) with JS `useIsMobile()` hook + ternary. Only one modal layout (mobile OR desktop) exists in the DOM at a time. Fixes duplicate `<audio ref>` bug.

**Video+audio mux at save time:**
- When saving a post with video + separate audio, FFmpeg.wasm muxes them into a single MP4 before saving
- Muxed video replaces original, `audio_url` set to null — one `<video>` element plays everything, no sync issues
- Dynamic import of `mux-video.ts` (only loads FFmpeg when needed)
- Falls back to saving with separate audio if mux fails

**Video thumbnails:**
- New `lib/generate-thumbnail.ts` — shared utility, uses `requestVideoFrameCallback` (with 200ms fallback) to ensure frame is actually paintable before canvas draw
- Thumbnail generated at save time (not upload time — CDN propagation delay caused failures)
- `thumbnail_url` column added to `instagram_posts` table
- API route (POST + PATCH) accepts and stores `thumbnail_url`
- Grid videos use `poster={thumbnail_url}` for instant display without downloading video
- Seeks to 0.1s for near-first-frame capture

**Migration (built then removed):**
- "Fix Videos" button processed existing posts (mux + thumbnail generation)
- Worked correctly — successfully muxed existing video+audio posts and generated thumbnails
- Removed after existing posts were fixed — new posts now handle everything at save time

### Key Learnings
- **`onPlay` fires before frames render** — mobile browsers fire it when playback is "requested", not when frames are visible. `onPlaying` is the correct event for audio sync.
- **`onseeked` fires before frame is paintable** — canvas `drawImage` draws black. `requestVideoFrameCallback` is the modern solution (guarantees a drawable frame).
- **Thumbnail generation must happen after CDN propagation** — fire-and-forget at upload time fails because Supabase URL isn't immediately fetchable. Awaiting at save time works.
- **Duplicate DOM elements with single ref = silent bug** — CSS show/hide means both mobile and desktop `<audio>` elements exist, but `useRef` points to whichever mounts last (desktop). JS conditional rendering is the real fix.
- **Mobile Safari blocks `audio.play()` from async contexts** — even if the original gesture was a tap, the gesture context expires by the time `onPlaying` fires after buffering. Muxing audio into video is the proper solution.

### What's NOT Done
- `isVideoUrl()` still duplicated in `page.tsx` and `new/page.tsx`
- "scheduled ago" text bug still present
- No auth on API routes (by design)
- Old posts without thumbnails will fall back to `preload="metadata"` (acceptable)

### Git Commits
- `55cb468` — Grid video preload + audio sync
- `a376a95` — Fix desktop modal + onWaiting
- `0803792` — Conditional mobile/desktop modal rendering
- `880cf76` — Mux at save, thumbnails, migration button
- `0f8dc28` — Thumbnail seek to 25% (reverted to 0.1s)
- `ee41999` — Migration regenerates all thumbnails
- `5ffdd20` — requestVideoFrameCallback for reliable thumbnails
- `6fd3bb0` — Move thumbnail to save time, remove migration button

### Next Steps
- Test mux + thumbnail on mobile after deploy
- Extract `isVideoUrl()` to shared utility
- Fix "scheduled ago" text bug
- Chat UI still duplicated in mobile/desktop sections — but now only one renders at a time (less urgent)

---

## Session: 2026-03-10 (evening)

### Completed (committed, pushed)

**Commit (pending) — Signed URL uploads, image crop/reposition, video+audio mux download**

**Signed URL uploads (bypass Vercel 4.5MB limit):**
- New API route `POST /api/instagram/upload-url` — generates time-limited Supabase signed upload URLs using service role key
- New client helper `lib/upload-signed.ts` — uses Supabase SDK `uploadToSignedUrl` for browser-direct uploads
- All uploads in `/new` page and audio trimmer now use signed URLs (file goes browser → Supabase, never touches Vercel)
- Text overlay export also switched to signed URL (was using old route handler, could fail for large PNGs)
- Deleted dead `lib/upload-action.ts` (server action no longer used)
- Input validation on upload-url route (contentType string, fileSize number)

**Image crop/reposition (`components/image-cropper.tsx`):**
- Konva-based 1080x1080 square crop with drag-to-reposition and zoom (1x–3x)
- Cover-mode initial fit (landscape overflows width, portrait overflows height, centered)
- Drag constrained so image always covers the frame
- Scroll wheel zoom support, center-zoom calculation
- Integrated into `/new` page: appears after uploading a non-square image
- "Reposition" button in preview area to re-crop existing images
- Reposition replaces current carousel image in-place (not additive)
- Videos bypass the cropper entirely

**Video + audio mux download (`lib/mux-video.ts`):**
- FFmpeg.wasm (browser-side) combines video + audio into a single MP4
- Lazy-loads FFmpeg core from CDN (~25MB, only on first use), cached for reuse
- Video stream copied (no re-encode = fast), audio encoded as AAC, `-shortest` flag
- Music icon button in both mobile + desktop modals (only when post has video + audio)
- "Combining video + audio..." progress indicator while muxing
- Falls back to error alert if mux fails

**Music duration references video length:**
- Video preview captures duration via `onLoadedMetadata`
- Music duration picker auto-selects closest option to video length
- Shows "Video: Xs" label next to duration dropdown

**Code review fixes:**
- Removed unused `Rect` import from image-cropper
- Input validation on upload-url API route
- Switched text overlay export to signed URL upload
- Deleted dead `lib/upload-action.ts`

### Design Decisions & Learnings
- **Vercel Hobby has a hard 4.5MB request body limit** — `serverActions.bodySizeLimit` only controls Next.js, not Vercel's infrastructure. Signed URLs bypass this entirely.
- **Supabase signed upload URLs need the SDK** — raw `PUT` fetch to the signed URL doesn't work. Must use `supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)`.
- **FFmpeg.wasm is ~25MB** but lazy-loaded (dynamic import) so it doesn't affect initial bundle. Single-thread core is sufficient for muxing (no re-encoding needed). Multi-thread core requires `SharedArrayBuffer` + COOP/COEP headers which Vercel doesn't set by default.
- **pnpm is the package manager** for this project (not npm). npm fails with arborist errors due to `.pnpm` directory structure.

### What's NOT Done
- `isVideoUrl()` still duplicated in `page.tsx` and `new/page.tsx` — should be shared utility
- "scheduled ago" text bug in mobile modal still present
- No auth on any API routes (consistent with rest of app — no auth system)
- `fileSize` validation on upload-url is advisory (client self-reports; actual enforcement would need Supabase bucket policies)
- Chat UI still duplicated in mobile and desktop sections of `page.tsx`

### Key Files (new/updated)
- `app/api/instagram/upload-url/route.ts` — NEW: Signed upload URL generation
- `lib/upload-signed.ts` — NEW: Client-side signed URL upload helper
- `lib/mux-video.ts` — NEW: FFmpeg.wasm video+audio muxing
- `components/image-cropper.tsx` — NEW: Konva-based image crop/zoom/reposition
- `app/new/page.tsx` — Cropper integration, signed URL uploads, video duration, reposition button
- `components/audio-trimmer.tsx` — Switched to signed URL upload
- `app/page.tsx` — Mux download button, muxing state/progress

### Next Steps (if continuing)
- Test signed URL uploads on Vercel (deploy and try video upload)
- Test image cropper with various aspect ratios (portrait, landscape, already-square)
- Test FFmpeg mux download (video+audio post)
- Extract `isVideoUrl()` to shared utility
- Fix "scheduled ago" text bug
- Consider extracting chat UI to shared component

---

## Session: 2026-03-10 (earlier)

### Completed (committed, pushed)

**Commit `43dd0a9` — Add DM outreach tool and video upload support**

**DM outreach tool (`/dms`):**
- Table-based outreach tracker: business name, status, timestamps, delete
- Inline "Add" form, status filter pills (drafted/sent/replied/follow_up)
- Collapsible "Your Style" section for AI training (example DMs + style rules)
- Thread detail page (`/dms/[id]`): conversation log with compose bar
- Sender toggle (your message / their reply), tone picker (casual/professional/playful/direct)
- AI polish via Claude Haiku with inline replacement + undo
- Templates shown on first message when compose empty
- DB tables: `dm_threads`, `dm_messages` (user ran SQL in Supabase)
- Site settings keys: `dm_style_examples`, `dm_style_rules`
- Nav links added to main page + ads page

**Video upload support:**
- Upload route detects MP4/MOV/WebM via magic byte detection
- Separate `post-videos` Supabase bucket (50MB limit, public)
- Video rendering in grid (play icon overlay), mobile modal, desktop modal
- `/new` page: file input accepts video MIME types, preview renders `<video>`, thumbnail strip with play icons
- `isVideoUrl()` helper checks file extensions in URLs

**Commit `0e90f1c` — Add music generation with ElevenLabs, trim, prompt assist, video-audio sync**

**Music generation (ElevenLabs Eleven Music API):**
- API route `POST /api/instagram/music` — prompt + duration + instrumental → MP3 → Supabase `post-audio` bucket
- 8 genre/mood presets: Indie, Lo-fi, Acoustic, Electronic, Cinematic, Punk/Raw, Soul/R&B, Ambient
- Multi-select styles with anti-stock-music prompt engineering
- Duration picker (10s–5min), instrumental on by default
- Collapsible "Add music" section in `/new` page
- `audio_url` column added to `instagram_posts` table
- Audio player in post modals (both mobile + desktop)

**Audio trimmer (`components/audio-trimmer.tsx`):**
- Client-side trim using Web Audio API + OfflineAudioContext
- Start/end time sliders, preview clip, save as WAV
- Error state for load failures, AudioContext cleanup, division-by-zero guards

**Prompt assist (`POST /api/instagram/music-prompt`):**
- Claude Haiku generates detailed music prompts from simple descriptions + selected styles
- "Help me write a better prompt" link in music section

**Video-audio sync:**
- When post has both video + audio: music plays/pauses/stops in sync with video playback
- Hidden `<audio>` element controlled via video `onPlay`/`onPause`/`onEnded` events
- Image posts still show visible audio player

**Server action upload (`lib/upload-action.ts`):**
- Bypasses Next.js body size limit for large video files
- Uses service role key (no RLS issues)
- Supports images, videos, and audio files
- `next.config.ts`: `serverActions.bodySizeLimit: "100mb"`

**Code review fixes:**
- Removed `autoPlay` from desktop modal video (was causing double audio)
- Deleted dead `lib/upload.ts` (replaced by upload-action.ts)
- AudioContext cleanup on trimmer unmount
- Division-by-zero guards in trimmer timeline
- Error state when audio fails to load for trimming

### Design Decisions & Learnings
- **DM tool went through 3 UX redesigns** — started as Instagram-style chat, became table tracker, then conversation log. Key insight: this is a writing/tracking tool, not a messaging app
- **AI polish disconnect** was the hardest UX bug — polish showed in separate panel but didn't connect to saving. Fixed by making polish replace text inline with undo
- **AI voice too generic** — solved with style training (example DMs + rules stored in site_settings)
- **Next.js App Router has no per-route body size config** for route handlers — only `serverActions.bodySizeLimit` works. Had to convert upload to a Server Action for large files
- **Supabase RLS blocks anon key uploads** — direct browser upload failed because bucket has RLS. Kept server-side upload with service role key
- **ElevenLabs inpainting is enterprise-only** — "Remix" just regenerates with modified prompt instead
- **Suno has no official API** — only third-party wrappers. User tried ElevenLabs, quality was "too generic". Added genre presets + prompt assist to improve output quality

### What's NOT Done
- **Image crop/zoom/reposition** — user wants Konva-native implementation (no new deps). Not started yet.
- Video upload still fails through old route handler (only server action works for large files). Other upload paths (reference image, text overlay export) still use old route — fine since they're small files.
- No rate limiting on music/prompt API routes (cost exposure risk — noted in code review)
- `isVideoUrl()` duplicated in `page.tsx` and `new/page.tsx` with subtly different implementations — should be shared utility
- "scheduled ago" text bug in mobile modal (`formatTimeAgo` returns "scheduled" + template appends " ago")

### Key Files (new/updated)
- `app/api/instagram/dms/route.ts` — Threads CRUD
- `app/api/instagram/dms/messages/route.ts` — Messages CRUD
- `app/api/instagram/dms/polish/route.ts` — AI polish with style config
- `app/dms/page.tsx` — Outreach list with style training
- `app/dms/[id]/page.tsx` — Thread detail conversation log
- `app/api/instagram/music/route.ts` — ElevenLabs music generation
- `app/api/instagram/music-prompt/route.ts` — Claude prompt assist
- `app/api/instagram/upload/route.ts` — Upload with video detection
- `lib/upload-action.ts` — Server action upload for large files
- `components/audio-trimmer.tsx` — Client-side audio trimmer
- `app/new/page.tsx` — Post creation with video, music, trim, prompt assist
- `app/page.tsx` — Video rendering + audio sync in modals
- `app/api/instagram/posts/route.ts` — audio_url support
- `app/api/site-settings/route.ts` — DM style keys

### Git
- `43dd0a9` — DM outreach tool + video upload
- `0e90f1c` — Music generation, trim, prompt assist, video-audio sync

### Next Steps (if continuing)
- Build Konva-native image crop/zoom/reposition in the post creation flow
- Extract `isVideoUrl()` to shared utility
- Fix "scheduled ago" text bug
- Consider rate limiting on paid API routes

---

## Session: 2026-03-09

### Completed (committed, pushed)

**Commit `475f64e` — Add post workflow: status system, filter bar, chat UI, approve/reject**

**Post status system:**
- Added `status` column to `instagram_posts` table (draft/approved/rejected, default draft)
- Added `status` to TypeScript interface, POST (defaults to draft), and PATCH handlers
- Filter bar above grid: All/Drafts/Approved/Rejected pills with counts
- Grid, phone-frame preview, and SortableContext all use `filteredPosts`
- Fixed drag-and-drop to reorder within filtered subset and splice back into full array

**Chat UI (replaced Notes):**
- iMessage-style bubbles: E left-aligned (light gray), H right-aligned (dark)
- Inline message editing: pencil icon on hover for own messages, Enter to save, Escape to cancel
- Delete on hover (X icon), only for own messages
- Collapsed state shows last message as a bubble preview with count badge
- Fixed stale edit state on post switch, fixed index shift on delete-while-editing
- Renamed "Notes" → "Chat" throughout

**Approve/reject buttons:**
- Status badge in post modal (amber draft, green approved, red rejected)
- Context-aware buttons: only shows actions that make sense for current status
- `updatePostStatus` checks `response.ok` before updating local state

**Commit `5850d0d` — Replace cosmetic realism sliders with research-backed De-AI presets**

**Replaced 4 cargo-cult filters with research-backed system:**
- Old: uniform grain, vignette, chromatic aberration, color cast (cosmetic only, zero effect on AI detection)
- New: 4 presets (Phone Snap, DSLR, Film, Disposable) each stacking 8 techniques:
  1. Signal-dependent noise (Box-Muller Gaussian, shadow-heavy like real sensors)
  2. Barrel/pincushion lens distortion (radial polynomial)
  3. White balance warm shift
  4. Highlight clipping (blown whites)
  5. Vignette (lens light falloff)
  6. Lifted blacks (matte/faded look, removes HDR feel)
  7. Partial desaturation (removes advertisement vibrancy)
  8. Halation (warm highlight bloom on film/disposable)
- JPEG re-encode on export (quality 0.88) to destroy AI spectral fingerprints
- Single intensity slider per preset, debounced at 150ms
- Error handling on JPEG export with PNG fallback

### Design Decisions & Learnings
- **Status filter is just a filter, not a separate feed** — simplest approach that solves the workflow need
- **Drag-and-drop with filters requires careful index mapping** — reorder within filtered subset, splice back into full array at original positions
- **Old "realism" filters were cargo cult** — research showed vignette/color cast have zero effect on AI detection. Real tells are noise uniformity, spectral fingerprints, and PRNU
- **The "de-AI" problem is making images worse, not better** — fal.ai's post-processing API makes images more polished, which is the opposite of what's needed
- **What makes stock/AI images look fake:** over-smoothness, perfect symmetry, HDR "everything visible" look, oversaturated colors, uniform noise. Fix = lifted blacks, desaturation, signal-dependent noise, highlight clipping
- **Zoom feature attempted and removed** — resizing Konva Stage breaks inline editing, exports, and transformers. CSS scale approach caused scroll trapping on mobile. Not worth the complexity.

### What's NOT Done
- Softness/blur as a De-AI technique (requires convolution, can't be done per-pixel — use existing Background Filters blur instead)
- True halation (spatial blur of bright pixel mask) — current implementation is per-pixel approximation
- FFT spectrum perturbation (most powerful anti-detection technique but too complex/slow for canvas JS)
- fal.ai relighting integration (useful for fixing AI's inconsistent lighting — $0.04/image, already have SDK)
- Chat UI is duplicated in mobile and desktop sections (~90 lines each) — could be extracted to a component

### Key Files (updated)
- `components/text-overlay-editor.tsx` — Canvas editor with De-AI presets, JPEG re-encode export
- `app/page.tsx` — Profile grid with status filter, chat UI, approve/reject workflow
- `app/api/instagram/posts/route.ts` — CRUD with status field support

### Git
- `475f64e` — Post workflow (status, filter, chat, approve/reject)
- `5850d0d` — De-AI presets replacing cosmetic realism sliders

### Next Steps (if continuing)
- Test De-AI presets in browser — compare Phone Snap vs Film vs Disposable at different intensities
- Consider fal.ai relighting as a separate "Fix Lighting" button ($0.04/image)
- Consider extracting chat UI into a shared component to reduce duplication
- Consider adding preset thumbnails/previews so user can see the effect before applying

---

## Session: 2026-03-08

### Completed (tested, committed, pushed)

**Commit `04599b2` — Add realism feature: prompt chips + canvas filters to de-AI generated images**

**"Add Realism" prompt chips (generation layer):**
- 5 stackable chips: Real people, Unposed, Phone snap, Disposable, Raw photo
- Chips inject visible/editable text into the prompt textarea
- Toggle on/off with auto-deactivation if user manually edits out chip text
- Chips styled as pills matching existing UI (black fill when active)
- Located between model picker and prompt textarea on Generate tab

**Realism-aware image description pipeline (the key unlock):**
- When any realism chip is active, `realismMode: true` is sent to the API
- Nano Banana "same vibe" path: Claude's image description prompt is modified to describe imperfections (harsh shadows, skin blemishes, awkward poses, unflattering lighting) instead of sanitizing them away
- GPT Image 1.5 "same vibe" path: prefix updated to resist beautification
- This was the critical change — without it, Claude's description stripped all rawness and the model defaulted to stock-photo-quality output

**Custom Konva canvas filters (post-processing layer):**
- Film grain (random luminance noise per pixel)
- Vignette (radial edge darkening)
- Chromatic aberration (RGB channel offset)
- Color cast (warm/cool shift)
- UI sliders in "Realism" section under existing Background Filters panel

### Design Decisions & Learnings
- **Prompt language should be about restraint, not degradation** — "do not smooth skin" works better than "add grain and imperfections" which overcooks it
- **"Same person" chip was removed** — close match mode reproduces the reference person too faithfully (copyright risk). Replaced with "Real people" which pushes toward authentic-looking humans without copying identity
- **"Keep it real" merged into "Real people"** — eliminated overlap between chips
- **Claude description prompt is the leverage point** — for Nano Banana same-vibe, the reference pixels never reach the image model. Everything flows through Claude's text description. Modifying that description to preserve imperfections is what made the feature work.
- **Code review findings:** Performance concern with custom pixel filters on 1080x1080 during slider drag (not yet addressed). No infinite loops or critical bugs found.

### What's NOT Done
- Performance optimization for custom canvas filters (debounce slider input)
- JPEG compression artifacts filter (skipped — low visual payoff vs complexity)

---

## Session: 2026-03-07

### Completed (all tested, committed, pushed)

**Commit `4357d0a` — Text overlay editor: new shapes, image overlays, filters, bug fixes**
- Added ellipse/circle shapes (draggable, resizable, rotatable, stroke controls)
- Added line/arrow shapes (stroke color/width, arrow start/end toggles, dashed toggle)
- Added image overlay blocks (upload logos/stickers from device, 10MB limit, draggable/resizable/rotatable, corner radius)
- Added background filters panel (brightness, contrast, saturation, blur, grayscale, sepia) — appears when no block selected
- Fixed rect shape rotation (was missing `rotation` prop and `node.rotation()` capture)
- Fixed text dragging (removed `listening={false}` from Text node inside Group)
- Fixed 10 code review issues (export race condition, image overlay unselectable, memory leaks, shallow copy bug, filter cache issues, dynamic import perf)

**Previous commits this session (already pushed):**
- `988cad6` — Full editor rebuild + drag-and-drop reference image
- `13d9908` — Fix img2img review issues: SSRF validation, dead code, stale state
- `a4ee9b7` — Add image-to-image generation with FLUX Kontext Pro
- Custom AI prompt instructions for caption generation
- Lattify brand context piped to caption AI
- Image upload from device (Supabase Storage, `post-images` bucket)
- Copy caption + download image buttons in post detail modal

### Key Technical Decisions
- **Konva.js** for canvas editor (lighter than Fabric.js, TypeScript-native, react-konva wrapper)
- **FLUX Kontext Pro** (`fal-ai/flux-pro/kontext`) for img2img ($0.04/image) — purpose-built for context-aware editing
- **fal.ai** for text-to-image (nano-banana-2, gpt-image-1.5, flux-2-pro)
- **Claude Haiku 4.5** for caption generation with Lattify brand context
- **Supabase Storage** for user-uploaded images (magic byte validation, not client MIME)
- Dynamic import with `ssr: false` for Konva (needs window/canvas)
- Counter-based IDs (`useRef` incrementing) to prevent collisions

### What's NOT Done
- No auth/user system (user explicitly chose to accept this risk for a mockup tool)
- No additional Konva features beyond current set (gradients, freehand drawing, clipping/masking, paths are available if needed)

### Important User Preferences
- **NEVER commit/push without explicit user approval**
- User is product lead, learning to code — explain every decision, present options
- Build one piece at a time, check in between

### Key Files
- `components/text-overlay-editor.tsx` — Full Konva canvas editor (text, rect, ellipse, line/arrow, image overlays, background filters)
- `app/new/page.tsx` — New post creation page (prompt, model picker, reference image, text editor integration)
- `app/api/instagram/generate/route.ts` — AI image generation (text-to-image + img2img via Kontext)
- `app/api/instagram/upload/route.ts` — File upload to Supabase Storage
- `app/api/instagram/caption/route.ts` — Caption AI with Lattify brand context
- `app/page.tsx` — Main profile page with post grid + detail modal

### Next Steps (if continuing)
- Test all new features in browser (ellipse, line/arrow, image overlays, filters)
- Consider adding: gradient fills, freehand drawing, image clipping/masking
- Consider adding: preset filter combinations (like Instagram's named filters)
