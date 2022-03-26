import axios from "axios";
import {JSDOM} from "jsdom";

export const getOgp = async (
    url: string
): Promise<Record<string, string> | null> => {
  if (typeof url !== "string") return null;
  const encodedUri = encodeURI(url);
  const headers = {"User-Agent": "bot"};
  try {
    const res = await axios.get(encodedUri, {headers});
    const html = res.data;
    const dom = new JSDOM(html);
    const meta = dom.window.document.head.querySelectorAll("meta");
    const ogp = extractOgp([...meta]);
    return ogp;
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    return null;
  }
};

// HTMLのmetaタグからogpを抽出
const extractOgp = (
    metaElements: HTMLMetaElement[]
): Record<string, string> => {
  const ogp = metaElements
      .filter((element: Element) => element.hasAttribute("property"))
      .reduce((previous: any, current: Element) => {
        if (current.getAttribute("property")) {
          const property = (current.getAttribute("property") as any).trim();
          if (property) {
            const content = current.getAttribute("content");
            previous[property] = content;
            return previous;
          }
          return;
        }
      }, {});
  return ogp;
};
