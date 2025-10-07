// api/index.js
import axios from "axios";
import { JSDOM } from "jsdom";
import qs from "qs";

export default async function handler(req, res) {
  // === CORS ===
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const link = req.query.link || "";
  const target = "https://musicaldown.com/id";
  const downloadEndpoint = "https://musicaldown.com/id/download";

  try {
    // Step 1: GET target
    const initResp = await axios.get(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NodeJS script)" },
      maxRedirects: 5,
    });

    // ambil cookie session_data
    const setCookie = initResp.headers["set-cookie"] || [];
    let sessionValue = null;
    for (let c of setCookie) {
      if (c.startsWith("session_data=")) {
        sessionValue = c.split(";")[0].split("=")[1];
      }
    }

    // parse input form
    const dom = new JSDOM(initResp.data);
    const inputs = [...dom.window.document.querySelectorAll("input")];
    let postFields = {};
    inputs.forEach((input, i) => {
      const name = input.getAttribute("name");
      const value = input.getAttribute("value") || "";
      if (!name) return;
      if (i === 0) postFields[name] = link;
      else postFields[name] = value;
    });

    // Step 2: POST ke /id/download
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (compatible; NodeJS script)",
      Referer: target,
      Origin: "https://musicaldown.com",
      "Accept-Language": "id-ID,id;q=0.9",
    };
    if (sessionValue) headers["Cookie"] = `session_data=${sessionValue}`;

    const downloadResp = await axios.post(
      downloadEndpoint,
      qs.stringify(postFields),
      { headers }
    );

    // Step 3: Parse hasil response
    const dom2 = new JSDOM(downloadResp.data);
    const doc = dom2.window.document;

    let cover = null;
    const videoHeader = doc.querySelector(".video-header");
    if (videoHeader) {
      const style = videoHeader.getAttribute("style") || "";
      const match = style.match(/url\((.*?)\)/i);
      if (match) cover = match[1].replace(/['"]/g, "");
    }

    const avatar = doc.querySelector(".img-area img")?.getAttribute("src") || "";
    const author =
      doc.querySelector(".video-info h2.video-author b")?.textContent || "";
    const description =
      doc.querySelector(".video-info p.video-desc")?.textContent || "";

    const links = [...doc.querySelectorAll("a.download")].map((a) => ({
      text: a.textContent.trim(),
      href: a.getAttribute("href"),
      event: a.getAttribute("data-event"),
    }));

    res.status(200).json({
      target,
      download_endpoint: downloadEndpoint,
      session_data: sessionValue,
      post_fields: postFields,
      http_code: downloadResp.status,
      video_data: { author, description, avatar, cover, download_links: links },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
