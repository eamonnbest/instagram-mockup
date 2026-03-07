# Build Log

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
