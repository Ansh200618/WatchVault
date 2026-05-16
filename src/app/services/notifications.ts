export type ReminderPermissionResult = {
  enabled: boolean;
  message: string;
};

declare global {
  interface Window {
    WatchVaultNativeNotifications?: {
      requestPermission: (callbackId: string) => void;
      getPermissionState?: () => string;
    };
    __watchvaultNotificationCallbacks?: Record<string, (enabled: boolean, state?: string) => void>;
  }
}

function isNativeAndroidNotificationsAvailable() {
  return typeof window !== "undefined" && typeof window.WatchVaultNativeNotifications?.requestPermission === "function";
}

function nativePermissionState() {
  if (typeof window === "undefined") return null;
  try {
    return window.WatchVaultNativeNotifications?.getPermissionState?.() ?? null;
  } catch {
    return null;
  }
}

function requestNativeAndroidPermission(): Promise<ReminderPermissionResult> {
  return new Promise((resolve) => {
    if (!isNativeAndroidNotificationsAvailable()) {
      resolve({ enabled: false, message: "Native notifications are not available yet." });
      return;
    }

    const callbackId = `wv_notify_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.__watchvaultNotificationCallbacks = window.__watchvaultNotificationCallbacks || {};

    const timeout = window.setTimeout(() => {
      delete window.__watchvaultNotificationCallbacks?.[callbackId];
      resolve({ enabled: false, message: "Notification permission request timed out. Try again from Settings." });
    }, 15000);

    window.__watchvaultNotificationCallbacks[callbackId] = (enabled, state) => {
      window.clearTimeout(timeout);
      delete window.__watchvaultNotificationCallbacks?.[callbackId];

      if (enabled) {
        resolve({ enabled: true, message: "Release reminders are enabled." });
        return;
      }

      if (state === "denied") {
        resolve({ enabled: false, message: "Notifications were denied. Enable them from Android app settings to use reminders." });
        return;
      }

      resolve({ enabled: false, message: "Reminder permission was not enabled. You can turn it on later in Settings." });
    };

    window.WatchVaultNativeNotifications?.requestPermission(callbackId);
  });
}

export async function requestReminderPermission(): Promise<ReminderPermissionResult> {
  if (isNativeAndroidNotificationsAvailable()) {
    return requestNativeAndroidPermission();
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return {
      enabled: false,
      message: "Notifications are not supported in this browser. In the Android app, reminders use Android notification permission.",
    };
  }

  if (Notification.permission === "granted") {
    return {
      enabled: true,
      message: "Release reminders are enabled.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      enabled: false,
      message: "Notifications are blocked. Enable them from your browser/app settings first.",
    };
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    return {
      enabled: true,
      message: "Release reminders are enabled.",
    };
  }

  if (permission === "denied") {
    return {
      enabled: false,
      message: "Notifications were denied, so reminders remain off.",
    };
  }

  return {
    enabled: false,
    message: "Reminder permission was not enabled. You can turn it on later in Settings.",
  };
}

export function reminderPermissionLabel(enabled: boolean) {
  const nativeState = nativePermissionState();
  if (nativeState === "granted") return enabled ? "On" : "Allowed, off";
  if (nativeState === "denied") return "Blocked";

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "denied") return "Blocked";
    if (Notification.permission === "granted") return enabled ? "On" : "Allowed, off";
  }
  return enabled ? "On" : "Off";
}