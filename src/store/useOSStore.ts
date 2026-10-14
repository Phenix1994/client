// client/src/store/useOSStore.ts
import { create } from "zustand";
import * as signalR from "@microsoft/signalr";

export type AppCategory = "security" | "cracking" | "file" | "logs";
export type AppType =
  | "password_breaker"
  | "file_copier"
  | "file_deleter"
  | "log_deleter"
  | "monitor_bypass"
  | "proxy_bypass";

export interface WorldNode {
  ip: string;
  computerName: string;
  coordinates: { x: number; y: number };
}

export interface RunningAppInstance {
  id: string;
  appType: AppType;
  name: string;
  category: AppCategory;
  cpuShare: number;
  progress: number;
  status: "awaiting_target" | "running" | "completed" | "active_bypass";
  targetId?: string;
  targetLabel?: string;
  difficultyCost: number;
  x: number;
  y: number;
}

interface OSState {
  hubConnection: signalR.HubConnection | null;
  currentIp: string;
  gameSpeed: 0 | 1 | 2 | 4;
  runningApps: RunningAppInstance[];
  selectingAppId: string | null;
  crackedIps: string[];
  downloadedFiles: { filename: string; size: number }[];
  deletedLogIndices: Record<string, number[]>;
  deletedFilenames: Record<string, string[]>;

  worldNodes: WorldNode[];
  bounceChain: string[];
  isTraceActive: boolean;
  traceProgress: number;
  tracedDisconnectMessage: string | null; // Shown with OK button when trace reaches 100%
  systemAlert: string | null;

  initSignalR: () => void;
  connectToIp: (ip: string, isMonitorDisabledOnServer?: boolean) => void;
  disconnectFromIp: () => void;
  acknowledgeTraceDisconnect: () => void;
  notifyBackendLoginSuccess: () => void;

  setWorldNodes: (nodes: WorldNode[]) => void;
  toggleBounceNode: (ip: string) => void;
  clearBounceChain: () => void;
  setSystemAlert: (msg: string | null) => void;

  setGameSpeed: (speed: 0 | 1 | 2 | 4) => void;
  launchApp: (appType: AppType, name: string, category: AppCategory) => void;
  closeApp: (id: string) => void;
  adjustCpu: (id: string, delta: number) => void;
  updateAppPosition: (id: string, x: number, y: number) => void;
  assignTargetToApp: (
    targetId: string,
    targetLabel: string,
    difficultyCost?: number,
    serverSecurity?: { type: string; isEnabled: boolean }[],
  ) => void;
  tickCpu: (deltaSeconds: number) => void;
}

const rebalanceCpu = (apps: RunningAppInstance[]): RunningAppInstance[] => {
  if (apps.length === 0) return [];
  const equalShare = Math.floor(100 / apps.length);
  return apps.map((a) => ({ ...a, cpuShare: equalShare }));
};

export const useOSStore = create<OSState>((set, get) => ({
  hubConnection: null,
  currentIp: "127.0.0.1",
  gameSpeed: 1,
  runningApps: [],
  selectingAppId: null,
  crackedIps: [],
  downloadedFiles: [],
  deletedLogIndices: {},
  deletedFilenames: {},

  worldNodes: [],
  bounceChain: [],
  isTraceActive: false,
  traceProgress: 0,
  tracedDisconnectMessage: null,
  systemAlert: null,

  initSignalR: () => {
    if (get().hubConnection) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/phoenix")
      .withAutomaticReconnect()
      .build();

    connection.on("TraceStarted", (reason: string) => {
      set({ isTraceActive: true, systemAlert: `TRACE ALERT: ${reason}` });
    });

    connection.on("TraceTick", (progress: number) => {
      set({ isTraceActive: true, traceProgress: progress });
    });

    connection.on("TraceCompleted", (tracedServerIp: string) => {
      // Force disconnect and display the Disconnected Modal instead of server menu
      set((state) => ({
        currentIp: "127.0.0.1",
        isTraceActive: false,
        traceProgress: 0,
        selectingAppId: null,
        runningApps: state.runningApps.filter((a) => a.category === "file"),
        tracedDisconnectMessage: `Connection terminated by remote host (${tracedServerIp}). Active trace completed against your gateway.`,
      }));
    });

    connection.start().catch((err) => console.error("SignalR Error:", err));
    set({ hubConnection: connection });
  },

  connectToIp: (ip, isMonitorDisabledOnServer = false) => {
    const { hubConnection, bounceChain, runningApps } = get();
    const isMonitorBypassed = runningApps.some(
      (a) => a.appType === "monitor_bypass",
    );

    set({
      currentIp: ip,
      isTraceActive: false,
      traceProgress: 0,
      tracedDisconnectMessage: null,
      systemAlert: null,
    });

    if (
      hubConnection?.state === signalR.HubConnectionState.Connected &&
      ip !== "127.0.0.1"
    ) {
      hubConnection.invoke(
        "StartConnection",
        ip,
        bounceChain.length,
        isMonitorDisabledOnServer || isMonitorBypassed,
      );
    }
  },

  disconnectFromIp: () => {
    const { hubConnection } = get();
    if (hubConnection?.state === signalR.HubConnectionState.Connected) {
      hubConnection.invoke("DisconnectFromServer");
    }
    set((state) => ({
      currentIp: "127.0.0.1",
      isTraceActive: false,
      traceProgress: 0,
      selectingAppId: null,
      systemAlert: null,
      runningApps: state.runningApps.filter((a) => a.category === "file"),
    }));
  },

  acknowledgeTraceDisconnect: () => set({ tracedDisconnectMessage: null }),

  notifyBackendLoginSuccess: () => {
    const { hubConnection } = get();
    if (hubConnection?.state === signalR.HubConnectionState.Connected) {
      hubConnection.invoke("NotifyLoginSuccess");
    }
  },

  setWorldNodes: (nodes) => set({ worldNodes: nodes }),

  toggleBounceNode: (ip) => {
    const chain = get().bounceChain;
    if (chain.includes(ip)) {
      set({ bounceChain: chain.filter((item) => item !== ip) });
    } else {
      set({ bounceChain: [...chain, ip] });
    }
  },

  clearBounceChain: () => set({ bounceChain: [] }),
  setSystemAlert: (msg) => set({ systemAlert: msg }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),

  launchApp: (appType, name, category) => {
    const existingCount = get().runningApps.length;
    const isBypass = category === "security";

    const newApp: RunningAppInstance = {
      id: `${appType}-${Date.now()}`,
      appType,
      name,
      category,
      cpuShare: 20,
      progress: isBypass ? 100 : 0,
      status: isBypass ? "active_bypass" : "awaiting_target",
      difficultyCost: 5,
      x: 360 + ((existingCount * 24) % 200),
      y: 90 + ((existingCount * 36) % 220),
    };

    const nextApps = rebalanceCpu([...get().runningApps, newApp]);
    set({
      runningApps: nextApps,
      selectingAppId: isBypass ? null : newApp.id,
    });

    // Notify backend immediately if Monitor_Bypass was launched
    if (appType === "monitor_bypass") {
      const { hubConnection } = get();
      if (hubConnection?.state === signalR.HubConnectionState.Connected) {
        hubConnection.invoke("SetMonitorBypass", true);
      }
    }
  },

  closeApp: (id) => {
    const closingApp = get().runningApps.find((a) => a.id === id);
    const filtered = get().runningApps.filter((a) => a.id !== id);
    set({
      runningApps: rebalanceCpu(filtered),
      selectingAppId: get().selectingAppId === id ? null : get().selectingAppId,
    });

    if (closingApp?.appType === "monitor_bypass") {
      const stillBypassed = filtered.some(
        (a) => a.appType === "monitor_bypass",
      );
      const { hubConnection } = get();
      if (hubConnection?.state === signalR.HubConnectionState.Connected) {
        hubConnection.invoke("SetMonitorBypass", stillBypassed);
      }
    }
  },

  adjustCpu: (id, delta) => {
    set((state) => ({
      runningApps: state.runningApps.map((app) =>
        app.id === id
          ? {
              ...app,
              cpuShare: Math.max(5, Math.min(100, app.cpuShare + delta)),
            }
          : app,
      ),
    }));
  },

  updateAppPosition: (id, x, y) => {
    set((state) => ({
      runningApps: state.runningApps.map((app) =>
        app.id === id ? { ...app, x, y } : app,
      ),
    }));
  },

  assignTargetToApp: (
    targetId,
    targetLabel,
    difficultyCost = 4,
    serverSecurity = [],
  ) => {
    const { selectingAppId, runningApps, hubConnection } = get();
    if (!selectingAppId) return;

    const activeApp = runningApps.find((a) => a.id === selectingAppId);
    if (!activeApp) return;

    // 1. Proxy Check
    const hasActiveProxy = serverSecurity.some(
      (s) => s.type === "Proxy" && s.isEnabled,
    );
    const isProxyBypassed = runningApps.some(
      (a) => a.appType === "proxy_bypass",
    );

    if (
      hasActiveProxy &&
      !isProxyBypassed &&
      (activeApp.appType === "file_deleter" ||
        activeApp.appType === "log_deleter")
    ) {
      set({
        selectingAppId: null,
        systemAlert:
          "PROXY ERROR: Remote Proxy blocked modification! Run Proxy_Bypass first.",
      });
      return;
    }

    // 2. Monitor Rule A: If starting Password Cracker, tell Backend!
    // Backend will start trace immediately if Monitor is NOT bypassed/disabled.
    if (activeApp.appType === "password_breaker") {
      const hasActiveMonitor = serverSecurity.some(
        (s) => s.type === "Monitor" && s.isEnabled,
      );
      const isMonitorBypassed = runningApps.some(
        (a) => a.appType === "monitor_bypass",
      );

      if (hubConnection?.state === signalR.HubConnectionState.Connected) {
        hubConnection.invoke(
          "SetMonitorBypass",
          !hasActiveMonitor || isMonitorBypassed,
        );
        hubConnection.invoke("NotifyCrackerStarted");
      }
    }

    set((state) => ({
      selectingAppId: null,
      runningApps: state.runningApps.map((app) =>
        app.id === selectingAppId
          ? {
              ...app,
              targetId,
              targetLabel,
              difficultyCost,
              status: "running",
              progress: 0,
            }
          : app,
      ),
    }));
  },

  tickCpu: (deltaSeconds) => {
    const {
      currentIp,
      gameSpeed,
      runningApps,
      crackedIps,
      downloadedFiles,
      deletedLogIndices,
      deletedFilenames,
    } = get();

    if (
      gameSpeed === 0 ||
      currentIp === "127.0.0.1" ||
      runningApps.length === 0
    )
      return;

    const updatedCracked = [...crackedIps];
    const updatedDownloads = [...downloadedFiles];
    const updatedLogs = { ...deletedLogIndices };
    const updatedFiles = { ...deletedFilenames };
    let appsChanged = false;

    const nextApps = runningApps.map((app) => {
      if (app.status !== "running") return app;
      appsChanged = true;

      const speedPerSec =
        ((app.cpuShare / 100) * gameSpeed * 120) /
        Math.max(1, app.difficultyCost);
      const nextProgress = Math.min(
        100,
        app.progress + speedPerSec * deltaSeconds,
      );

      if (nextProgress >= 100) {
        if (
          app.appType === "password_breaker" &&
          app.targetId &&
          !updatedCracked.includes(app.targetId)
        ) {
          updatedCracked.push(app.targetId);
        }
        if (app.appType === "file_copier" && app.targetId) {
          updatedDownloads.push({
            filename: app.targetId,
            size: app.difficultyCost,
          });
        }
        if (app.appType === "file_deleter" && app.targetId) {
          const list = updatedFiles[currentIp] || [];
          updatedFiles[currentIp] = [...list, app.targetId];
        }
        if (app.appType === "log_deleter" && app.targetId !== undefined) {
          const list = updatedLogs[currentIp] || [];
          updatedLogs[currentIp] = [...list, Number(app.targetId)];
        }
        return { ...app, progress: 100, status: "completed" as const };
      }

      return { ...app, progress: nextProgress };
    });

    if (appsChanged) {
      set({
        runningApps: nextApps.filter((a) => a.status !== "completed"),
        crackedIps: updatedCracked,
        downloadedFiles: updatedDownloads,
        deletedLogIndices: updatedLogs,
        deletedFilenames: updatedFiles,
      });
    }
  },
}));
