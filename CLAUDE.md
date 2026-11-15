# dbw-wisco: rules for any automation or agent working here

This project is public and is served as the DBW WISCO store at https://dbwwisco.com (GitHub Pages from `main`, repository root).

## Never commit

- Price lists, cost, or pricing multipliers. The catalog is built with `--private`; `catalog.js` holds no prices and must stay that way.
- Customer lists, card or bank numbers, payroll, commission or sales numbers.
- Reps' real names where a phone name is used on the site.

## Before every push

Run `node tools/test_site.js`. It must pass.

## Ownership

Page changes are agreed with the owner (Frank) first. Nothing goes to `main` without his say-so.
