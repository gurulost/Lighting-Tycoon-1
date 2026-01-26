# Release Checklist

## Build & Verification
- [ ] `npm run check:types`
- [ ] `npm run lint`
- [ ] App launches on iOS, Android, and Web

## Gameplay Regression
- [ ] Tutorial completion
- [ ] First-session track
- [ ] Dependency thresholds
- [ ] Lockout event (Baron and Lab paths)
- [ ] Order highlight + ghost slots
- [ ] Backpack + recycle
- [ ] Order spawn pressure gating

## Assets & Performance
- [ ] Asset preloading/caching works (no hitch on first use)
- [ ] Memory stable with Story Log (cap enforced)
- [ ] 60fps target on mid-tier device

## Save / Load
- [ ] Debounced save works (no spam)
- [ ] Critical flush on key actions
- [ ] Resume from background
- [ ] Save migration safe (versioned payload)
- [ ] Lockout recovery on load

## UX / UI
- [ ] Modal visual system consistent
- [ ] Order card readability
- [ ] Colorblind indicators for Open vs Locked
- [ ] Touch targets >= 44px

## Device Coverage
- [ ] Small phone (SE)
- [ ] Standard phone
- [ ] Large phone
- [ ] Tablet

## Shipping
- [ ] Version bump
- [ ] Changelog updated
- [ ] Store assets updated

