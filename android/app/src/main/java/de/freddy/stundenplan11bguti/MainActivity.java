package de.freddy.stundenplan11bguti;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private static final String WEB_BASE = "https://Freddy-hubgit.github.io/stundenplan-11bguti";
    private static final String VERSION_URL = WEB_BASE + "/version.json";
    private static final String COMMITS_URL =
            "https://api.github.com/repos/Freddy-hubgit/stundenplan-11bguti/commits/main";
    private static final long POLL_MS = 5 * 60 * 1000L;

    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private String appliedCommit = null;

    private final Runnable pollTask = new Runnable() {
        @Override
        public void run() {
            checkForWebUpdate();
            main.postDelayed(this, POLL_MS);
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        main.postDelayed(this::checkForWebUpdate, 500);
        main.postDelayed(pollTask, POLL_MS);
    }

    @Override
    public void onResume() {
        super.onResume();
        checkForWebUpdate();
    }

    @Override
    public void onDestroy() {
        main.removeCallbacks(pollTask);
        io.shutdownNow();
        super.onDestroy();
    }

    private void checkForWebUpdate() {
        io.execute(() -> {
            final String sha = fetchRemoteCommit();
            if (sha == null || sha.equals(appliedCommit)) {
                return;
            }
            main.post(() -> applyCommit(sha));
        });
    }

    private void applyCommit(String sha) {
        if (getBridge() == null || getBridge().getWebView() == null) {
            main.postDelayed(() -> applyCommit(sha), 400);
            return;
        }
        WebView view = getBridge().getWebView();
        String target = WEB_BASE + "/?v=" + sha;
        String current = view.getUrl();
        if (current != null && current.contains(sha) && current.startsWith(WEB_BASE)) {
            appliedCommit = sha;
            return;
        }
        appliedCommit = sha;
        view.loadUrl(target);
    }

    private String fetchRemoteCommit() {
        try {
            String versionBody = httpGet(VERSION_URL + "?t=" + System.currentTimeMillis(), false);
            if (versionBody != null) {
                JSONObject json = new JSONObject(versionBody);
                if (json.has("commit")) {
                    return json.getString("commit");
                }
            }
        } catch (Exception ignored) {
        }

        try {
            String commitBody = httpGet(COMMITS_URL, true);
            if (commitBody != null) {
                JSONObject json = new JSONObject(commitBody);
                if (json.has("sha")) {
                    return json.getString("sha");
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String httpGet(String urlSpec, boolean github) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(urlSpec).openConnection();
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(8000);
        connection.setRequestProperty("Accept", github ? "application/vnd.github+json" : "application/json");
        if (github) {
            connection.setRequestProperty("User-Agent", "stundenplan-app");
        }
        connection.setUseCaches(false);
        try {
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) {
                return null;
            }
            InputStream stream = connection.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
            StringBuilder body = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                body.append(line);
            }
            reader.close();
            return body.toString();
        } finally {
            connection.disconnect();
        }
    }
}
