import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse4zida } from "../src/providers/4zida.ts";
import { parseHalooglasi } from "../src/providers/halooglasi.ts";
import type { Listing } from "../src/types.ts";

/**
 * The fixtures are five-card excerpts of a real search page: enough markup to exercise
 * every selector, little enough third-party HTML for a public repo. Ad copy is redacted;
 * prices, dates and locations are not, since those are what the parser is tested on.
 */
export function readFixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

/**
 * Invariants hold for every card, so a markup change is caught even after a fixture
 * refresh. Exact values are asserted on the first card only, to keep refreshes cheap.
 */
export function assertListingInvariants(
  listings: Listing[],
  listingPathPattern: RegExp,
  expectedCount: number,
): void {
  assert.equal(
    listings.length,
    expectedCount,
    `expected ${expectedCount} listings, got ${listings.length}`,
  );

  for (const listing of listings) {
    assert.ok(listing.name.length > 0, "listing name must not be empty");

    const url = new URL(listing.url);
    assert.match(url.protocol, /^https?:$/);
    assert.match(url.pathname, listingPathPattern);
    assert.equal(url.search, "", `${listing.url} must not carry a query`);
    assert.equal(url.hash, "", `${listing.url} must not carry a hash`);
  }
}

test("halooglasi: every parsed card is a usable listing", () => {
  const listings = parseHalooglasi(readFixture("halooglasi.html"));
  assertListingInvariants(listings, /^\/nekretnine\/.+\/\d+$/, 5);
});

test("halooglasi: maps every field of the first card", () => {
  const [first] = parseHalooglasi(readFixture("halooglasi.html"));
  assert.ok(first);

  assert.equal(first.name, "Jednoiposoban stan izdavanje Vracar");
  assert.equal(
    first.location,
    "Beograd, Opština Voždovac, Lekino brdo, Gospodara Vučića",
  );
  assert.equal(first.price.raw, "400 €");
  assert.equal(first.price.value, 400);
  assert.equal(first.price.currency, "EUR");
  assert.equal(first.datePosted, "2026-08-21");
  assert.equal(
    first.url,
    "https://www.halooglasi.com/nekretnine/izdavanje-stanova/jednoiposoban-stan-izdavanje-vracar/5425642257182",
  );
});

test("4zida: every parsed card is a usable listing", () => {
  const listings = parse4zida(readFixture("4zida.html"));
  assertListingInvariants(
    listings,
    /^\/(?:izdavanje|prodaja)-stanova\/.+\/[a-f0-9]{24}$/,
    5,
  );

  for (const listing of listings) {
    assert.ok(listing.location, `${listing.url} lost its location`);
    assert.ok(listing.datePosted, `${listing.url} lost its date`);
    assert.ok(listing.features.length > 0, `${listing.url} lost its features`);
  }
});

test("4zida: maps every field of the first card", () => {
  const [first] = parse4zida(readFixture("4zida.html"));
  assert.ok(first);

  assert.equal(first.name, "Centar");
  assert.equal(first.location, "Voždovac opština, Beograd");
  assert.equal(first.price.raw, "350 €");
  assert.equal(first.price.value, 350);
  assert.equal(first.price.currency, "EUR");
  assert.equal(first.datePosted, "2026-08-21");
  assert.deepEqual(first.features, [
    "1 soba",
    "Namešteno",
    "Na gas",
    "Useljivo",
    "Vlasnik",
  ]);
  assert.equal(
    first.url,
    "https://www.4zida.rs/izdavanje-stanova/centar-vozdovac-opstina-beograd/jednosoban-stan/6a8862176edda5403f0db5b4",
  );
});
