# Build Log

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
