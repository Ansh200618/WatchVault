package com.watchvault.app;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NativeMainActivity extends AppCompatActivity {
    private static final String API_BASE = "https://watchvault-backend-2lrv.onrender.com/api";
    private static final String PREFS = "watchvault_native";
    private static final int GOLD = Color.rgb(217, 164, 65);
    private static final int BG_TOP = Color.rgb(28, 34, 48);
    private static final int BG_BOTTOM = Color.rgb(7, 10, 15);
    private static final int CARD = Color.argb(218, 22, 25, 34);
    private static final int TEXT = Color.WHITE;
    private static final int MUTED = Color.rgb(174, 179, 190);

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private LinearLayout content;
    private LinearLayout tabs;
    private ProgressBar loader;
    private SharedPreferences prefs;
    private String activeTab = "Home";
    private final List<NativeMedia> currentItems = new ArrayList<>();
    private NativeMedia trackerItem;
    private int trackerSeason = 1;
    private Map<String, Boolean> trackerWatched = new LinkedHashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        ensureIdentity();
        configureSystemBars();
        buildShell();
        loadHome();
    }

    @Override
    protected void onDestroy() {
        executor.shutdownNow();
        super.onDestroy();
    }

    private void ensureIdentity() {
        if (!prefs.contains("userId")) prefs.edit().putString("userId", "wv_" + UUID.randomUUID()).apply();
        if (!prefs.contains("deviceId")) prefs.edit().putString("deviceId", "dev_" + UUID.randomUUID()).apply();
    }

    private String userId() { return prefs.getString("userId", "anonymous"); }
    private String deviceId() { return prefs.getString("deviceId", "dev_unknown"); }

    private void configureSystemBars() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
            window.setStatusBarContrastEnforced(false);
        }
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);
    }

    private void buildShell() {
        FrameLayout root = new FrameLayout(this);
        root.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{BG_TOP, BG_BOTTOM}));

        View glow = new View(this);
        glow.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{Color.argb(90, 217, 164, 65), Color.TRANSPARENT}));
        root.addView(glow, new FrameLayout.LayoutParams(-1, dp(270), Gravity.TOP));

        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setPadding(dp(18), dp(44), dp(18), dp(96));
        root.addView(shell, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(0, 0, 0, dp(14));
        shell.addView(header, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout titleBox = new LinearLayout(this);
        titleBox.setOrientation(LinearLayout.VERTICAL);
        header.addView(titleBox, new LinearLayout.LayoutParams(0, -2, 1));
        titleBox.addView(text("WatchVault", 32, TEXT, Typeface.BOLD));
        titleBox.addView(text("Native Android app • legal watch tracking", 13, MUTED, Typeface.NORMAL));

        TextView badge = text("NATIVE", 11, Color.BLACK, Typeface.BOLD);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(round(GOLD, 999, Color.TRANSPARENT, 0));
        header.addView(badge, new LinearLayout.LayoutParams(dp(86), dp(36)));

        LinearLayout searchRow = new LinearLayout(this);
        searchRow.setOrientation(LinearLayout.HORIZONTAL);
        searchRow.setGravity(Gravity.CENTER_VERTICAL);
        searchRow.setPadding(0, 0, 0, dp(14));
        shell.addView(searchRow, new LinearLayout.LayoutParams(-1, -2));

        EditText search = new EditText(this);
        search.setHint("Search movies, series, anime");
        search.setHintTextColor(Color.rgb(128, 134, 146));
        search.setTextColor(TEXT);
        search.setSingleLine(true);
        search.setTextSize(14);
        search.setPadding(dp(16), 0, dp(16), 0);
        search.setBackground(round(Color.argb(95, 255, 255, 255), 22, Color.argb(32, 255, 255, 255), 1));
        searchRow.addView(search, new LinearLayout.LayoutParams(0, dp(52), 1));

        Button go = pillButton("Go", true);
        LinearLayout.LayoutParams goLp = new LinearLayout.LayoutParams(dp(68), dp(52));
        goLp.setMargins(dp(10), 0, 0, 0);
        searchRow.addView(go, goLp);
        go.setOnClickListener(v -> {
            String q = search.getText().toString().trim();
            if (q.length() > 0) loadSearch(q);
        });

        HorizontalScrollView hsv = new HorizontalScrollView(this);
        hsv.setHorizontalScrollBarEnabled(false);
        tabs = new LinearLayout(this);
        tabs.setOrientation(LinearLayout.HORIZONTAL);
        hsv.addView(tabs);
        shell.addView(hsv, new LinearLayout.LayoutParams(-1, dp(52)));
        buildTabs();

        loader = new ProgressBar(this);
        loader.setVisibility(View.GONE);
        shell.addView(loader, new LinearLayout.LayoutParams(-1, dp(4)));

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(false);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(0, dp(16), 0, dp(24));
        scroll.addView(content);
        shell.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setGravity(Gravity.CENTER);
        nav.setPadding(dp(8), dp(8), dp(8), dp(8));
        nav.setBackground(round(Color.argb(220, 14, 17, 24), 30, Color.argb(45, 255, 255, 255), 1));
        FrameLayout.LayoutParams navLp = new FrameLayout.LayoutParams(-1, dp(76), Gravity.BOTTOM);
        navLp.setMargins(dp(18), 0, dp(18), dp(18));
        root.addView(nav, navLp);

        addNavButton(nav, "Home", this::loadHome);
        addNavButton(nav, "Movies", () -> loadKind("movie"));
        addNavButton(nav, "Series", () -> loadKind("tv"));
        addNavButton(nav, "Anime", () -> loadKind("anime"));
        addNavButton(nav, "Library", this::loadLibrary);

        setContentView(root);
    }

    private void buildTabs() {
        if (tabs == null) return;
        tabs.removeAllViews();
        addTab("Home", this::loadHome);
        addTab("Movies", () -> loadKind("movie"));
        addTab("Series", () -> loadKind("tv"));
        addTab("Anime", () -> loadKind("anime"));
        addTab("Library", this::loadLibrary);
        addTab("Profile", this::renderProfile);
    }

    private void addTab(String label, Runnable action) {
        Button b = pillButton(label, label.equals(activeTab));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, dp(42));
        lp.setMargins(0, 0, dp(10), 0);
        tabs.addView(b, lp);
        b.setOnClickListener(v -> { activeTab = label; buildTabs(); action.run(); });
    }

    private void addNavButton(LinearLayout nav, String label, Runnable action) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(11);
        b.setTextColor(TEXT);
        b.setBackgroundColor(Color.TRANSPARENT);
        nav.addView(b, new LinearLayout.LayoutParams(0, -1, 1));
        b.setOnClickListener(v -> { activeTab = label; buildTabs(); action.run(); });
    }

    private void loadHome() {
        activeTab = "Home";
        buildTabs();
        setLoading(true);
        content.removeAllViews();
        addSectionTitle("Trending now");
        executor.execute(() -> {
            List<NativeMedia> all = new ArrayList<>();
            all.addAll(fetchMedia("/media/popular?kind=movie"));
            all.addAll(fetchMedia("/media/popular?kind=tv"));
            all.addAll(fetchMedia("/media/popular?kind=anime"));
            runOnUiThread(() -> renderMediaList(all, "Native Android titles from WatchVault backend"));
        });
    }

    private void loadKind(String kind) {
        activeTab = kind.equals("movie") ? "Movies" : kind.equals("tv") ? "Series" : "Anime";
        buildTabs();
        setLoading(true);
        content.removeAllViews();
        addSectionTitle(activeTab);
        executor.execute(() -> {
            List<NativeMedia> data = fetchMedia("/media/popular?kind=" + kind);
            runOnUiThread(() -> renderMediaList(data, "Tap any title to track it natively"));
        });
    }

    private void loadSearch(String query) {
        activeTab = "Home";
        buildTabs();
        setLoading(true);
        content.removeAllViews();
        addSectionTitle("Search");
        executor.execute(() -> {
            try {
                String encoded = URLEncoder.encode(query, "UTF-8");
                List<NativeMedia> data = fetchMedia("/media/search?q=" + encoded);
                runOnUiThread(() -> renderMediaList(data, "Search results from backend"));
            } catch (Exception e) {
                runOnUiThread(() -> renderError("Search failed. Check internet/backend."));
            }
        });
    }

    private void loadLibrary() {
        activeTab = "Library";
        buildTabs();
        setLoading(true);
        content.removeAllViews();
        addSectionTitle("Your Library");
        executor.execute(() -> {
            List<LibraryEntry> entries = fetchLibrary();
            runOnUiThread(() -> renderLibrary(entries));
        });
    }

    private List<NativeMedia> fetchMedia(String path) {
        List<NativeMedia> items = new ArrayList<>();
        try {
            HttpURLConnection conn = openGet(path);
            JSONArray arr = new JSONArray(readResponse(conn));
            Map<String, NativeMedia> grouped = new LinkedHashMap<>();
            for (int i = 0; i < arr.length(); i++) {
                NativeMedia media = NativeMedia.from(arr.getJSONObject(i));
                String key = media.groupKey();
                NativeMedia existing = grouped.get(key);
                grouped.put(key, existing == null ? media : existing.merge(media));
            }
            items.addAll(grouped.values());
        } catch (Exception ignored) {}
        return items;
    }

    private List<LibraryEntry> fetchLibrary() {
        List<LibraryEntry> items = new ArrayList<>();
        try {
            HttpURLConnection conn = openGet("/user/library");
            JSONArray arr = new JSONArray(readResponse(conn));
            for (int i = 0; i < arr.length(); i++) items.add(LibraryEntry.from(arr.getJSONObject(i)));
        } catch (Exception ignored) {}
        return items;
    }

    private LibraryEntry fetchLibraryItem(String mediaId) {
        for (LibraryEntry entry : fetchLibrary()) if (mediaId.equals(entry.mediaId)) return entry;
        return null;
    }

    private void saveToLibrary(NativeMedia item, String status, int progress) {
        Map<String, Boolean> empty = new LinkedHashMap<>();
        saveProgress(item, status, progress, empty, null, () -> loadLibrary());
    }

    private void saveProgress(NativeMedia item, String status, int progress, Map<String, Boolean> watched, int[] latest, Runnable after) {
        setLoading(true);
        executor.execute(() -> {
            boolean ok = false;
            try {
                JSONObject body = new JSONObject();
                body.put("status", status);
                body.put("progressPercent", progress);
                body.put("watchedEpisodes", watchedToJson(watched));
                if (latest != null) {
                    JSONObject last = new JSONObject();
                    last.put("season", latest[0]);
                    last.put("episode", latest[1]);
                    body.put("lastEpisode", last);
                } else {
                    body.put("lastEpisode", JSONObject.NULL);
                }
                JSONObject result = patchJson("/user/library/" + URLEncoder.encode(item.id, "UTF-8"), body);
                ok = result != null;
            } catch (Exception ignored) {}
            boolean finalOk = ok;
            runOnUiThread(() -> {
                setLoading(false);
                toast(finalOk ? "Progress saved" : "Could not save progress");
                if (finalOk && after != null) after.run();
            });
        });
    }

    private JSONObject watchedToJson(Map<String, Boolean> watched) throws Exception {
        JSONObject obj = new JSONObject();
        for (Map.Entry<String, Boolean> e : watched.entrySet()) if (Boolean.TRUE.equals(e.getValue())) obj.put(e.getKey(), true);
        return obj;
    }

    private HttpURLConnection openGet(String path) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(API_BASE + path).openConnection();
        conn.setRequestMethod("GET");
        applyHeaders(conn);
        return conn;
    }

    private JSONObject patchJson(String path, JSONObject body) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(API_BASE + path).openConnection();
        conn.setRequestMethod("PATCH");
        conn.setDoOutput(true);
        applyHeaders(conn);
        conn.setRequestProperty("Content-Type", "application/json");
        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        OutputStream os = conn.getOutputStream();
        os.write(bytes);
        os.flush();
        os.close();
        return new JSONObject(readResponse(conn));
    }

    private void applyHeaders(HttpURLConnection conn) {
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(15000);
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("X-WatchVault-User", userId());
        conn.setRequestProperty("X-WatchVault-Device", deviceId());
    }

    private String readResponse(HttpURLConnection conn) throws Exception {
        int code = conn.getResponseCode();
        BufferedReader br = new BufferedReader(new InputStreamReader(code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        br.close();
        if (code < 200 || code >= 300) throw new RuntimeException(sb.toString());
        return sb.toString();
    }

    private void renderMediaList(List<NativeMedia> items, String subtitle) {
        setLoading(false);
        currentItems.clear();
        currentItems.addAll(items);
        content.removeAllViews();
        addSectionTitle(activeTab);
        content.addView(text(subtitle, 13, MUTED, Typeface.NORMAL));
        if (items.isEmpty()) { renderError("No data returned. Backend/API may be sleeping."); return; }
        for (NativeMedia item : items) addMediaCard(item);
    }

    private void renderLibrary(List<LibraryEntry> entries) {
        setLoading(false);
        content.removeAllViews();
        addSectionTitle("Your Library");
        content.addView(text(entries.size() + " saved items on this account", 13, MUTED, Typeface.NORMAL));
        if (entries.isEmpty()) { addInfoBlock("Nothing saved yet. Add titles from Home, Movies, Series, or Anime."); return; }
        for (LibraryEntry entry : entries) addLibraryCard(entry);
    }

    private void addMediaCard(NativeMedia item) {
        LinearLayout card = card();
        card.addView(text(item.title, 18, TEXT, Typeface.BOLD));
        card.addView(text(item.typeLabel() + " • " + item.yearText() + " • " + item.ratingText(), 12, GOLD, Typeface.BOLD));
        TextView overview = text(item.overview, 13, MUTED, Typeface.NORMAL);
        overview.setMaxLines(3);
        LinearLayout.LayoutParams ovLp = new LinearLayout.LayoutParams(-1, -2);
        ovLp.setMargins(0, dp(7), 0, 0);
        card.addView(overview, ovLp);
        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams actionsLp = new LinearLayout.LayoutParams(-1, dp(46));
        actionsLp.setMargins(0, dp(12), 0, 0);
        card.addView(actions, actionsLp);
        addAction(actions, "Details", true, () -> renderDetail(item));
        addAction(actions, "Plan", false, () -> saveToLibrary(item, "plan", 0));
    }

    private void addLibraryCard(LibraryEntry entry) {
        LinearLayout card = card();
        card.addView(text(entry.mediaId, 15, TEXT, Typeface.BOLD));
        card.addView(text(entry.statusLabel() + " • " + entry.progress + "%", 12, GOLD, Typeface.BOLD));
        ProgressBar bar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        bar.setMax(100);
        bar.setProgress(entry.progress);
        LinearLayout.LayoutParams barLp = new LinearLayout.LayoutParams(-1, dp(8));
        barLp.setMargins(0, dp(12), 0, 0);
        card.addView(bar, barLp);
    }

    private void renderDetail(NativeMedia item) {
        content.removeAllViews();
        Button back = pillButton("← Back", false);
        content.addView(back, new LinearLayout.LayoutParams(dp(120), dp(44)));
        back.setOnClickListener(v -> renderMediaList(currentItems, "Tap any title to track it natively"));
        TextView title = text(item.title, 28, TEXT, Typeface.BOLD);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(-1, -2);
        titleLp.setMargins(0, dp(18), 0, dp(8));
        content.addView(title, titleLp);
        content.addView(text(item.typeLabel() + " • " + item.yearText() + " • " + item.ratingText(), 14, GOLD, Typeface.BOLD));
        TextView overview = text(item.overview, 14, Color.rgb(224, 228, 236), Typeface.NORMAL);
        LinearLayout.LayoutParams overviewLp = new LinearLayout.LayoutParams(-1, -2);
        overviewLp.setMargins(0, dp(16), 0, dp(16));
        content.addView(overview, overviewLp);
        if (item.seasonCount() > 0 || item.totalEpisodeCount() > 0) {
            LinearLayout stats = new LinearLayout(this);
            stats.setOrientation(LinearLayout.HORIZONTAL);
            content.addView(stats, new LinearLayout.LayoutParams(-1, dp(92)));
            addMiniStat(stats, "Seasons", String.valueOf(item.seasonCount()));
            addMiniStat(stats, "Episodes", String.valueOf(item.totalEpisodeCount()));
        }
        addWideButton("Add to Plan", true, () -> saveToLibrary(item, "plan", 0));
        addWideButton("Mark Watching", false, () -> saveToLibrary(item, "watching", item.typeLabel().equals("Movie") ? 35 : 10));
        if (!item.typeLabel().equals("Movie")) addWideButton("Open Episode Tracker", false, () -> openTracker(item));
        addWideButton("Mark Completed", false, () -> saveToLibrary(item, "completed", 100));
    }

    private void openTracker(NativeMedia item) {
        trackerItem = item;
        trackerSeason = 1;
        setLoading(true);
        executor.execute(() -> {
            LibraryEntry entry = fetchLibraryItem(item.id);
            Map<String, Boolean> map = entry != null ? entry.watched : new LinkedHashMap<>();
            runOnUiThread(() -> {
                setLoading(false);
                trackerWatched = new LinkedHashMap<>(map);
                renderTracker();
            });
        });
    }

    private void renderTracker() {
        if (trackerItem == null) return;
        NativeMedia item = trackerItem;
        content.removeAllViews();
        Button back = pillButton("← Detail", false);
        content.addView(back, new LinearLayout.LayoutParams(dp(124), dp(44)));
        back.setOnClickListener(v -> renderDetail(item));
        TextView title = text("Episode Tracker", 26, TEXT, Typeface.BOLD);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(-1, -2);
        titleLp.setMargins(0, dp(16), 0, dp(3));
        content.addView(title, titleLp);
        content.addView(text(item.title, 14, GOLD, Typeface.BOLD));

        LinearLayout seasonRow = new LinearLayout(this);
        seasonRow.setOrientation(LinearLayout.HORIZONTAL);
        HorizontalScrollView hsv = new HorizontalScrollView(this);
        hsv.setHorizontalScrollBarEnabled(false);
        hsv.addView(seasonRow);
        LinearLayout.LayoutParams seasonLp = new LinearLayout.LayoutParams(-1, dp(54));
        seasonLp.setMargins(0, dp(14), 0, dp(8));
        content.addView(hsv, seasonLp);
        for (int s = 1; s <= item.seasonCount(); s++) {
            final int ss = s;
            Button b = pillButton("Season " + s, trackerSeason == s);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, dp(44));
            lp.setMargins(0, 0, dp(8), 0);
            seasonRow.addView(b, lp);
            b.setOnClickListener(v -> { trackerSeason = ss; renderTracker(); });
        }

        int count = item.episodesInSeason(trackerSeason);
        int watchedInSeason = watchedCountInSeason(trackerSeason, count);
        addInfoBlock("Season " + trackerSeason + " • " + watchedInSeason + "/" + count + " watched • " + trackerProgress(item) + "% overall");

        LinearLayout bulk = new LinearLayout(this);
        bulk.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams bulkLp = new LinearLayout.LayoutParams(-1, dp(46));
        bulkLp.setMargins(0, 0, 0, dp(10));
        content.addView(bulk, bulkLp);
        addAction(bulk, "Mark Season", true, () -> markSeason(trackerSeason, true));
        addAction(bulk, "Reset", false, this::resetTracker);

        for (int e = 1; e <= count; e++) addEpisodeRow(trackerSeason, e);
    }

    private void addEpisodeRow(int season, int episode) {
        String key = keyFor(season, episode);
        boolean watched = Boolean.TRUE.equals(trackerWatched.get(key));
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(14), dp(12), dp(14), dp(12));
        row.setBackground(round(watched ? Color.argb(75, 217, 164, 65) : CARD, 22, watched ? Color.argb(120, 217, 164, 65) : Color.argb(35, 255, 255, 255), 1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(0, dp(8), 0, 0);
        content.addView(row, lp);
        LinearLayout textBox = new LinearLayout(this);
        textBox.setOrientation(LinearLayout.VERTICAL);
        row.addView(textBox, new LinearLayout.LayoutParams(0, -2, 1));
        textBox.addView(text("S" + season + " E" + episode, 15, TEXT, Typeface.BOLD));
        textBox.addView(text(watched ? "Watched" : "Tap to mark watched", 12, MUTED, Typeface.NORMAL));
        Button toggle = pillButton(watched ? "Undo" : "Watch", !watched);
        row.addView(toggle, new LinearLayout.LayoutParams(dp(96), dp(42)));
        toggle.setOnClickListener(v -> toggleEpisode(season, episode));
    }

    private void toggleEpisode(int season, int episode) {
        String key = keyFor(season, episode);
        if (Boolean.TRUE.equals(trackerWatched.get(key))) {
            trackerWatched.remove(key);
            persistTracker();
            renderTracker();
            return;
        }
        if (episode > 1) {
            new AlertDialog.Builder(this)
                    .setTitle("Mark previous episodes?")
                    .setMessage("Do you want to mark episodes 1 to " + episode + " as watched too?")
                    .setPositiveButton("Mark previous", (d, w) -> {
                        for (int i = 1; i <= episode; i++) trackerWatched.put(keyFor(season, i), true);
                        persistTracker();
                        renderTracker();
                    })
                    .setNegativeButton("Only this", (d, w) -> {
                        trackerWatched.put(key, true);
                        persistTracker();
                        renderTracker();
                    })
                    .show();
        } else {
            trackerWatched.put(key, true);
            persistTracker();
            renderTracker();
        }
    }

    private void markSeason(int season, boolean watched) {
        if (trackerItem == null) return;
        int count = trackerItem.episodesInSeason(season);
        for (int i = 1; i <= count; i++) {
            if (watched) trackerWatched.put(keyFor(season, i), true);
            else trackerWatched.remove(keyFor(season, i));
        }
        persistTracker();
        renderTracker();
    }

    private void resetTracker() {
        new AlertDialog.Builder(this)
                .setTitle("Reset progress?")
                .setMessage("This will remove watched episodes for this title.")
                .setPositiveButton("Reset", (d, w) -> {
                    trackerWatched.clear();
                    persistTracker();
                    renderTracker();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void persistTracker() {
        if (trackerItem == null) return;
        int progress = trackerProgress(trackerItem);
        int[] latest = latestEpisode();
        String status = progress >= 100 ? "completed" : progress > 0 ? "watching" : "plan";
        saveProgress(trackerItem, status, progress, trackerWatched, latest, null);
    }

    private int trackerProgress(NativeMedia item) {
        int total = Math.max(1, item.totalEpisodeCount());
        int watched = 0;
        for (Boolean value : trackerWatched.values()) if (Boolean.TRUE.equals(value)) watched++;
        return Math.min(100, Math.round((watched * 100f) / total));
    }

    private int watchedCountInSeason(int season, int count) {
        int watched = 0;
        for (int i = 1; i <= count; i++) if (Boolean.TRUE.equals(trackerWatched.get(keyFor(season, i)))) watched++;
        return watched;
    }

    private int[] latestEpisode() {
        int latestS = 0;
        int latestE = 0;
        for (String key : trackerWatched.keySet()) {
            if (!Boolean.TRUE.equals(trackerWatched.get(key))) continue;
            String[] parts = key.split("-");
            if (parts.length != 2) continue;
            int s = safeInt(parts[0]);
            int e = safeInt(parts[1]);
            if (s > latestS || (s == latestS && e > latestE)) { latestS = s; latestE = e; }
        }
        return latestS == 0 ? null : new int[]{latestS, latestE};
    }

    private String keyFor(int season, int episode) { return season + "-" + episode; }

    private void renderProfile() {
        activeTab = "Profile";
        buildTabs();
        content.removeAllViews();
        addSectionTitle("Profile");
        addInfoBlock("Native account is active. Same backend progress APIs are used as the web version.");
        addProfileRow("User ID", userId());
        addProfileRow("Device ID", deviceId());
        addWideButton("Copy User ID", true, () -> {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            clipboard.setPrimaryClip(ClipData.newPlainText("WatchVault User ID", userId()));
            toast("User ID copied");
        });
        addWideButton("Reset local native identity", false, () -> new AlertDialog.Builder(this)
                .setTitle("Reset local identity?")
                .setMessage("This creates a new local User ID on this phone. Backend data for the old ID is not deleted.")
                .setPositiveButton("Reset", (d, w) -> {
                    prefs.edit().clear().apply();
                    ensureIdentity();
                    renderProfile();
                })
                .setNegativeButton("Cancel", null)
                .show());
    }

    private LinearLayout card() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        card.setBackground(round(CARD, 26, Color.argb(38, 255, 255, 255), 1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(0, dp(12), 0, 0);
        content.addView(card, lp);
        return card;
    }

    private void addAction(LinearLayout row, String label, boolean primary, Runnable click) {
        Button b = pillButton(label, primary);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -1, 1);
        lp.setMargins(row.getChildCount() == 0 ? 0 : dp(10), 0, 0, 0);
        row.addView(b, lp);
        b.setOnClickListener(v -> click.run());
    }

    private void addWideButton(String label, boolean primary, Runnable click) {
        Button b = pillButton(label, primary);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, dp(54));
        lp.setMargins(0, dp(10), 0, 0);
        content.addView(b, lp);
        b.setOnClickListener(v -> click.run());
    }

    private void addMiniStat(LinearLayout row, String label, String value) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(8), dp(8), dp(8), dp(8));
        box.setBackground(round(Color.argb(95, 255, 255, 255), 20, Color.argb(35, 255, 255, 255), 1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -1, 1);
        lp.setMargins(0, 0, dp(10), 0);
        row.addView(box, lp);
        box.addView(text(value, 24, TEXT, Typeface.BOLD));
        box.addView(text(label, 11, MUTED, Typeface.BOLD));
    }

    private void addProfileRow(String label, String value) {
        LinearLayout box = card();
        box.addView(text(label, 12, GOLD, Typeface.BOLD));
        TextView valueText = text(value, 12, MUTED, Typeface.NORMAL);
        valueText.setTextIsSelectable(true);
        box.addView(valueText);
    }

    private void renderError(String msg) { setLoading(false); addInfoBlock(msg); }

    private void addInfoBlock(String msg) {
        TextView box = text(msg, 14, Color.rgb(225, 228, 236), Typeface.NORMAL);
        box.setPadding(dp(16), dp(16), dp(16), dp(16));
        box.setBackground(round(Color.argb(115, 255, 255, 255), 22, Color.argb(40, 255, 255, 255), 1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(0, dp(14), 0, dp(14));
        content.addView(box, lp);
    }

    private void addSectionTitle(String label) { content.addView(text(label, 24, TEXT, Typeface.BOLD)); }
    private void setLoading(boolean loading) { if (loader != null) loader.setVisibility(loading ? View.VISIBLE : View.GONE); }
    private void toast(String msg) { Toast.makeText(this, msg, Toast.LENGTH_SHORT).show(); }

    private Button pillButton(String label, boolean primary) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(13);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        b.setTextColor(primary ? Color.BLACK : TEXT);
        b.setBackground(round(primary ? GOLD : Color.argb(115, 255, 255, 255), 999, Color.argb(36, 255, 255, 255), 1));
        return b;
    }

    private TextView text(String value, int sp, int color, int style) {
        TextView t = new TextView(this);
        t.setText(value == null || value.length() == 0 ? "Not available" : value);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setTypeface(Typeface.DEFAULT, style);
        t.setLineSpacing(0, 1.12f);
        return t;
    }

    private GradientDrawable round(int color, int radiusDp, int strokeColor, int strokeDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        if (strokeDp > 0) d.setStroke(dp(strokeDp), strokeColor);
        return d;
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private int safeInt(String value) { try { return Integer.parseInt(value); } catch (Exception e) { return 0; } }

    static class NativeMedia {
        String id, kind, title, overview, parentTitle, releaseType;
        int year, seasons, episodes, seasonNumber;
        double rating;
        static NativeMedia from(JSONObject obj) {
            NativeMedia m = new NativeMedia();
            m.id = obj.optString("id");
            m.kind = obj.optString("kind", "movie");
            m.title = obj.optString("title", "Untitled");
            m.parentTitle = obj.optString("parentTitle", "");
            m.releaseType = obj.optString("releaseType", "");
            m.overview = obj.optString("overview", "No overview available.");
            m.year = obj.optInt("year", 0);
            m.seasonNumber = obj.optInt("seasonNumber", 0);
            JSONArray ratings = obj.optJSONArray("ratings");
            if (ratings != null && ratings.length() > 0) m.rating = ratings.optJSONObject(0).optDouble("value", 0);
            JSONArray seasonArr = obj.optJSONArray("seasons");
            m.seasons = obj.optInt("seasonCount", seasonArr != null ? seasonArr.length() : 0);
            m.episodes = obj.optInt("episodeCount", obj.optInt("episodes", 0));
            if (m.seasons <= 0 && m.seasonNumber > 0) m.seasons = Math.max(1, m.seasonNumber);
            return m;
        }
        String typeLabel() { return "tv".equals(kind) ? "Series" : "anime".equals(kind) ? "Anime" : "Movie"; }
        String yearText() { return year > 0 ? String.valueOf(year) : "Year N/A"; }
        String ratingText() { return rating > 0 ? String.format("%.1f", rating) : "Rating N/A"; }
        int seasonCount() { return "Movie".equals(typeLabel()) ? 0 : Math.max(1, seasons); }
        int totalEpisodeCount() { return "Movie".equals(typeLabel()) ? 0 : Math.max(episodes, seasonCount() * 8); }
        int episodesInSeason(int season) {
            int s = Math.max(1, seasonCount());
            int total = Math.max(s, totalEpisodeCount());
            int base = Math.max(1, (int) Math.ceil(total / (double) s));
            if (season == s) return Math.max(1, total - (base * (s - 1)));
            return base;
        }
        String groupKey() {
            if ("Movie".equals(typeLabel())) return "movie:" + id;
            String name = parentTitle != null && parentTitle.length() > 0 ? parentTitle : title;
            return typeLabel() + ":" + name.toLowerCase().replaceAll("[^a-z0-9]+", " ").trim();
        }
        NativeMedia merge(NativeMedia other) {
            NativeMedia best = this.seasonCount() >= other.seasonCount() && this.totalEpisodeCount() >= other.totalEpisodeCount() ? this : other;
            best.seasons = Math.max(this.seasonCount(), other.seasonCount());
            best.episodes = Math.max(this.totalEpisodeCount(), other.totalEpisodeCount());
            if (best.parentTitle != null && best.parentTitle.length() > 0) best.title = best.parentTitle;
            return best;
        }
    }

    static class LibraryEntry {
        String mediaId, status;
        int progress;
        Map<String, Boolean> watched = new LinkedHashMap<>();
        static LibraryEntry from(JSONObject obj) {
            LibraryEntry e = new LibraryEntry();
            e.mediaId = obj.optString("mediaId", "Unknown title");
            e.status = obj.optString("status", "plan");
            e.progress = obj.optInt("progressPercent", 0);
            JSONObject watchedObj = obj.optJSONObject("watchedEpisodes");
            if (watchedObj != null) {
                JSONArray keys = watchedObj.names();
                if (keys != null) for (int i = 0; i < keys.length(); i++) {
                    String key = keys.optString(i);
                    if (watchedObj.optBoolean(key, false)) e.watched.put(key, true);
                }
            }
            return e;
        }
        String statusLabel() {
            if ("watching".equals(status)) return "Watching";
            if ("completed".equals(status)) return "Completed";
            if ("favorite".equals(status)) return "Favorite";
            return "Plan";
        }
    }
}
