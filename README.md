# DBW WISCO

The customer reorder site for DBW WISCO, a division of Diamond Blade Warehouse, LLC. Served at https://dbwwisco.com

This project holds the store and nothing else. It is public because the free website needs it to be.

## Never commit

- Price lists or anything with cost in it. The catalog is built with `--private`, so `catalog.js` holds no prices.
- Customer lists, card numbers, payroll, sales numbers.

## Rebuild

See `tools/README.md`. The pricing multipliers are passed on the command line and are not written in this project.

## Test

    node tools/test_site.js
