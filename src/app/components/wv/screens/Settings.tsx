import { ArrowLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useLiveData } from "../../../services/liveData";
import { apiService } from "../../../services/api";
import { CURRENT_APP_VERSION, checkForAppUpdate, openUpdateUrl, type AppUpdateInfo } from "../../../services/appUpdate";
import { reminderPermissionLabel, requestReminderPermission } from "../../../services/notifications";
import { clearProfileImage, pickProfileImageFile, setProfileImage, useProfileImage } from "../../../services/profileImage";
import { CONTENT_TYPES, LANGUAGES, REGIONS, usePrefs } from "../prefs";

type SettingsPage = "main" | "profile" | "region" | "languages" | "content" | "updates" | "about";
type SheetMode = null | "username" | "recover" | "import" | "export" | "devices" | "delete" | "profileImage" | "clearPrefs";

type DeviceInfo = { id?: string; current?: boolean; firstSeenAt?: string | null; lastSeenAt?: string | null };

declare global {
  interface Window {
    WatchVaultAndroid?: { startUpdate?: (url: string) => void };
  }
}

export function SettingsScreen({ onBack, theme, setTheme }: { onBack: () => void; theme: "light" | "dark" | "amoled"; setTheme: (t: "light" | "dark" | "amoled") => void }) {
  const { refresh } = useLiveData();
  const { prefs, update, reset } = usePrefs();
  const profileImage = useProfileImage();
  const [page, setPage] = useState<SettingsPage>("main");
  const [message, setMessage] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [inputValue, setInputValue] = useState("");
  const [backupText, setBackupText] = useState("");
  const [devices, setDevices] = useState<{ linkedDevices: number; maxDevices: number; devices: DeviceInfo[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 4200);
  };

  const openSheet = (mode: SheetMode, value = "") => {
    setInputValue(value);
    setSheet(mode);
  };

  const closeSheet = () => {
    setSheet(null);
    setInputValue("");
    setBackupText("");
    setBusy(false);
  };

  const toggleReminders = async () => {
    if (prefs.remindersEnabled) {
      update({ remindersEnabled: false });
      showMessage("Release reminders are turned off. You can turn them on anytime here.");
      return;
    }
    const result = await requestReminderPermission();
    update({ remindersEnabled: result.enabled });
    showMessage(result.message);
  };

  const checkUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const info = await checkForAppUpdate();
      setUpdateInfo(info);
      showMessage(info.updateAvailable ? "New update is available." : "You are using the latest version.");
    } catch {
      showMessage("Could not check for updates right now.");
    } finally {
      setCheckingUpdate(false);
    }
  };

  const startAppUpdate = (url: string) => {
    if (window.WatchVaultAndroid?.startUpdate) {
      window.WatchVaultAndroid.startUpdate(url);
      showMessage("Downloading update inside WatchVault...");
      return;
    }
    openUpdateUrl(url);
  };

  const copyText = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage(success);
    } catch {
      showMessage("Copy is not available on this device. Use Download instead.");
    }
  };

  const copyUserId = () => void copyText(prefs.userId, "User ID copied. Use it on another device to recover progress.");

  const setAccountUsername = async () => {
    if (!inputValue.trim()) {
      showMessage("Enter a username first.");
      return;
    }
    setBusy(true);
    try {
      const result = await apiService.updateUserProfile(inputValue.trim());
      showMessage(`Username saved: @${result.username}`);
      closeSheet();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Could not save username.");
      setBusy(false);
    }
  };

  const prepareUsernameSheet = async () => {
    try {
      const current = await apiService.getUserProfile();
      openSheet("username", current.username || prefs.name || "");
    } catch {
      openSheet("username", prefs.name || "");
    }
  };

  const checkLinkedDevices = async () => {
    setBusy(true);
    try {
      const result = await apiService.getUserDevices();
      setDevices({ linkedDevices: result.linkedDevices || 0, maxDevices: result.maxDevices || 5, devices: result.devices || [] });
      setSheet("devices");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Could not check linked devices.");
    } finally {
      setBusy(false);
    }
  };

  const updateProfileImageFromSheet = async (mode: "file" | "url" | "remove") => {
    if (mode === "remove") {
      clearProfileImage();
      showMessage("Profile image removed.");
      closeSheet();
      return;
    }
    if (mode === "url") {
      if (!inputValue.trim()) {
        showMessage("Paste an image URL first.");
        return;
      }
      setProfileImage(inputValue.trim());
      showMessage("Profile image URL saved on this device.");
      closeSheet();
      return;
    }
    const image = await pickProfileImageFile();
    if (!image) {
      showMessage("Could not add profile image.");
      return;
    }
    setProfileImage(image);
    showMessage("Profile image compressed to WebP and saved on this device.");
    closeSheet();
  };

  const exportProgress = async () => {
    setBusy(true);
    try {
      const backup = await apiService.exportUserData();
      setBackupText(JSON.stringify(backup, null, 2));
      setSheet("export");
    } catch {
      showMessage("Could not export progress right now.");
    } finally {
      setBusy(false);
    }
  };

  const downloadBackup = () => {
    if (!backupText) return;
    const blob = new Blob([backupText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `watchvault-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage("Backup file download started. Choose/save it from your device downloads.");
  };

  const importProgress = async () => {
    if (!inputValue.trim()) {
      showMessage("Paste backup JSON first.");
      return;
    }
    setBusy(true);
    try {
      const result = await apiService.importUserData(JSON.parse(inputValue));
      await refresh();
      showMessage(`Imported ${result.imported || 0} progress items.`);
      closeSheet();
    } catch {
      showMessage("Could not import backup. Make sure the JSON is correct.");
      setBusy(false);
    }
  };

  const recoverAccount = async () => {
    if (!inputValue.trim()) {
      showMessage("Paste your WatchVault User ID first.");
      return;
    }
    setBusy(true);
    try {
      const result = await apiService.recoverUserData(inputValue.trim());
      if (!result.found) {
        showMessage("No saved progress found for that User ID.");
        setBusy(false);
        return;
      }
      update({ userId: result.userId });
      await refresh();
      showMessage(`Recovered ${result.itemCount || 0} saved items. This device is now using that account.`);
      closeSheet();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not recover account.";
      showMessage(text.includes("Device limit") ? "This account is already linked to 5 devices." : text);
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (inputValue !== "DELETE") {
      showMessage("Type DELETE exactly to confirm account deletion.");
      return;
    }
    setBusy(true);
    try {
      await apiService.deleteUserAccount();
      reset();
      window.localStorage.removeItem("watchvault:prefs");
      window.localStorage.removeItem("watchvault:device-id");
      clearProfileImage();
      showMessage("Account deleted. Restarting with a new local profile...");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Could not delete account.");
      setBusy(false);
    }
  };

  const clearSavedPreferences = () => openSheet("clearPrefs");

  const confirmClearPrefs = () => {
    reset();
    window.localStorage.removeItem("watchvault:prefs");
    showMessage("Saved preferences cleared. Restarting...");
    window.setTimeout(() => window.location.reload(), 700);
  };

  const titleMap: Record<SettingsPage, string> = { main: "Settings", profile: "Profile", region: "Region", languages: "Languages", content: "Content", updates: "App Update", about: "About" };
  const languageSummary = prefs.languages.length ? prefs.languages.join(", ") : "None selected";
  const contentSummary = prefs.contentTypes.length ? prefs.contentTypes.join(", ") : "None selected";
  const latestVersion = updateInfo?.latestVersion || "Check now";

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="px-5 pt-12 flex items-center gap-3">
        <button onClick={() => (page === "main" ? onBack() : setPage("main"))} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center" aria-label="Go back">
          <ArrowLeft size={16} className="text-[#111] dark:text-white" />
        </button>
        <div className="text-[#111] dark:text-white" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{titleMap[page]}</div>
      </div>

      {page === "main" && (
        <>
          <Section title="Theme">
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "amoled"] as const).map((t) => (
                <button key={t} onClick={() => setTheme(t)} className={`p-3 capitalize ${theme === t ? "bg-[#111] text-white dark:bg-white dark:text-black" : "bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"}`} style={{ borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{t}</button>
              ))}
            </div>
          </Section>

          <SettingsGroup title="Preferences">
            <Row label="Profile name" value={prefs.name || "Not set"} onClick={() => setPage("profile")} />
            <Row label="Profile image" value={profileImage ? "Change" : "Add"} onClick={() => openSheet("profileImage")} />
            <Row label="Default region" value={prefs.regionName} onClick={() => setPage("region")} />
            <Row label="Preferred languages" value={languageSummary} onClick={() => setPage("languages")} />
            <Row label="Content types" value={contentSummary} onClick={() => setPage("content")} />
            <SwitchRow label="Release reminders" value={reminderPermissionLabel(prefs.remindersEnabled)} active={prefs.remindersEnabled} onClick={() => void toggleReminders()} />
          </SettingsGroup>

          <SettingsGroup title="Account & progress">
            <Row label="Account username" value="Set" onClick={() => void prepareUsernameSheet()} />
            <Row label="Check linked devices" value={busy ? "Loading" : "Max 5"} onClick={() => void checkLinkedDevices()} />
            <Row label="WatchVault User ID" value="Copy" onClick={copyUserId} />
            <Row label="Recover on this device" value="User ID" onClick={() => openSheet("recover", prefs.userId)} />
            <Row label="Export progress backup" value="Save" onClick={() => void exportProgress()} />
            <Row label="Import progress backup" value="Paste" onClick={() => openSheet("import")} />
            <Row label="Delete account" value="Permanent" onClick={() => openSheet("delete")} danger />
          </SettingsGroup>

          <Section title="Device limit">
            <div className="p-4 rounded-3xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#9A9A9A]" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Use the same WatchVault User ID on up to 5 devices. Backups can be copied or saved as a JSON file. Profile images are compressed to WebP and saved on this device.
            </div>
          </Section>

          <SettingsGroup title="App">
            <Row label="App update" value={latestVersion} onClick={() => setPage("updates")} />
            <Row label="Refresh content" value="Now" onClick={() => refresh().then(() => showMessage("Latest content loaded."))} />
            <Row label="Clear saved preferences" value="Reset" onClick={clearSavedPreferences} danger />
            <Row label="About WatchVault" value={`v${CURRENT_APP_VERSION}`} onClick={() => setPage("about")} />
          </SettingsGroup>
        </>
      )}

      {page === "profile" && (
        <Section title="Profile name">
          <input value={prefs.name} onChange={(e) => update({ name: e.target.value })} className="w-full p-4 rounded-3xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white" placeholder="Enter your name" />
          <p className="mt-3 text-[#888]" style={{ fontSize: 13, lineHeight: 1.5 }}>This name is used across Home and Profile. Account username is separate and must be unique.</p>
        </Section>
      )}

      {page === "region" && <SettingsGroup title="Select region">{REGIONS.map((region) => <SwitchRow key={region.code} label={region.name} value={prefs.regionCode === region.code ? "On" : "Off"} active={prefs.regionCode === region.code} onClick={() => update({ regionCode: region.code, regionName: region.name })} />)}</SettingsGroup>}
      {page === "languages" && <SettingsGroup title="Preferred languages">{LANGUAGES.map((language) => { const active = prefs.languages.includes(language); return <SwitchRow key={language} label={language} value={active ? "On" : "Off"} active={active} onClick={() => update({ languages: active ? prefs.languages.filter((l) => l !== language) : [...prefs.languages, language] })} />; })}</SettingsGroup>}
      {page === "content" && <SettingsGroup title="Content types">{CONTENT_TYPES.map((type) => { const active = prefs.contentTypes.includes(type); return <SwitchRow key={type} label={type} value={active ? "On" : "Off"} active={active} onClick={() => update({ contentTypes: active ? prefs.contentTypes.filter((t) => t !== type) : [...prefs.contentTypes, type] })} />; })}</SettingsGroup>}

      {page === "updates" && (
        <Section title="Update status">
          <div className="p-5 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 26 }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 800 }}>WatchVault</div>
                <div className="text-[#666666] mt-1" style={{ fontSize: 12 }}>Current version: v{CURRENT_APP_VERSION}</div>
                <div className="text-[#666666]" style={{ fontSize: 12 }}>Latest version: {updateInfo?.latestVersion ? `v${updateInfo.latestVersion}` : "Not checked"}</div>
              </div>
              <div className={`px-3 py-1.5 rounded-full ${updateInfo?.updateAvailable ? "bg-[#D9A441]/20 text-[#D9A441]" : "bg-white/10 text-[#666666]"}`} style={{ fontSize: 11, fontWeight: 800 }}>{updateInfo?.updateAvailable ? "Update ready" : "Up to date"}</div>
            </div>
            {updateInfo?.notes && <div className="mt-4 p-3 rounded-2xl bg-[#F6F6F6] dark:bg-[#1A1A1A] text-[#666666] whitespace-pre-line" style={{ fontSize: 12, lineHeight: 1.5 }}>{updateInfo.notes.slice(0, 500)}</div>}
            <button onClick={() => void checkUpdates()} disabled={checkingUpdate} className="mt-4 w-full py-3 rounded-full bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ fontSize: 13, fontWeight: 800 }}><RefreshCw size={15} /> {checkingUpdate ? "Checking..." : "Check for Update"}</button>
            {updateInfo?.updateAvailable && updateInfo.apkUrl && <button onClick={() => startAppUpdate(updateInfo.apkUrl!)} className="mt-3 w-full py-3 rounded-full bg-[#D9A441] text-black flex items-center justify-center gap-2" style={{ fontSize: 13, fontWeight: 900 }}><Download size={15} /> Update Now</button>}
          </div>
        </Section>
      )}

      {page === "about" && <Section title="About WatchVault"><div className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]" style={{ borderRadius: 20, fontSize: 12, lineHeight: 1.6 }}>WatchVault tracks movies, series, anime, release dates, legal watch options, and watch progress. It does not stream content or provide pirated links.</div></Section>}
      <ActionSheet sheet={sheet} inputValue={inputValue} setInputValue={setInputValue} busy={busy} onClose={closeSheet} onUsername={setAccountUsername} onRecover={recoverAccount} onImport={importProgress} onCopyBackup={() => void copyText(backupText, "Backup copied to clipboard.")} onDownloadBackup={downloadBackup} backupText={backupText} devices={devices} onDelete={deleteAccount} onClearPrefs={confirmClearPrefs} onProfileFile={() => void updateProfileImageFromSheet("file")} onProfileUrl={() => void updateProfileImageFromSheet("url")} onProfileRemove={() => void updateProfileImageFromSheet("remove")} profileImage={profileImage} />
      {message && <div className="fixed left-5 right-5 bottom-28 z-50 p-3 rounded-2xl bg-[#D9A441] text-black shadow-xl" style={{ fontSize: 13, fontWeight: 800 }}>{message}</div>}
    </div>
  );
}

function ActionSheet({ sheet, inputValue, setInputValue, busy, onClose, onUsername, onRecover, onImport, onCopyBackup, onDownloadBackup, backupText, devices, onDelete, onClearPrefs, onProfileFile, onProfileUrl, onProfileRemove, profileImage }: any) {
  if (!sheet) return null;
  const title: Record<string, string> = { username: "Account username", recover: "Recover account", import: "Import backup", export: "Export backup", devices: "Linked devices", delete: "Delete account", profileImage: "Profile image", clearPrefs: "Clear preferences" };
  const desc: Record<string, string> = {
    username: "Choose a unique username. Use letters, numbers, underscore, or dot.",
    recover: "Paste your WatchVault User ID from another device to use the same account here.",
    import: "Paste your WatchVault backup JSON here. This restores your saved progress.",
    export: "Save this backup before uninstalling or moving devices. You can copy it or download a JSON file.",
    devices: "These devices are linked to this WatchVault User ID. Maximum 5 devices are allowed.",
    delete: "This permanently deletes backend progress, devices, username, and account data. Type DELETE to confirm.",
    profileImage: "Choose, paste a URL, or remove your profile image. Uploaded images are compressed to WebP on this device.",
    clearPrefs: "This clears only local preferences from this device. Backend progress is not deleted.",
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full mx-3 mb-3 bg-[#111111] border border-white/12 shadow-2xl text-white" style={{ borderRadius: 30 }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-3" />
        <div className="p-5">
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.4 }}>{title[sheet]}</div>
          <div className="mt-2 text-white/60" style={{ fontSize: 13, lineHeight: 1.55 }}>{desc[sheet]}</div>

          {(sheet === "username" || sheet === "recover" || sheet === "delete") && <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="mt-4 w-full rounded-2xl bg-white/8 border border-white/12 px-4 py-3 text-white outline-none" style={{ fontSize: 14 }} placeholder={sheet === "delete" ? "Type DELETE" : sheet === "recover" ? "WatchVault User ID" : "username"} />}
          {sheet === "import" && <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="mt-4 w-full h-36 rounded-2xl bg-white/8 border border-white/12 px-4 py-3 text-white outline-none resize-none" style={{ fontSize: 12, lineHeight: 1.5 }} placeholder="Paste backup JSON here" />}
          {sheet === "profileImage" && <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="mt-4 w-full rounded-2xl bg-white/8 border border-white/12 px-4 py-3 text-white outline-none" style={{ fontSize: 14 }} placeholder="Optional image URL" />}
          {sheet === "export" && <textarea value={backupText} readOnly className="mt-4 w-full h-32 rounded-2xl bg-white/8 border border-white/12 px-4 py-3 text-white/75 outline-none resize-none" style={{ fontSize: 11, lineHeight: 1.5 }} />}
          {sheet === "devices" && <div className="mt-4 space-y-2">{(devices?.devices || []).map((device: DeviceInfo, index: number) => <div key={index} className="p-3 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-between"><div><div style={{ fontSize: 13, fontWeight: 800 }}>{device.current ? "This device" : `Device ${index + 1}`}</div><div className="text-white/50" style={{ fontSize: 11 }}>{device.id || "Unknown"}</div></div><div className="text-[#D9A441]" style={{ fontSize: 11, fontWeight: 800 }}>{device.current ? "Current" : "Linked"}</div></div>)}{!devices?.devices?.length && <div className="p-3 rounded-2xl bg-white/8 text-white/60" style={{ fontSize: 13 }}>No linked devices found.</div>}<div className="text-white/50 pt-1" style={{ fontSize: 12 }}>{devices?.linkedDevices || 0}/{devices?.maxDevices || 5} devices linked</div></div>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-3 rounded-full bg-white/8 border border-white/12 text-white" style={{ fontSize: 13, fontWeight: 900 }}>Cancel</button>
            {sheet === "username" && <button disabled={busy} onClick={onUsername} className="py-3 rounded-full bg-[#D9A441] text-black disabled:opacity-50" style={{ fontSize: 13, fontWeight: 900 }}>Save</button>}
            {sheet === "recover" && <button disabled={busy} onClick={onRecover} className="py-3 rounded-full bg-[#D9A441] text-black disabled:opacity-50" style={{ fontSize: 13, fontWeight: 900 }}>Recover</button>}
            {sheet === "import" && <button disabled={busy} onClick={onImport} className="py-3 rounded-full bg-[#D9A441] text-black disabled:opacity-50" style={{ fontSize: 13, fontWeight: 900 }}>Import</button>}
            {sheet === "delete" && <button disabled={busy} onClick={onDelete} className="py-3 rounded-full bg-red-500 text-white disabled:opacity-50" style={{ fontSize: 13, fontWeight: 900 }}>Delete</button>}
            {sheet === "clearPrefs" && <button onClick={onClearPrefs} className="py-3 rounded-full bg-red-500 text-white" style={{ fontSize: 13, fontWeight: 900 }}>Clear</button>}
            {sheet === "devices" && <button onClick={onClose} className="py-3 rounded-full bg-[#D9A441] text-black" style={{ fontSize: 13, fontWeight: 900 }}>Done</button>}
            {sheet === "export" && <button onClick={onDownloadBackup} className="py-3 rounded-full bg-[#D9A441] text-black" style={{ fontSize: 13, fontWeight: 900 }}>Download</button>}
            {sheet === "profileImage" && <button onClick={onProfileFile} className="py-3 rounded-full bg-[#D9A441] text-black" style={{ fontSize: 13, fontWeight: 900 }}>{profileImage ? "Change" : "Choose"}</button>}
          </div>

          {sheet === "export" && <button onClick={onCopyBackup} className="mt-3 w-full py-3 rounded-full bg-white text-black" style={{ fontSize: 13, fontWeight: 900 }}>Copy Backup</button>}
          {sheet === "profileImage" && <div className="mt-3 grid grid-cols-2 gap-3"><button onClick={onProfileUrl} className="py-3 rounded-full bg-white text-black" style={{ fontSize: 13, fontWeight: 900 }}>Save URL</button><button onClick={onProfileRemove} className="py-3 rounded-full bg-red-500 text-white" style={{ fontSize: 13, fontWeight: 900 }}>Remove</button></div>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="px-5 mt-5"><div className="text-[#666666] mb-2 px-1" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>{title}</div>{children}</div>;
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <Section title={title}><div className="bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] overflow-hidden" style={{ borderRadius: 24 }}>{children}</div></Section>;
}

function Row({ label, value, onClick, danger }: { label: string; value?: string; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 border-b last:border-b-0 border-[#E5E5E5] dark:border-[#2A2A2A] text-left"><span className={danger ? "text-red-500" : "text-[#111] dark:text-white"} style={{ fontSize: 14, fontWeight: 650 }}>{label}</span><div className="flex items-center gap-2 min-w-0">{value && <span className="text-[#777] truncate max-w-[150px]" style={{ fontSize: 13 }}>{value}</span>}<ChevronRight size={15} className="text-[#666666] flex-shrink-0" /></div></button>;
}

function SwitchRow({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-4 border-b last:border-b-0 border-[#E5E5E5] dark:border-[#2A2A2A] text-left"><span className="text-[#111] dark:text-white" style={{ fontSize: 14, fontWeight: 650 }}>{label}</span><div className="flex items-center gap-3"><span className="text-[#777]" style={{ fontSize: 13 }}>{value}</span><span className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${active ? "bg-[#D9A441]" : "bg-[#2A2A2A] border border-white/10"}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${active ? "translate-x-6" : "translate-x-1"}`} /></span></div></button>;
}
