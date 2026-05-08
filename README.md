# Passport Web

## Current purpose

- public-facing Passport landing page at `/`
- founder referral flow at `/refer`
- candidate landing page at `/candidate`
- candidate claim page at `/candidate/claim`
- candidate profile flow at `/candidate/profile`

## Current usage

- the site is currently focused on collecting founder-submitted warm referrals
- founders submit referrals, Passport emails candidates secure claim links, and candidates complete their profiles through the candidate portal

## Paused hidden workspaces

- the repo still contains preserved hidden route files for:
  - `/portal/*`
  - `/talent/*`
- these were built for private admin/employer review tools and a PeopleGPT-style talent workspace
- the product shifted away from those hidden surfaces for now, so they have been intentionally unregistered from `src/routeTree.gen.ts`
- the files were not deleted on purpose

## Future reuse

- if the product shifts back toward private admin, employer, or talent-search tooling, the preserved route files under `src/routes`, `src/components/portal`, and `src/components/talent` can be restored
- if you later prompt for functionality like admin portals, employer feeds, hidden workspaces, or PeopleGPT-style search, those paused files are the starting point

## Implementation note

- the hidden pages are disabled by route-tree registration, not deletion
- comments were added to the paused route files to explain why they are inactive
