// client/src/components/ServerViewport.tsx
import React, { useEffect, useState } from "react";
import { useOSStore } from "../store/useOSStore";

// --- Frontend Mirror of C# Polymorphic Models ---
export interface ServerLinkItem {
  ip: string;
  computerName: string;
}

export interface InternalMachineData {
  serverType: "internal_machine";
  ip: string;
  hostname: string;
  company: string;
  menus: string[];
  security: { type: string; level: number; isEnabled: boolean }[];
  files: {
    filename: string;
    sizeInGigaQuads: number;
    encryptionLevel: number;
    compressionLevel: number;
  }[];
  accounts: { username: string; password: string; role: string }[];
  links: ServerLinkItem[];
  logs: { date: string; action: string }[];
}

type SubScreen =
  | "login"
  | "menu"
  | "file_server"
  | "logs"
  | "security"
  | "links"
  | "console";

interface Props {
  currentIp: string;
  onConnect: (ip: string) => void;
  setHintText: (text: string) => void;
}

export const ServerViewport: React.FC<Props> = ({
  currentIp,
  onConnect,
  setHintText,
}) => {
  const {
    selectingAppId,
    crackedIps,
    deletedLogIndices,
    deletedFilenames,
    tracedDisconnectMessage,
    acknowledgeTraceDisconnect,
    notifyBackendLoginSuccess,
    assignTargetToApp,
  } = useOSStore();

  // const isPasswordCracked = crackedIps.includes(currentIp);
  const serverDeletedLogs = deletedLogIndices[currentIp] || [];
  const serverDeletedFiles = deletedFilenames[currentIp] || [];

  const [directory, setDirectory] = useState<ServerLinkItem[]>([]);
  const [serverData, setServerData] = useState<InternalMachineData | null>(
    null,
  );
  const [subScreen, setSubScreen] = useState<SubScreen>("login");

  // Login Form State
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Console State
  const [consoleHistory, setConsoleHistory] = useState<string[]>([
    "Phoenix Remote Kernel v1.04 Initialized.",
    'Type "help", "dir", "cd [dir]", "delete", or "shutdown".',
  ]);
  const [consoleCmd, setConsoleCmd] = useState("");

  // 1. Fetch Gateway Directory when on localhost (127.0.0.1)
  useEffect(() => {
    let isCancelled = false;

    if (tracedDisconnectMessage) {
      return (
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <div className="max-w-md w-full bg-gradient-to-b from-blue-950 via-blue-900/90 to-black border-2 border-red-500 p-6 shadow-[0_0_25px_rgba(239,68,68,0.4)] text-center space-y-4">
            <h2 className="text-lg font-bold tracking-widest uppercase text-red-400 border-b border-red-800 pb-2">
              Connection Terminated
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed">
              {tracedDisconnectMessage}
            </p>
            <div className="pt-2">
              <button
                onClick={acknowledgeTraceDisconnect}
                className="px-8 py-1.5 bg-gradient-to-r from-blue-800 via-cyan-700 to-blue-800 hover:from-cyan-600 hover:to-cyan-500 border border-cyan-300 text-xs font-bold tracking-widest text-white uppercase cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentIp === "127.0.0.1" || !serverData) {
      fetch("/api/servers/directory")
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled) {
            setDirectory(data);
            useOSStore.getState().setWorldNodes(data);
          }
        });
    } else {
      fetch(`/api/servers/${currentIp}`)
        .then((res) => res.json())
        .then((data: InternalMachineData) => {
          if (!isCancelled) {
            setServerData(data);
            setSubScreen("login");
            setUsernameInput("");
            setPasswordInput("");
            setLoginError("");
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [currentIp]);

  // --- GATEWAY SCREEN (When disconnected / 127.0.0.1) ---
  if (currentIp === "127.0.0.1" || !serverData) {
    return (
      <div className="relative z-10 h-full flex flex-col">
        <h1 className="text-xl font-bold text-white mb-0.5">Gateway</h1>
        <p className="text-xs text-blue-300 mb-4">
          Click on a link to quick-connect to that site
        </p>

        {/* IP Table Header */}
        <div className="grid grid-cols-[180px_1fr] bg-gradient-to-r from-blue-800 to-blue-950 border border-blue-500 text-xs font-bold px-2 py-1 mb-1">
          <span>IP Address</span>
          <span>Computer Name</span>
        </div>

        {/* Scrollable IP List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 border border-blue-900/60 p-1 bg-blue-950/10">
          {directory.map((item) => (
            <div
              key={item.ip}
              onClick={() => onConnect(item.ip)}
              onMouseEnter={() =>
                setHintText(`Connect to ${item.computerName} (${item.ip})`)
              }
              onMouseLeave={() => setHintText("")}
              className="grid grid-cols-[180px_1fr] items-center text-xs px-2 py-1 bg-blue-950/40 hover:bg-blue-800/60 border border-transparent hover:border-cyan-400 cursor-pointer transition-colors"
            >
              <span className="text-blue-200">{item.ip}</span>
              <span className="text-white">{item.computerName}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- LOGIN HANDLER ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = serverData.accounts.find(
      (a) => a.username === usernameInput && a.password === passwordInput,
    );
    if (matched) {
      setSubScreen("menu");
    } else {
      setLoginError("Invalid Authorisation Code");
    }
  };

  // --- CONSOLE COMMAND HANDLER ---
  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleCmd.trim()) return;
    const cmd = consoleCmd.trim().toLowerCase();
    const nextLogs = [...consoleHistory, `> ${consoleCmd}`];

    if (cmd === "dir") {
      nextLogs.push("Directory listing: /usr  /sys  /log");
    } else if (cmd === "delete") {
      nextLogs.push("Deleting all files in current directory...");
    } else if (cmd === "shutdown") {
      nextLogs.push("System shutting down... Rebooting kernel...");
    } else {
      nextLogs.push(`Executed: ${cmd}`);
    }

    setConsoleHistory(nextLogs);
    setConsoleCmd("");
  };

  return (
    <div className="relative z-10 h-full flex flex-col">
      {/* Common Server Title Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-wide text-white mb-0.5">
          {serverData.company || serverData.hostname}
        </h1>
        <p className="text-sm text-blue-300 capitalize">
          {subScreen === "menu"
            ? "Internal Services Main Menu"
            : subScreen.replace("_", " ")}
        </p>
      </div>

      {/* 1. LOGIN SCREEN */}
      {subScreen === "login" && (
        <div className="ml-8 mt-4 max-w-xs">
          <form
            onSubmit={handleLogin}
            className="bg-gradient-to-br from-cyan-700/80 via-cyan-800/80 to-blue-950 border-2 border-cyan-400 p-4 shadow-lg space-y-3"
          >
            <div className="text-sm font-bold text-blue-950 bg-cyan-300/80 px-2 py-0.5">
              User authorisation required
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="text-cyan-100">Name</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="bg-cyan-950 border border-cyan-400 px-2 py-1 text-white w-44 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="text-cyan-100">Code</label>
              <input
                type="password"
                value={passwordInput}
                onClick={() => {
                  if (selectingAppId) {
                    assignTargetToApp(
                      currentIp,
                      `Auth (${currentIp})`,
                      6,
                      serverData.security,
                    );
                  }
                }}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={selectingAppId ? "CLICK TO ATTACH CRACKER" : ""}
                className={`bg-cyan-950 border px-2 py-1 text-white w-44 focus:outline-none ${
                  selectingAppId
                    ? "border-amber-400 cursor-crosshair"
                    : "border-cyan-400"
                }`}
              />
            </div>
            {loginError && <p className="text-xs text-red-300">{loginError}</p>}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 border border-cyan-300 text-xs font-bold text-white"
              >
                Proceed
              </button>
            </div>
          </form>

          {/* Known Access Codes Helper (Click to autofill just like Uplink!) */}
          <div className="mt-4 text-xs space-y-1">
            <p className="text-blue-200 font-semibold">Known Access Codes</p>
            {serverData.accounts.map((acc) => (
              <button
                key={acc.username}
                onClick={() => {
                  setUsernameInput(acc.username);
                  setPasswordInput(acc.password);
                }}
                onMouseEnter={() =>
                  setHintText("Click to auto-fill credentials")
                }
                onMouseLeave={() => setHintText("")}
                className="block text-left text-cyan-300 hover:text-white underline"
              >
                NAME:'{acc.username}', CODE:'{acc.password}'
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. MAIN MENU SCREEN */}
      {subScreen === "menu" && (
        <div className="space-y-4 ml-4">
          {[
            { id: "file_server", label: "File Server" },
            { id: "links", label: "View links" },
            { id: "logs", label: "Access Logs (Admin)" },
            { id: "security", label: "Security (Admin)" },
            { id: "console", label: "Console (Admin)" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSubScreen(btn.id as SubScreen)}
              className="flex items-center space-x-4 group text-left w-64"
            >
              <span className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-800 border border-cyan-300 group-hover:shadow-[0_0_8px_#22d3ee]" />
              <span className="text-lg text-blue-100 group-hover:text-cyan-300">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. FILE SERVER SCREEN */}
      {subScreen === "file_server" && (
        <div className="flex-1 flex flex-col max-w-2xl">
          <div className="grid grid-cols-[1fr_120px_110px_110px] bg-gradient-to-r from-blue-800 to-blue-950 border border-blue-500 text-xs font-bold px-2 py-1 mb-1">
            <span>Filename</span>
            <span>Size</span>
            <span>Encryption</span>
            <span>Compression</span>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {serverData.files
              .filter((f) => !serverDeletedFiles.includes(f.filename))
              .map((f) => (
                <div
                  key={f.filename}
                  onClick={() => {
                    if (selectingAppId) {
                      assignTargetToApp(
                        f.filename,
                        f.filename,
                        f.sizeInGigaQuads * 2,
                        serverData.security,
                      );
                    }
                  }}
                  className={`grid grid-cols-[1fr_120px_110px_110px] text-xs px-2 py-1 bg-blue-950/50 hover:bg-blue-800/50 border cursor-pointer ${
                    selectingAppId
                      ? "border-amber-400/60 hover:border-amber-300"
                      : "border-blue-900"
                  }`}
                >
                  <span className="text-white">{f.filename}</span>
                  <span>{f.sizeInGigaQuads} GigaQuads</span>
                  <span>
                    {f.encryptionLevel > 0 ? `Level ${f.encryptionLevel}` : ""}
                  </span>
                  <span>
                    {f.compressionLevel > 0
                      ? `Level ${f.compressionLevel}`
                      : ""}
                  </span>
                </div>
              ))}
          </div>
          <button
            onClick={() => setSubScreen("menu")}
            className="mt-4 self-end px-6 py-1 bg-blue-900 hover:bg-blue-700 border border-blue-500 text-xs"
          >
            Back
          </button>
        </div>
      )}

      {/* 4. ACCESS LOGS SCREEN */}
      {subScreen === "logs" && (
        <div className="flex-1 flex flex-col max-w-2xl">
          <div className="grid grid-cols-[140px_1fr] bg-gradient-to-r from-blue-800 to-blue-950 border border-blue-500 text-xs font-bold px-2 py-1 mb-1">
            <span>Date</span>
            <span>Action</span>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {serverData.logs.map((log, i) => {
              if (serverDeletedLogs.includes(i)) return null;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (selectingAppId) {
                      assignTargetToApp(
                        String(i),
                        `Log #${i + 1}`,
                        3,
                        serverData.security,
                      );
                    }
                  }}
                  className={`grid grid-cols-[140px_1fr] text-xs px-2 py-1 bg-blue-950/50 border cursor-pointer ${
                    selectingAppId
                      ? "border-amber-400/60 hover:border-amber-300"
                      : "border-blue-900/60"
                  }`}
                >
                  <span className="text-blue-200">{log.date}</span>
                  <span className="text-white">{log.action}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setSubScreen("menu")}
            className="mt-4 self-end px-6 py-1 bg-blue-900 hover:bg-blue-700 border border-blue-500 text-xs"
          >
            Back
          </button>
        </div>
      )}

      {/* 5. SECURITY SCREEN */}
      {subScreen === "security" && (
        <div className="max-w-lg space-y-4">
          {serverData.security.map((sec, idx) => (
            <div
              key={sec.type}
              onClick={() => {
                const updated = [...serverData.security];
                updated[idx].isEnabled = !updated[idx].isEnabled;
                setServerData({ ...serverData, security: updated });
              }}
              className="grid grid-cols-3 items-center bg-blue-950/70 border-y border-blue-500 px-4 py-2 cursor-pointer hover:bg-blue-900/60"
            >
              <span className="text-base font-bold text-white">{sec.type}</span>
              <span className="text-sm text-blue-200">
                level {sec.level.toFixed(1)}
              </span>
              <span
                className={`text-base font-bold ${sec.isEnabled ? "text-cyan-300" : "text-red-400"}`}
              >
                {sec.isEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
          <button
            onClick={() => setSubScreen("menu")}
            className="mt-8 px-6 py-1 bg-blue-900 hover:bg-blue-700 border border-blue-500 text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* 6. LINKS SCREEN */}
      {subScreen === "links" && (
        <div className="flex-1 flex flex-col max-w-2xl">
          <div className="grid grid-cols-[160px_1fr] bg-gradient-to-r from-blue-800 to-blue-950 border border-blue-500 text-xs font-bold px-2 py-1 mb-1">
            <span>IP Address</span>
            <span>Computer Name</span>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {serverData.links.map((link) => (
              <div
                key={link.ip}
                onClick={() => onConnect(link.ip)}
                className="grid grid-cols-[160px_1fr] text-xs px-2 py-1 bg-blue-950/50 hover:bg-blue-800/60 border border-blue-900 cursor-pointer"
              >
                <span className="text-blue-200">{link.ip}</span>
                <span className="text-white">{link.computerName}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSubScreen("menu")}
            className="mt-4 self-end px-6 py-1 bg-blue-900 hover:bg-blue-700 border border-blue-500 text-xs"
          >
            Close
          </button>
        </div>
      )}

      {/* 7. CONSOLE TERMINAL SCREEN */}
      {subScreen === "console" && (
        <div className="flex-1 flex flex-col max-w-2xl bg-black border border-blue-700 p-3 font-mono text-xs">
          <div className="flex-1 overflow-y-auto space-y-1 text-cyan-300">
            {consoleHistory.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          <form
            onSubmit={handleConsoleSubmit}
            className="flex items-center border-t border-blue-800 pt-2 mt-2"
          >
            <span className="text-cyan-400 mr-2">&gt;</span>
            <input
              type="text"
              autoFocus
              value={consoleCmd}
              onChange={(e) => setConsoleCmd(e.target.value)}
              className="flex-1 bg-transparent text-white focus:outline-none"
              placeholder="Enter command..."
            />
          </form>
          <button
            onClick={() => setSubScreen("menu")}
            className="mt-2 self-end px-4 py-0.5 bg-blue-900 border border-blue-500 text-[10px]"
          >
            Exit Console
          </button>
        </div>
      )}
    </div>
  );
};
