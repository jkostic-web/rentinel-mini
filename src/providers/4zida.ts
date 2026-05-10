import { load } from "cheerio";
import { fetchHtml } from "../fetch.ts";
import type { Listing, Provider } from "../types.ts";
import {
  absoluteUrl,
  cleanText,
  inferCurrency,
  parseDate,
  parsePrice,
} from "./shared.ts";

const BASE_URL = "https://www.4zida.rs";
const HOSTS = new Set(["4zida.rs", "www.4zida.rs"]);
const LISTING_PATH_PATTERN =
  /\/(?:izdavanje|prodaja)-stanova\/.+\/[a-f0-9]{24}\/?$/i;

/** 4zida writes square metres as "mtk" in the card feature line. */
function normalizeFeatureText(value: string): string {
  return value.replace(/\bmtk\b/gi, "m²");
}

function isListingUrl(url: string): boolean {
  try {
    return LISTING_PATH_PATTERN.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function parse4zida(html: string): Listing[] {
  const $ = load(html);
  const listings: Listing[] = [];

  $("main [test-data='ad-search-card']").each((_, element) => {
    const card = $(element);

    const href = card
      .find("a[href]")
      .map((__, anchor) => $(anchor).attr("href") ?? "")
      .get()
      .find((value) => /\/(?:izdavanje|prodaja)-stanova\//i.test(value));

    const url = absoluteUrl(href, BASE_URL);
    if (!url || !isListingUrl(url)) {
      return;
    }

    const name =
      cleanText(
        card.find("p.truncate.font-medium.leading-tight").first().text(),
      ) ?? cleanText(card.find("img[alt]").first().attr("alt"));
    if (!name) {
      return;
    }

    const location =
      cleanText(
        card
          .find("p.line-clamp-2.text-sm.leading-tight.text-foreground\\/60")
          .first()
          .text(),
      ) ?? cleanText(card.find("p.text-foreground\\/60").first().text());

    const featureLine = cleanText(card.find("a.px-3.text-sm").first().text());
    const features = (featureLine?.split("|") ?? [])
      .map((part) => cleanText(part))
      .filter((part): part is string => Boolean(part))
      .map(normalizeFeatureText);

    const rawPrice = cleanText(card.find("p.bg-spotlight span").first().text());

    const dateText =
      cleanText(
        card
          .find("span.text-2xs.text-foreground\\/50")
          .filter((__, span) =>
            /Ažurirano|Azurirano|Objavljeno/i.test($(span).text()),
          )
          .first()
          .text(),
      ) ?? cleanText(card.text());

    listings.push({
      name,
      location,
      features,
      price: {
        value: parsePrice(rawPrice),
        currency: inferCurrency(rawPrice),
        raw: rawPrice,
      },
      datePosted: parseDate(dateText),
      url,
    });
  });

  return listings;
}

export const fourZida: Provider = {
  id: "4zida",
  matches: (url) => HOSTS.has(url.hostname.toLowerCase()),
  fetchPage: (url) => fetchHtml(url),
  parse: parse4zida,
};
