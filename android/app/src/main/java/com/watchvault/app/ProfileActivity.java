package com.watchvault.app;

import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class ProfileActivity extends AppCompatActivity {
    private static final String PREFS = "watchvault_native";
    private static final int BG = Color.rgb(255, 251, 254);
    private static final int SURFACE = Color.WHITE;
    private static final int PRIMARY = Color.rgb(103, 80, 164);
    private static final int ON_PRIMARY = Color.WHITE;
    private static final int TEXT = Color.rgb(29, 27, 32);
    private static final int MUTED = Color.rgb(73, 69, 79);
    private static final int OUTLINE = Color.rgb(202, 196, 208);
    private static final int ERROR = Color.rgb(179, 38, 30);

    private SharedPreferences prefs;
    private LinearLayout content;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        if (!prefs.contains("displayName")) prefs.edit().putString("displayName", "Frame Keeper").apply();
        setupBars();
        buildScreen();
    }

    private void setupBars() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(BG);
        window.setNavigationBarColor(BG);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(true);
    }

    private void buildScreen() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BG);

        ScrollView scroll = new ScrollView(this);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(dp(20), dp(50), dp(20), dp(28));
        scroll.addView(content);
        root.addView(scroll, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        content.addView(top, new LinearLayout.LayoutParams(-1, -2));

        Button back = button("‹", false);
        top.addView(back, new LinearLayout.LayoutParams(dp(54), dp(48)));
        back.setOnClickListener(v -> finish());

        TextView title = text("Profile", 28, TEXT, Typeface.BOLD);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(0, -2, 1);
        titleLp.setMargins(dp(12), 0, 0, 0);
        top.addView(title, titleLp);

        LinearLayout header = card();
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView avatar = text(initials(displayName()), 26, ON_PRIMARY, Typeface.BOLD);
        avatar.setGravity(Gravity.CENTER);
        avatar.setBackground(round(PRIMARY, 999, Color.TRANSPARENT, 0));
        LinearLayout.LayoutParams avatarLp = new LinearLayout.LayoutParams(dp(78), dp(78));
        avatarLp.setMargins(0, 0, dp(16), 0);
        header.addView(avatar, avatarLp);

        LinearLayout nameBox = new LinearLayout(this);
        nameBox.setOrientation(LinearLayout.VERTICAL);
        header.addView(nameBox, new LinearLayout.LayoutParams(0, -2, 1));
        nameBox.addView(text(displayName(), 21, TEXT, Typeface.BOLD));
        nameBox.addView(text("Your WatchVault profile", 13, MUTED, Typeface.NORMAL));

        menuRow("Edit profile", "Change name and profile label", this::editProfile);
        menuRow("Progress Import / Export", "Backup or restore watch progress", () -> toast("Backup screen coming next"));
        menuRow("Player Settings", "Trailer and playback preferences", () -> toast("Player settings coming next"));
        menuRow("Security", "Recovery and linked devices", () -> toast("Security screen coming next"));
        menuRow("Subtitle Settings", "Language preferences", () -> toast("Subtitle settings coming next"));
        menuRow("Help Center", "Support and app information", () -> toast("Help center coming next"));
        menuRow("Sign out", "Reset only this visible profile", this::confirmSignOut);

        setContentView(root);
    }

    private String displayName() {
        return prefs.getString("displayName", "Frame Keeper");
    }

    private void editProfile() {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setText(displayName());
        input.setHint("Display name");
        new AlertDialog.Builder(this)
                .setTitle("Edit profile")
                .setView(input)
                .setPositiveButton("Save", (dialog, which) -> {
                    String name = input.getText().toString().trim();
                    if (name.length() < 2) {
                        toast("Name is too short");
                        return;
                    }
                    prefs.edit().putString("displayName", name).apply();
                    buildScreen();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void confirmSignOut() {
        new AlertDialog.Builder(this)
                .setTitle("Sign out?")
                .setMessage("This only resets the visible profile name on this device.")
                .setPositiveButton("Sign out", (dialog, which) -> {
                    prefs.edit().putString("displayName", "Frame Keeper").apply();
                    buildScreen();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void menuRow(String title, String subtitle, Runnable action) {
        LinearLayout row = card();
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);

        TextView icon = text(iconFor(title), 22, title.equals("Sign out") ? ERROR : PRIMARY, Typeface.BOLD);
        icon.setGravity(Gravity.CENTER);
        row.addView(icon, new LinearLayout.LayoutParams(dp(44), dp(44)));

        LinearLayout labels = new LinearLayout(this);
        labels.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams labelLp = new LinearLayout.LayoutParams(0, -2, 1);
        labelLp.setMargins(dp(10), 0, dp(8), 0);
        row.addView(labels, labelLp);
        labels.addView(text(title, 16, title.equals("Sign out") ? ERROR : TEXT, Typeface.BOLD));
        labels.addView(text(subtitle, 12, MUTED, Typeface.NORMAL));

        TextView arrow = text("›", 30, MUTED, Typeface.BOLD);
        arrow.setGravity(Gravity.CENTER);
        row.addView(arrow, new LinearLayout.LayoutParams(dp(28), dp(44)));
        row.setOnClickListener(v -> action.run());
    }

    private LinearLayout card() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        card.setBackground(round(SURFACE, 20, OUTLINE, 1));
        card.setElevation(dp(1));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(0, dp(12), 0, 0);
        content.addView(card, lp);
        return card;
    }

    private Button button(String value, boolean filled) {
        Button b = new Button(this);
        b.setText(value);
        b.setAllCaps(false);
        b.setTextSize(18);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        b.setTextColor(filled ? ON_PRIMARY : PRIMARY);
        b.setBackground(round(filled ? PRIMARY : SURFACE, 999, filled ? Color.TRANSPARENT : OUTLINE, 1));
        return b;
    }

    private TextView text(String value, int sp, int color, int style) {
        TextView t = new TextView(this);
        t.setText(value == null || value.trim().isEmpty() ? "Not available" : value);
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

    private String initials(String value) {
        if (value == null || value.trim().isEmpty()) return "F";
        String[] parts = value.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }

    private String iconFor(String title) {
        if (title.startsWith("Edit")) return "☻";
        if (title.startsWith("Progress")) return "↔";
        if (title.startsWith("Player")) return "▷";
        if (title.startsWith("Security")) return "□";
        if (title.startsWith("Subtitle")) return "▭";
        if (title.startsWith("Help")) return "i";
        return "↪";
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void toast(String value) {
        Toast.makeText(this, value, Toast.LENGTH_SHORT).show();
    }
}
