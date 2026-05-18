package com.watchvault.app;

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
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
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

        LinearLayout glow = new LinearLayout(this);
        glow.setBackground(radialLike(Color.argb(95, 217, 164, 65), Color.TRANSPARENT));
        FrameLayout.LayoutParams glowLp = new FrameLayout.LayoutParams(-1, dp(260), Gravity.TOP);
        root.addView(glow, glowLp);

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
            for (int i = 0; i < arr.length(); i++) items.add(NativeMedia.from(arr.getJSONObject(i)));
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

    private void saveToLibrary(NativeMedia item, String status, int progress) {
        setLoading(true);
        executor.execute(() -> {
            boolean ok = false;
            try {
                JSONObject body = new JSONObject();
                body.put("status", status);
                body.put("progressPercent", progress);
                body.put("rating", JSONObject.NULL);
                body.put("notes", JSONObject.NULL);
                JSONObject result = patchJson("/user/library/" + URLEncoder.encode(item.id, "UTF-8"), body);
                ok = result != null;
            } catch (Exception ignored) {}
            boolean finalOk = ok;
            runOnUiThread(() -> {
                setLoading(false);
                toast(finalOk ? "Saved to WatchVault" : "Could not save progress");
                if (finalOk) loadLibrary();
            });
        });
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
        String response = readResponse(conn);
        return new JSONObject(response);
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
        TextView title = text(item.title, 18, TEXT, Typeface.BOLD);
        card.addView(title);
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
        if (item.seasons > 0 || item.episodes > 0) {
            LinearLayout stats = new LinearLayout(this);
            stats.setOrientation(LinearLayout.HORIZONTAL);
            content.addView(stats, new LinearLayout.LayoutParams(-1, dp(92)));
            addMiniStat(stats, "Seasons", String.valueOf(item.seasons));
            addMiniStat(stats, "Episodes", String.valueOf(item.episodes));
        }
        addWideButton("Add to Plan", true, () -> saveToLibrary(item, "plan", 0));
        addWideButton("Mark Watching", false, () -> saveToLibrary(item, "watching", item.typeLabel().equals("Movie") ? 35 : 10));
        addWideButton("Mark Completed", false, () -> saveToLibrary(item, "completed", 100));
    }

    private void renderProfile() {
        activeTab = "Profile";
        buildTabs();
        content.removeAllViews();
        addSectionTitle("Profile");
        addInfoBlock("Native account is active. Same backend progress APIs are used as the old app.");
        addProfileRow("User ID", userId());
        addProfileRow("Device ID", deviceId());
        addWideButton("Copy User ID", true, () -> {
            ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            clipboard.setPrimaryClip(ClipData.newPlainText("WatchVault User ID", userId()));
            toast("User ID copied");
        });
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

    private GradientDrawable radialLike(int start, int end) {
        return new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{start, end});
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    static class NativeMedia {
        String id, kind, title, overview;
        int year, seasons, episodes;
        double rating;
        static NativeMedia from(JSONObject obj) {
            NativeMedia m = new NativeMedia();
            m.id = obj.optString("id");
            m.kind = obj.optString("kind", "movie");
            m.title = obj.optString("title", "Untitled");
            m.overview = obj.optString("overview", "No overview available.");
            m.year = obj.optInt("year", 0);
            JSONArray ratings = obj.optJSONArray("ratings");
            if (ratings != null && ratings.length() > 0) m.rating = ratings.optJSONObject(0).optDouble("value", 0);
            m.seasons = obj.optInt("seasonCount", obj.optJSONArray("seasons") != null ? obj.optJSONArray("seasons").length() : 0);
            m.episodes = obj.optInt("episodeCount", obj.optInt("episodes", 0));
            return m;
        }
        String typeLabel() { return "tv".equals(kind) ? "Series" : "anime".equals(kind) ? "Anime" : "Movie"; }
        String yearText() { return year > 0 ? String.valueOf(year) : "Year N/A"; }
        String ratingText() { return rating > 0 ? String.format("%.1f", rating) : "Rating N/A"; }
    }

    static class LibraryEntry {
        String mediaId, status;
        int progress;
        static LibraryEntry from(JSONObject obj) {
            LibraryEntry e = new LibraryEntry();
            e.mediaId = obj.optString("mediaId", "Unknown title");
            e.status = obj.optString("status", "plan");
            e.progress = obj.optInt("progressPercent", 0);
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
