// client/src/components/FloatingAppsLayer.tsx
import React from "react";
import { Rnd } from "react-rnd";
import { X, Crosshair } from "lucide-react";
import { useOSStore } from "../store/useOSStore";

export const FloatingAppsLayer: React.FC = () => {
  const {
    runningApps,
    selectingAppId,
    closeApp,
    adjustCpu,
    updateAppPosition,
  } = useOSStore();

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {runningApps.map((app) => {
        const isWaitingTarget = app.status === "awaiting_target";
        const isSelectedForTarget = selectingAppId === app.id;

        return (
          <Rnd
            key={app.id}
            bounds="parent"
            enableResizing={false}
            position={{ x: app.x, y: app.y }}
            onDragStop={(_e, d) => updateAppPosition(app.id, d.x, d.y)}
            className="pointer-events-auto"
          >
            <div
              className={`w-64 bg-gradient-to-b from-blue-900/95 to-blue-950/95 border-2 shadow-[0_0_15px_rgba(0,0,0,0.9)] select-none ${
                isSelectedForTarget
                  ? "border-amber-400 animate-pulse"
                  : "border-cyan-400/80"
              }`}
            >
              {/* Draggable Window Title Bar */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 to-blue-950 px-2 py-1 border-b border-blue-600 cursor-move text-[11px]">
                <span className="font-bold text-white truncate">
                  {app.name}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => adjustCpu(app.id, -10)}
                    className="px-1 bg-blue-950 hover:bg-cyan-700 border border-blue-500 text-[9px]"
                    title="Decrease CPU allocation"
                  >
                    &lt;
                  </button>
                  <span className="text-[10px] text-cyan-300 font-bold w-8 text-center">
                    {app.cpuShare}%
                  </span>
                  <button
                    onClick={() => adjustCpu(app.id, 10)}
                    className="px-1 bg-blue-950 hover:bg-cyan-700 border border-blue-500 text-[9px]"
                    title="Increase CPU allocation"
                  >
                    &gt;
                  </button>
                  <button
                    onClick={() => closeApp(app.id)}
                    className="p-0.5 bg-red-900/70 hover:bg-red-600 text-white border border-red-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* App Body / Progress Bar */}
              <div className="p-2 space-y-1.5 text-xs">
                {isWaitingTarget ? (
                  <div className="flex items-center space-x-2 text-amber-300 bg-amber-950/40 border border-amber-500/50 px-2 py-1">
                    <Crosshair className="w-3.5 h-3.5 shrink-0 animate-spin" />
                    <span className="text-[11px]">
                      Click a target on screen...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[10px] text-blue-200 truncate">
                      <span>Target: {app.targetLabel || "System Active"}</span>
                      <span>{Math.floor(app.progress)}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-4 bg-black border border-blue-600 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-100"
                        style={{ width: `${app.progress}%` }}
                      />
                      {app.appType === "password_breaker" && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] tracking-widest text-white font-bold">
                          {app.progress < 100 ? "CRACKING..." : "UNLOCKED"}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Rnd>
        );
      })}
    </div>
  );
};
