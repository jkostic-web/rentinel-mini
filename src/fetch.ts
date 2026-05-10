const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": BROWSER_USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed fetching ${url} (status ${response.status}).`);
  }

  return await response.text();
}
