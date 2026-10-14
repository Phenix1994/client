import React, { useEffect, useState } from "react";
import {
  Power,
  Pause,
  Play,
  FastForward,
  Cpu,
  Terminal,
  HardDrive,
  Shield,
  DollarSign,
  Mail,
  Activity,
  Database,
  Server,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { ServerViewport } from "./components/ServerViewport";
import { useOSStore, type AppType, type AppCategory } from "./store/useOSStore";
import { FloatingAppsLayer } from "./components/FloatingAppsLayer";
// --- Types ---
type InfoPanelType =
  | "connection_analyser"
  | "hardware"
  | "memory"
  | "finance"
  | "mail"
  | "status";
type GameSpeed = 0 | 1 | 2 | 4;

// interface RunningApp {
//   id: string;
//   name: string;
//   category: "security" | "cracking" | "file";
//   cpuShare: number;
// }

export const PhoenixOSShell: React.FC = () => {
  // --- UI & Game State ---
  const [currentIp, setCurrentIp] = useState<string>("127.0.0.1"); // 127.0.0.1 if disconnected
  const [hintText, setHintText] = useState<string>("Phoenix OS Ready.");
  const [activeInfoPanel, setActiveInfoPanel] = useState<InfoPanelType>(
    "connection_analyser",
  );
  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);
  const [isCpuDrawerOpen, setIsCpuDrawerOpen] = useState<boolean>(false);

  // Mock running apps to demonstrate the non-cramping CPU bar
  const {
    gameSpeed,
    runningApps,
    downloadedFiles,
    setGameSpeed,
    launchApp,
    // closeApp,
    adjustCpu,
    tickCpu,
  } = useOSStore();

  // Master CPU Tick Loop (Runs 10 times per second)
  useEffect(() => {
    const interval = setInterval(() => {
      tickCpu(0.1, currentIp);
    }, 100);
    return () => clearInterval(interval);
  }, [tickCpu, currentIp]);

  const totalCpuUsage = runningApps.reduce((acc, app) => acc + app.cpuShare, 0);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-blue-100 font-mono select-none grid grid-cols-[1fr_340px] grid-rows-[36px_1fr_92px] gap-1.5 p-1.5 border border-blue-900/60">
      {/* =========================================================
          1. TOP BAR (Col 1, Row 1) - Static with Clean CPU Meter
         ========================================================= */}
      <header className="col-start-1 row-start-1 flex items-center justify-between bg-gradient-to-r from-blue-950 via-blue-900/80 to-blue-950 border border-blue-700/60 px-2 text-xs relative z-30">
        {/* Left: Exit, Date/Time, Current IP, Speed Controls */}
        <div className="flex items-center space-x-2">
          <button
            onMouseEnter={() =>
              setHintText("Exit Phoenix OS and return to main menu")
            }
            onMouseLeave={() => setHintText("")}
            className="p-1 bg-blue-900/80 hover:bg-red-900/80 border border-blue-500/50 text-blue-200 transition-colors"
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {/* In-Game Time & Date */}
          <div className="bg-blue-950/90 border border-blue-700/70 px-3 py-1 tracking-wider text-blue-200 shadow-inner">
            01:34:10, 25 July 2026
          </div>

          {/* Active Connection IP */}
          <div
            onMouseEnter={() =>
              setHintText("Current active remote connection IP")
            }
            onMouseLeave={() => setHintText("")}
            className="bg-blue-950/90 border border-blue-700/70 px-4 py-1 text-cyan-300 font-semibold tracking-widest"
          >
            {currentIp}
          </div>

          {/* Game Speed Controls */}
          <div className="flex items-center space-x-0.5 bg-blue-950 p-0.5 border border-blue-700/60">
            {[
              { speed: 0 as GameSpeed, icon: Pause, label: "Pause Game" },
              { speed: 1 as GameSpeed, icon: Play, label: "Normal Speed (1x)" },
              {
                speed: 2 as GameSpeed,
                icon: FastForward,
                label: "Fast Speed (2x)",
              },
            ].map(({ speed, icon: Icon, label }) => (
              <button
                key={speed}
                onClick={() => setGameSpeed(speed)}
                onMouseEnter={() => setHintText(label)}
                onMouseLeave={() => setHintText("")}
                className={`p-1 transition-colors ${
                  gameSpeed === speed
                    ? "bg-cyan-600 text-white shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                    : "bg-blue-900/40 text-blue-400 hover:bg-blue-800/60"
                }`}
              >
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>

        {/* Right/Center: Modernized CPU Usage Bar + Collapsible Process Drawer */}
        <div className="relative flex items-center space-x-2">
          <button
            onClick={() => setIsCpuDrawerOpen(!isCpuDrawerOpen)}
            onMouseEnter={() =>
              setHintText("Click to toggle CPU Process Allocation Drawer")
            }
            onMouseLeave={() => setHintText("")}
            className="flex items-center space-x-2 bg-blue-950/90 border border-blue-600/70 px-2.5 py-1 hover:border-cyan-400 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-blue-300">CPU</span>

            {/* Segmented Master CPU Bar */}
            <div className="w-36 h-3 bg-black border border-blue-800 relative flex overflow-hidden">
              {runningApps.map((app) => (
                <div
                  key={app.id}
                  style={{ width: `${app.cpuShare}%` }}
                  className={`h-full border-r border-black/50 transition-all duration-200 ${
                    app.category === "security"
                      ? "bg-cyan-500"
                      : app.category === "cracking"
                        ? "bg-blue-500"
                        : "bg-indigo-400"
                  }`}
                />
              ))}
            </div>

            <span className="text-[11px] font-bold text-cyan-300 w-8 text-right">
              {totalCpuUsage}%
            </span>
            {isCpuDrawerOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Collapsible CPU Allocation Overlay (Fixes classic Uplink UI cramping) */}
          {isCpuDrawerOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-gradient-to-b from-blue-950 to-black border border-cyan-500/60 shadow-2xl p-2 space-y-1.5 z-50">
              <div className="text-[10px] uppercase tracking-wider text-cyan-400 border-b border-blue-800 pb-1 flex justify-between">
                <span>Active Processes ({runningApps.length})</span>
                <span>Allocation</span>
              </div>
              {runningApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between text-xs bg-blue-900/30 border border-blue-800/60 px-1.5 py-1"
                >
                  <span className="truncate w-36 text-blue-100">
                    {app.name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => adjustCpu(app.id, -10)}
                      className="px-1 bg-blue-900 hover:bg-cyan-700 border border-blue-600 text-[10px]"
                    >
                      &lt;
                    </button>
                    <div className="w-16 h-3 bg-black border border-blue-700 relative">
                      <div
                        className="h-full bg-cyan-500/80"
                        style={{ width: `${app.cpuShare}%` }}
                      />
                      <span className="absolute inset-0 text-[9px] flex items-center justify-center text-white font-bold">
                        {app.cpuShare}%
                      </span>
                    </div>
                    <button
                      onClick={() => adjustCpu(app.id, 10)}
                      className="px-1 bg-blue-900 hover:bg-cyan-700 border border-blue-600 text-[10px]"
                    >
                      &gt;
                    </button>
                    <button className="p-0.5 text-red-400 hover:bg-red-950 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* =========================================================
          2. WORLD MAP SECTION (Col 2, Row 1 & Top of Row 2)
         ========================================================= */}
      {/* =========================================================
          2. WORLD MAP & CONNECTION ANALYSER (Col 2)
         ========================================================= */}
      <aside className="col-start-2 row-start-1 row-span-2 flex flex-col space-y-1.5">
        {/* World Map Panel */}
        <div className="h-56 flex flex-col bg-gradient-to-b from-blue-950/90 to-black border border-blue-700/70 relative overflow-hidden">
          {/* Active Trace Warning Banner */}
          {useOSStore.getState().isTraceActive && (
            <div className="absolute top-1 left-1 right-1 z-20 bg-red-950/90 border border-red-500 px-2 py-0.5 flex justify-between items-center text-[10px] text-red-200 animate-pulse">
              <span className="font-bold">TRACE IN PROGRESS</span>
              <span className="font-bold text-red-400">
                {Math.floor(useOSStore.getState().traceProgress)}%
              </span>
            </div>
          )}

          <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,#1e3a8a_0%,#020617_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e40af22_1px,transparent_1px),linear-gradient(to_bottom,#1e40af22_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* Interactive SVG World Map */}
            <svg className="w-full h-full relative z-10" viewBox="0 0 300 150">
              {(() => {
                const {
                  worldNodes,
                  bounceChain,
                  isTraceActive,
                  traceProgress,
                } = useOSStore.getState();
                const localhost = {
                  ip: "127.0.0.1",
                  computerName: "Localhost",
                  coordinates: { x: 40, y: 50 },
                };

                // Build ordered route points: Localhost -> Bounce Nodes -> Active CurrentIP
                const routeIps = [...bounceChain];
                if (
                  currentIp !== "127.0.0.1" &&
                  !routeIps.includes(currentIp)
                ) {
                  routeIps.push(currentIp);
                }

                const routePoints = [
                  localhost.coordinates,
                  ...routeIps
                    .map(
                      (ip) => worldNodes.find((n) => n.ip === ip)?.coordinates,
                    )
                    .filter((c): c is { x: number; y: number } => Boolean(c)),
                ];

                // Calculate how many segments from the target back to Localhost are traced (Red)
                const totalSegments = Math.max(1, routePoints.length - 1);
                const tracedSegmentsCount = isTraceActive
                  ? Math.ceil((traceProgress / 100) * totalSegments)
                  : 0;

                return (
                  <>
                    {/* Draw Route Segments */}
                    {routePoints.map((pt, idx) => {
                      if (idx === routePoints.length - 1) return null;
                      const nextPt = routePoints[idx + 1];
                      // Trace moves backwards from last segment to first segment
                      const segmentIndexFromTarget = totalSegments - 1 - idx;
                      const isSegmentTraced =
                        isTraceActive &&
                        segmentIndexFromTarget < tracedSegmentsCount;

                      return (
                        <line
                          key={idx}
                          x1={pt.x}
                          y1={pt.y}
                          x2={nextPt.x}
                          y2={nextPt.y}
                          stroke={isSegmentTraced ? "#ef4444" : "#38bdf8"}
                          strokeWidth={isSegmentTraced ? "2.2" : "1.5"}
                          strokeDasharray="3,3"
                        />
                      );
                    })}

                    {/* Draw Localhost Node */}
                    <rect
                      x={localhost.coordinates.x - 4}
                      y={localhost.coordinates.y - 4}
                      width="8"
                      height="8"
                      className="fill-white stroke-cyan-400"
                    />
                    <text
                      x={localhost.coordinates.x - 12}
                      y={localhost.coordinates.y + 14}
                      className="fill-cyan-300 text-[8px]"
                    >
                      HOME
                    </text>

                    {/* Draw World Server Nodes */}
                    {worldNodes.map((node) => {
                      const bounceIdx = bounceChain.indexOf(node.ip);
                      const isCurrentTarget = currentIp === node.ip;

                      return (
                        <g
                          key={node.ip}
                          className="cursor-pointer"
                          onClick={() => {
                            if (currentIp === "127.0.0.1") {
                              useOSStore.getState().toggleBounceNode(node.ip);
                            }
                          }}
                          onMouseEnter={() =>
                            setHintText(
                              `${node.computerName} (${node.ip}) - Click to add/remove bounce hop`,
                            )
                          }
                          onMouseLeave={() => setHintText("")}
                        >
                          <rect
                            x={node.coordinates.x - 4}
                            y={node.coordinates.y - 4}
                            width="8"
                            height="8"
                            className={
                              isCurrentTarget
                                ? "fill-red-500 stroke-white"
                                : bounceIdx !== -1
                                  ? "fill-cyan-300 stroke-white"
                                  : "fill-blue-400 hover:fill-cyan-200"
                            }
                          />
                          {bounceIdx !== -1 && (
                            <text
                              x={node.coordinates.x + 6}
                              y={node.coordinates.y + 3}
                              className="fill-cyan-300 text-[9px] font-bold"
                            >
                              #{bounceIdx + 1}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Connect / Disconnect Controls under Map */}
          <div className="flex border-t border-blue-600">
            {currentIp === "127.0.0.1" ? (
              <>
                <button
                  onClick={() => {
                    const chain = useOSStore.getState().bounceChain;
                    if (chain.length > 0) {
                      setCurrentIp(chain[chain.length - 1]);
                    }
                  }}
                  className="flex-1 py-1 bg-gradient-to-r from-blue-900 via-cyan-800 to-blue-900 hover:from-cyan-700 hover:to-cyan-600 text-xs font-semibold text-white"
                >
                  Connect ({useOSStore.getState().bounceChain.length} Hops)
                </button>
                <button
                  onClick={() => useOSStore.getState().clearBounceChain()}
                  className="px-2 py-1 bg-blue-950 hover:bg-red-900 text-[10px] text-blue-300 border-l border-blue-700"
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  useOSStore.getState().resetTrace();
                  setCurrentIp("127.0.0.1");
                }}
                className="w-full py-1 bg-gradient-to-r from-red-900 via-red-700 to-red-900 hover:from-red-700 hover:to-red-500 text-xs font-bold tracking-wider text-white"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* =========================================================
            3. INFORMATION SECTION (Connection Analyser + Telemetry)
           ========================================================= */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-blue-950/60 via-blue-950/20 to-black border border-blue-700/70">
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b border-blue-600 py-1 px-2 text-center text-xs font-bold tracking-widest uppercase text-blue-100">
            {activeInfoPanel.replace("_", " ")}
          </div>

          <div className="flex-1 p-4 relative flex flex-col justify-between">
            {activeInfoPanel === "connection_analyser" ? (
              <div className="flex-1 flex flex-col justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-900/50 border border-blue-500 text-cyan-300">
                    <Server className="w-6 h-6" />
                  </div>
                  <span className="text-blue-200">Localhost (127.0.0.1)</span>
                </div>

                {/* Live Security Bypass Indicators */}
                <div className="my-auto flex items-center justify-around border-y border-dashed border-blue-800/60 py-6">
                  {["Monitor", "Proxy"].map((secName) => {
                    const isBypassed = runningApps.some(
                      (a) =>
                        a.appType ===
                        (`${secName.toLowerCase()}_bypass` as AppType),
                    );
                    return (
                      <div
                        key={secName}
                        className="flex flex-col items-center space-y-1"
                      >
                        <div
                          className={`p-2 bg-blue-950 border transition-all ${
                            isBypassed
                              ? "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                              : "border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                          }`}
                        >
                          <Shield
                            className={`w-5 h-5 ${isBypassed ? "text-emerald-400" : "text-red-400"}`}
                          />
                        </div>
                        <span className="text-[11px] text-blue-200">
                          {secName}
                        </span>
                        <span
                          className={`text-[9px] px-1 font-bold uppercase ${
                            isBypassed
                              ? "bg-emerald-900/80 text-emerald-300"
                              : "bg-red-950 text-red-400"
                          }`}
                        >
                          {isBypassed ? "Bypassed" : "Active"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-blue-300 leading-tight">
                    <p className="font-bold text-white">
                      {currentIp === "127.0.0.1" ? "No Remote Host" : currentIp}
                    </p>
                    <p className="text-cyan-400">
                      Bounce Hops: {useOSStore.getState().bounceChain.length}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-blue-900/50 border border-blue-500 text-cyan-300">
                      <Server className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] text-blue-200 mt-1">
                      Remotehost
                    </span>
                  </div>
                </div>
              </div>
            ) : activeInfoPanel === "memory" ? (
              <div className="text-xs space-y-2">
                <p className="text-cyan-300 font-bold border-b border-blue-800 pb-1">
                  GATEWAY MEMORY BANKS ({downloadedFiles.length} Files)
                </p>
                {downloadedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex justify-between bg-blue-950/60 border border-blue-800 px-2 py-1"
                  >
                    <span className="text-white">{f.filename}</span>
                    <span className="text-cyan-400">{f.size} GQ</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-blue-300 space-y-2">
                <p className="text-cyan-400 font-semibold uppercase">
                  System View: {activeInfoPanel}
                </p>
                <p className="text-blue-400/80">
                  Select items or inspect live Phoenix OS telemetry here.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================
          4. CONTENT SECTION (Col 1, Row 2) - Main Dynamic Viewport
         ========================================================= */}
      <main className="col-start-1 row-start-2 relative bg-black border border-blue-900/40 p-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(30,58,138,0.18),transparent_70%)]" />
        <ServerViewport
          currentIp={currentIp}
          onConnect={(targetIp) => setCurrentIp(targetIp)}
          setHintText={setHintText}
        />
        <FloatingAppsLayer />
      </main>

      {/* =========================================================
          5. ACTION BAR & HINT TEXT (Col 1, Row 3)
         ========================================================= */}
      <footer className="col-start-1 row-start-3 flex flex-col justify-between relative z-20">
        {/* Pop-up App Launcher ("Start" Menu) */}
        {isStartMenuOpen && (
          <div className="absolute bottom-24 left-0 w-64 bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-cyan-500/80 shadow-[0_0_20px_rgba(30,64,175,0.8)] p-1.5 space-y-1 z-50">
            <div className="text-xs font-bold text-cyan-300 px-2 py-1 border-b border-blue-700">
              PHOENIX OS APPLICATIONS
            </div>
            {[
              {
                type: "password_breaker" as AppType,
                name: "Password_Breaker v2.0",
                cat: "cracking" as AppCategory,
              },
              {
                type: "file_copier" as AppType,
                name: "File_Copier v1.0",
                cat: "file" as AppCategory,
              },
              {
                type: "file_deleter" as AppType,
                name: "File_Deleter v1.0",
                cat: "file" as AppCategory,
              },
              {
                type: "log_deleter" as AppType,
                name: "Log_Deleter v4.0",
                cat: "logs" as AppCategory,
              },
              {
                type: "monitor_bypass" as AppType,
                name: "Monitor_Bypass v1.0",
                cat: "security" as AppCategory,
              },
              {
                type: "proxy_bypass" as AppType,
                name: "Proxy_Bypass v1.0",
                cat: "security" as AppCategory,
              },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => {
                  launchApp(item.type, item.name, item.cat);
                  setIsStartMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-blue-100 hover:bg-cyan-700/60 hover:text-white flex justify-between items-center transition-colors"
              >
                <span>{item.name}</span>
                <span className="text-[10px] text-cyan-300 uppercase">
                  {item.cat}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-end space-x-2">
          {/* Large Primary OS App Launcher Button */}
          <button
            onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
            onMouseEnter={() => setHintText("Run a software application")}
            onMouseLeave={() => setHintText("")}
            className={`w-16 h-16 flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-900 to-blue-950 border-2 transition-all ${
              isStartMenuOpen
                ? "border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                : "border-blue-500 hover:border-cyan-400"
            }`}
          >
            <Terminal className="w-8 h-8 text-cyan-300" />
            <span className="text-[9px] tracking-tighter text-blue-200 mt-0.5 uppercase font-bold">
              Apps
            </span>
          </button>

          {/* 2-Row Grid of Sub-Action Buttons */}
          <div className="grid grid-cols-7 gap-1">
            {[
              {
                id: "hardware",
                icon: Cpu,
                hint: "View Gateway Hardware Configuration",
              },
              {
                id: "memory",
                icon: HardDrive,
                hint: "View Memory Banks (Files & Tools)",
              },
              {
                id: "status",
                icon: Shield,
                hint: "View Hacker Rating & Criminal Record",
              },
              {
                id: "finance",
                icon: DollarSign,
                hint: "View Financial Accounts & Balances",
              },
              {
                id: "mail",
                icon: Mail,
                hint: "Read & Compose Emails / Missions",
              },
              {
                id: "connection_analyser",
                icon: Activity,
                hint: "Open Connection Analyser in Info Panel",
              },
              {
                id: "logs",
                icon: Database,
                hint: "View Local Gateway Access Logs",
              },
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = activeInfoPanel === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveInfoPanel(btn.id as InfoPanelType)}
                  onMouseEnter={() => setHintText(btn.hint)}
                  onMouseLeave={() => setHintText("")}
                  className={`w-7 h-7 flex items-center justify-center border transition-all ${
                    isSelected
                      ? "bg-cyan-700/80 border-cyan-300 text-white shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                      : "bg-gradient-to-b from-blue-800/80 to-blue-950 border-blue-600/70 text-blue-300 hover:border-cyan-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Hint Text Bar */}
        <div className="text-xs text-blue-200 tracking-wide h-5 flex items-center px-1 border-t border-blue-900/50">
          {hintText || "Ready."}
        </div>
      </footer>
    </div>
  );
};

export default PhoenixOSShell;
