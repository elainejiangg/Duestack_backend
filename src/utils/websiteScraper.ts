import { load } from "npm:cheerio";

const MAX_CONTENT_LENGTH = 20000;

export interface ScrapedWebsiteContent {
  url: string;
  title?: string;
  cleanText: string;
}

/**
 * Fetches and scrapes a website, returning cleaned text content suitable for LLM prompts.
 * Removes scripts/styles, captures headings and bullet points, and truncates to avoid
 * excessively large prompts.
 */
export async function scrapeWebsiteContent(
  url: string
): Promise<ScrapedWebsiteContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "DuestackBot/1.0 (+https://github.com/duestack)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch website (${response.status} ${response.statusText})`
    );
  }

  const html = await response.text();
  const $ = load(html);

  // Remove elements that shouldn't be part of the extracted text
  $("script, style, noscript, svg, iframe, header, footer").remove();

  const title = $("title").first().text().trim() || undefined;

  const sections: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const heading = $(el).text().replace(/\s+/g, " ").trim();
    if (!heading) return;

    const sectionText = $(el)
      .nextUntil("h1, h2, h3")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (sectionText) {
      sections.push(`${heading}: ${sectionText}`);
    } else {
      sections.push(heading);
    }
  });

  const bulletPoints = $("li")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean)
    .slice(0, 50);

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  const combinedParts = [
    title ? `Page Title: ${title}` : null,
    sections.length
      ? `Headings & Sections:\n${sections.slice(0, 20).join("\n")}`
      : null,
    bulletPoints.length
      ? `Bullet Points:\n${bulletPoints.map((b) => `- ${b}`).join("\n")}`
      : null,
    bodyText ? `Full Text:\n${bodyText}` : null,
  ].filter(Boolean);

  let cleanText = combinedParts.join("\n\n");
  if (cleanText.length > MAX_CONTENT_LENGTH) {
    cleanText = cleanText.slice(0, MAX_CONTENT_LENGTH);
  }

  return {
    url,
    title,
    cleanText,
  };
}
