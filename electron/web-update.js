const WEB_BASE = "https://Freddy-hubgit.github.io/stundenplan-11bguti";
const REPO = "Freddy-hubgit/stundenplan-11bguti";
const POLL_MS = 5 * 60 * 1000;

async function readJson(url, headers) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: headers || {},
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function getRemoteCommit() {
  try {
    const version = await readJson(WEB_BASE + "/assets/version.json?t=" + Date.now());
    if (version && version.commit) return String(version.commit);
  } catch (_) {
    /* Pages hat noch keine version.json – GitHub-Commit nehmen */
  }

  const data = await readJson("https://api.github.com/repos/" + REPO + "/commits/main", {
    "User-Agent": "stundenplan-app",
    Accept: "application/vnd.github+json",
  });
  if (!data || !data.sha) throw new Error("no sha");
  return String(data.sha);
}

function liveUrl(commit) {
  return WEB_BASE + "/?v=" + encodeURIComponent(commit);
}

module.exports = { WEB_BASE, getRemoteCommit, liveUrl, POLL_MS };
