package com.watchvault.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int WATCHVAULT_SYSTEM_BAR_COLOR = Color.rgb(7, 10, 12);
    private ActivityResultLauncher<String> notificationPermissionLauncher;
    private String pendingNotificationCallbackId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        notificationPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                isGranted -> dispatchNotificationPermissionResult(isGranted)
        );
        configureSystemBars();
        configureWebPermissions();
        configureNotificationBridge();
        configureBackNavigation();
    }

    @Override
    protected void onResume() {
        super.onResume();
        configureSystemBars();
    }

    private void configureBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    return;
                }

                getBridge().getWebView().evaluateJavascript(
                        "window.__watchvaultShouldExit=false;" +
                                "window.dispatchEvent(new CustomEvent('watchvault:native-back'));" +
                                "window.__watchvaultShouldExit===true;",
                        shouldExit -> {
                            if ("true".equals(shouldExit)) {
                                setEnabled(false);
                                getOnBackPressedDispatcher().onBackPressed();
                            }
                        }
                );
            }
        });
    }

    private void configureWebPermissions() {
        if (getBridge() == null || getBridge().getWebView() == null) return;

        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }

    private void configureNotificationBridge() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        getBridge().getWebView().addJavascriptInterface(new NativeNotificationBridge(), "WatchVaultNativeNotifications");
    }

    private String getNotificationPermissionState() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return "granted";
        }
        return ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
                ? "granted"
                : "prompt";
    }

    private void requestNativeNotificationPermission(String callbackId) {
        pendingNotificationCallbackId = callbackId;

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            dispatchNotificationPermissionResult(true);
            return;
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            dispatchNotificationPermissionResult(true);
            return;
        }

        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
    }

    private void dispatchNotificationPermissionResult(boolean enabled) {
        if (pendingNotificationCallbackId == null || getBridge() == null || getBridge().getWebView() == null) return;

        String callbackId = pendingNotificationCallbackId;
        pendingNotificationCallbackId = null;
        String state = enabled ? "granted" : "denied";
        String script = "window.__watchvaultNotificationCallbacks && " +
                "window.__watchvaultNotificationCallbacks['" + escapeJs(callbackId) + "'] && " +
                "window.__watchvaultNotificationCallbacks['" + escapeJs(callbackId) + "'](" + enabled + ", '" + state + "');";

        runOnUiThread(() -> getBridge().getWebView().evaluateJavascript(script, null));
    }

    private String escapeJs(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("'", "\\'");
    }

    public class NativeNotificationBridge {
        @JavascriptInterface
        public String getPermissionState() {
            return getNotificationPermissionState();
        }

        @JavascriptInterface
        public void requestPermission(String callbackId) {
            runOnUiThread(() -> requestNativeNotificationPermission(callbackId));
        }
    }

    private void configureSystemBars() {
        Window window = getWindow();
        window.setStatusBarColor(WATCHVAULT_SYSTEM_BAR_COLOR);
        window.setNavigationBarColor(WATCHVAULT_SYSTEM_BAR_COLOR);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
            window.setStatusBarContrastEnforced(false);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.getAttributes().layoutInDisplayCutoutMode =
                    android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        window.getDecorView().setSystemUiVisibility(flags);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        }
    }
}