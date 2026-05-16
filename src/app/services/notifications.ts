export type ReminderPermissionResult = {
  enabled: boolean;
  message: string;
};

export async function requestReminderPermission(): Promise<ReminderPermissionResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return {
      enabled: false,
      message: "Notifications are not supported on this device or browser.",
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
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "denied") return "Blocked";
    if (Notification.permission === "granted") return enabled ? "On" : "Allowed, off";
  }
  return enabled ? "On" : "Off";
}
