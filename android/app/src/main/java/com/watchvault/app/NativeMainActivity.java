package com.watchvault.app;

import android.content.Intent;
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
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.ColorUtils;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NativeMainActivity extends AppCompatActivity {
    private static final String API_BASE = "https://watchvault-backend-2lrv.onrender.com/api";
    private static final int GOLD = Color.rgb(217, 164, 65);
    private static final int BG_TOP = Color.rgb(20, 24, 32);
    private static final int BG_BOTTOM = Color.rgb(8, 10, 14);
    private static final int CARD = Color.argb(210, 22, 25, 32);
    private static final int TEXT = Color.WHITE;
    private static final int MUTED = Color.rgb(170, 174, 184);

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private LinearLayout content;
    private LinearLayout tabs;
    private ProgressBar loader;
    private String activeTab = "Home";
    private final List<NativeMedia> currentItems = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();
        buildShell();
        loadHome();
    }

    @Override
    protected void onDestroy() {
        executor.shutdownNow();
        super.onDestroy();
    }

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
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{BG_TOP, BG_BOTTOM});
        root.setBackground(bg);

        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setPadding(dp(18), dp(42), dp(18), dp(92));
        root.addView(shell, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(0, 0, 0, dp(14));
        shell.addView(header, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout titleBox = new LinearLayout(this);
        titleBox.setOrientation(LinearLayout.VERTICAL);
        header.addView(titleBox, new LinearLayout.LayoutParams(0, -2, 1));

        TextView title = text("WatchVault", 30, TEXT, Typeface.BOLD);
        titleBox.addView(title);
        TextView sub = text("Native Android beta • legal tracking only", 13, MUTED, Typeface.NORMAL);
        titleBox.addView(sub);

        Button classic = pillButton("Classic", false);
        classic.setOnClickListener(v -> startActivity(new Intent(this, MainActivity.class)));
        header.addView(classic, new LinearLayout.LayoutParams(dp(96), dp(44)));

        LinearLayout searchRow = new LinearLayout(this);
        searchRow.setOrientation(LinearLayout.HORIZONTAL);
        searchRow.setGravity(Gravity.CENTER_VERTICAL);
        searchRow.setPadding(0, 0, 0, dp(14));
        shell.addView(searchRow, new LinearLayout.LayoutParams(-1, -2));

        EditText search = new EditText(this);
        search.setHint("Search movies, series, anime");
        search.setHintTextColor(Color.rgb(120, 125, 135));
        search.setTextColor(TEXT);
        search.setSingleLine(true);
        search.setTextSize(14);
        search.setPadding(dp(16), 0, dp(16), 0);
        search.setBackground(round(Color.argb(150, 255, 255, 255), 22, Color.argb(28, 255, 255, 255), 1));
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
        nav.setBackground(round(Color.argb(215, 16, 18, 24), 30, Color.argb(45, 255, 255, 255), 1));
        FrameLayout.LayoutParams navLp = new FrameLayout.LayoutParams(-1, dp(74), Gravity.BOTTOM);
        navLp.setMargins(dp(18), 0, dp(18), dp(18));
        root.addView(nav, navLp);

        addNavButton(nav, "Home", () -> loadHome());
        addNavButton(nav, "Movies", () -> loadKind("movie"));
        addNavButton(nav, "Series", () -> loadKind("tv"));
        addNavButton(nav, "Anime", () -> loadKind("anime"));
        addNavButton(nav, "Profile", () -> renderProfile());

        setContentView(root);
    }

    private void buildTabs() {
        tabs.removeAllViews();
        addTab("Home", () -> loadHome());
        addTab("Movies", () -> loadKind("movie"));
        addTab("Series", () -> loadKind("tv"));
        addTab("Anime", () -> loadKind("anime"));
        addTab("Library", () -> renderLibraryNote());
    }

    private void addTab(String label, Runnable action) {
        Button b = pillButton(label, label.equals(activeTab));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, dp(42));
        lp.setMargins(0, 0, dp(10), 0);
        tabs.addView(b, lp);
        b.setOnClickListener(v -> {
            activeTab = label;
            buildTabs();
            action.run();
        });
    }

    private void addNavButton(LinearLayout nav, String label, Runnable action) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(11);
        b.setTextColor(TEXT);
        b.setBackgroundColor(Color.TRANSPARENT);
        nav.addView(b, new LinearLayout.LayoutParams(0, -1, 1));
        b.setOnClickListener(v -> {
            activeTab = label.equals("Profile") ? "Home" : label;
            buildTabs();
            action.run();
        });
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
            runOnUiThread(() -> renderMediaList(all, "Live titles from WatchVault backend"));
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
            runOnUiThread(() -> renderMediaList(data, "Native list • tap a title for details"));
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
                runOnUiThread(() -> renderMediaList(data, "Results grouped by title where possible"));
            } catch (Exception e) {
                runOnUiThread(() -> renderError("Search failed. Check internet/backend."));
            }
        });
    }

    private List<NativeMedia> fetchMedia(String path) {
        List<NativeMedia> items = new ArrayList<>();
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(API_BASE + path).openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);
            int code = conn.getResponseCode();
            BufferedReader br = new BufferedReader(new InputStreamReader(code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            br.close();
            JSONArray arr = new JSONArray(sb.toString());
            for (int i = 0; i < arr.length(); i++) items.add(NativeMedia.from(arr.getJSONObject(i)));
        } catch (Exception ignored) {}
        return items;
    }

    private void renderMediaList(List<NativeMedia> items, String subtitle) {
        setLoading(false);
        currentItems.clear();
        currentItems.addAll(items);
        content.removeAllViews();
        addSectionTitle(activeTab);
        TextView st = text(subtitle, 13, MUTED, Typeface.NORMAL);
        content.addView(st);
        if (items.isEmpty()) {
            renderError("No data returned. Backend/API may be sleeping.");
            return;
        }
        for (NativeMedia item : items) addMediaCard(item);
    }

    private void addMediaCard(NativeMedia item) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        card.setBackground(round(CARD, 26, Color.argb(38, 255, 255, 255), 1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(0, dp(12), 0, 0);
        content.addView(card, lp);

        TextView title = text(item.title, 18, TEXT, Typeface.BOLD);
        card.addView(title);
        TextView meta = text(item.typeLabel() + " • " + item.yearText() + " • " + item.ratingText(), 12, GOLD, Typeface.BOLD);
        LinearLayout.LayoutParams metaLp = new LinearLayout.LayoutParams(-1, -2);
        metaLp.setMargins(0, dp(4), 0, dp(6));
        card.addView(meta, metaLp);
        TextView overview = text(item.overview, 13, MUTED, Typeface.NORMAL);
        overview.setMaxLines(3);
        card.addView(overview);

        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams actionsLp = new LinearLayout.LayoutParams(-1, dp(46));
        actionsLp.setMargins(0, dp(12), 0, 0);
        card.addView(actions, actionsLp);

        Button details = pillButton("Details", true);
        actions.addView(details, new LinearLayout.LayoutParams(0, -1, 1));
        details.setOnClickListener(v -> renderDetail(item));

        Button plan = pillButton("Plan", false);
        LinearLayout.LayoutParams planLp = new LinearLayout.LayoutParams(0, -1, 1);
        planLp.setMargins(dp(10), 0, 0, 0);
        actions.addView(plan, planLp);
        plan.setOnClickListener(v -> renderComingNative("Library sync is next native migration step. Classic mode still has full tracker."));
    }

    private void renderDetail(NativeMedia item) {
        content.removeAllViews();
        Button back = pillButton("← Back", false);
        content.addView(back, new LinearLayout.LayoutParams(dp(120), dp(44)));
        back.setOnClickListener(v -> renderMediaList(currentItems, "Native list • tap a title for details"));

        TextView title = text(item.title, 28, TEXT, Typeface.BOLD);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(-1, -2);
        titleLp.setMargins(0, dp(18), 0, dp(8));
        content.addView(title, titleLp);

        content.addView(text(item.typeLabel() + " • " + item.yearText() + " • " + item.ratingText(), 14, GOLD, Typeface.BOLD));
        TextView overview = text(item.overview, 14, Color.rgb(220, 224, 232), Typeface.NORMAL);
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

        Button tracker = pillButton("Open tracker in Classic mode", true);
        content.addView(tracker, new LinearLayout.LayoutParams(-1, dp(54)));
        tracker.setOnClickListener(v -> startActivity(new Intent(this, MainActivity.class)));

        TextView note = text("Native episode tracker, reminders, account and updates will be migrated screen by screen. This native build already opens without WebView as the main launcher.", 12, MUTED, Typeface.NORMAL);
        LinearLayout.LayoutParams noteLp = new LinearLayout.LayoutParams(-1, -2);
        noteLp.setMargins(0, dp(14), 0, 0);
        content.addView(note, noteLp);
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

    private void renderProfile() {
        content.removeAllViews();
        addSectionTitle("Profile");
        content.addView(text("Native profile foundation", 16, TEXT, Typeface.BOLD));
        addInfoBlock("Account, username, linked devices, export/import, and delete account are already available in Classic mode. Native profile migration comes next.");
        Button classic = pillButton("Open Classic Settings", true);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, dp(54));
        lp.setMargins(0, dp(16), 0, 0);
        content.addView(classic, lp);
        classic.setOnClickListener(v -> startActivity(new Intent(this, MainActivity.class)));
    }

    private void renderLibraryNote() {
        content.removeAllViews();
        addSectionTitle("Library");
        addInfoBlock("Native library sync is the next step. For now, use Classic mode for full watch progress, export/import, and account recovery while native screens are being migrated.");
        Button classic = pillButton("Open Classic Library", true);
        content.addView(classic, new LinearLayout.LayoutParams(-1, dp(54)));
        classic.setOnClickListener(v -> startActivity(new Intent(this, MainActivity.class)));
    }

    private void renderComingNative(String msg) {
        content.removeAllViews();
        addSectionTitle("Native migration");
        addInfoBlock(msg);
        Button back = pillButton("Back Home", true);
        content.addView(back, new LinearLayout.LayoutParams(-1, dp(54)));
        back.setOnClickListener(v -> loadHome());
    }

    private void renderError(String msg) {
        setLoading(false);
        addInfoBlock(msg);
    }

    private void addInfoBlock(String msg) {
        TextView box = text(msg, 14, Color.rgb(225, 228, 236), Typeface.NORMAL);
        box.setPadding(dp(16), dp(16), dp(16), dp(16));
        box.setBackground(round(Color.argb(115, 255, 255, 255), 22, Color.argb(40, 255, 255, 255), 1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(0, dp(14), 0, dp(14));
        content.addView(box, lp);
    }

    private void addSectionTitle(String label) {
        TextView t = text(label, 24, TEXT, Typeface.BOLD);
        content.addView(t);
    }

    private void setLoading(boolean loading) {
        if (loader != null) loader.setVisibility(loading ? View.VISIBLE : View.GONE);
    }

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

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    static class NativeMedia {
        String id;
        String kind;
        String title;
        String overview;
        int year;
        double rating;
        int seasons;
        int episodes;

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

        String typeLabel() {
            if ("tv".equals(kind)) return "Series";
            if ("anime".equals(kind)) return "Anime";
            return "Movie";
        }

        String yearText() {
            return year > 0 ? String.valueOf(year) : "Year N/A";
        }

        String ratingText() {
            return rating > 0 ? String.format("%.1f", rating) : "Rating N/A";
        }
    }
}
