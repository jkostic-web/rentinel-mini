export type ProviderId = "4zida" | "halooglasi";

export type ListingPrice = {
  value: number | null;
  currency: string | null;
  raw: string | null;
};

export type Listing = {
  name: string;
  /** The SCRAPE_URLS key the listing came from; attached by the runner. */
  queryName?: string;
  location: string | null;
  features: string[];
  price: ListingPrice;
  /** ISO yyyy-mm-dd. */
  datePosted: string | null;
  /** Absolute, hash and query stripped. This is the dedupe key. */
  url: string;
};

export type Provider = {
  id: ProviderId;
  matches: (url: URL) => boolean;
  fetchPage: (url: string) => Promise<string>;
  parse: (html: string) => Listing[];
};

export type State = {
  seenUrls: string[];
  seededTargets: string[];
};

export type Target = {
  queryName: string;
  url: string;
};

export type Config = {
  targets: Target[];
  telegramToken: string;
  telegramChatIds: string[];
  scrapeIntervalMs: number;
  stateFilePath: string;
};
