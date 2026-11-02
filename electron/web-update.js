const WEB_BASE = "https://Freddy-hubgit.github.io/stundenplan-11bguti";
const POLL_MS = 5 * 60 * 1000;

async function getRemoteCommit() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(WEB_BASE + "/assets/version.json?t=" + Date.now(), {
      cache: "no-store", signal: controller.signal,
    });
    if (!res.ok) throw new Error(String(res.status));
    const version = await res.json();
    if (!version || typeof version.commit !== "string" || !/^[a-f0-9]{7,40}$/i.test(version.commit)) {
      throw new Error("Ungültige veröffentlichte Version");
    }
    return version.commit;
  } finally { clearTimeout(timer); }
}

function liveUrl(commit) {
  return WEB_BASE + "/?v=" + encodeURIComponent(commit);
}

module.exports = { WEB_BASE, getRemoteCommit, liveUrl, POLL_MS };
