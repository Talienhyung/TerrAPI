import { CircularGauge } from "./CircularGauge";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Battery } from "lucide-react";

interface DeviceCardProps {
  type: "ROBOT" | "SERVEUR";
  name: string;
  status: string;
  badge?: string;
  cpuValue: number;
  ramValue: number;
  cpuColor: string;
  ramColor: string;
  additionalInfo?: {
    battery?: number;
    speed?: string;
    mode?: string;
    networkUp?: string;
    networkDown?: string;
    processes?: number;
  };
  chartData: { value: number }[];
  chartColor: string;
}

export function DeviceCard({
  type,
  name,
  status,
  badge,
  cpuValue,
  ramValue,
  cpuColor,
  ramColor,
  additionalInfo,
  chartData,
  chartColor,
}: DeviceCardProps) {
  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400 uppercase">{type}</span>
          </div>
          <h3 className="text-xl text-white font-medium">{name}</h3>
          <p className="text-sm text-gray-500">{status}</p>
        </div>
        {badge && (
          <span className="text-sm text-cyan-400 border border-cyan-400/30 px-3 py-1 rounded">
            {badge}
          </span>
        )}
      </div>

      {/* Gauges and Info */}
      <div className="flex gap-8 mb-6">
        <div className="flex gap-6">
          <CircularGauge value={cpuValue} label="CPU" color={cpuColor} />
          <CircularGauge value={ramValue} label="RAM" color={ramColor} />
        </div>
        
        <div className="flex flex-col gap-3 text-sm">
          {additionalInfo?.battery !== undefined && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Battery className="w-4 h-4 text-green-400" />
                <span className="text-gray-400 uppercase text-xs">Batterie</span>
              </div>
              <div className="text-white text-lg">{additionalInfo.battery}%</div>
            </div>
          )}
          {additionalInfo?.speed && (
            <div>
              <div className="text-gray-400 uppercase text-xs mb-1">Vitesse</div>
              <div className="text-white text-lg">{additionalInfo.speed}</div>
            </div>
          )}
          {additionalInfo?.mode && (
            <div>
              <div className="text-gray-400 uppercase text-xs mb-1">Mode</div>
              <div className="text-white text-lg">{additionalInfo.mode}</div>
            </div>
          )}
          {additionalInfo?.networkUp && (
            <div>
              <div className="text-gray-400 uppercase text-xs mb-1">Réseau ↑</div>
              <div className="text-white text-lg">{additionalInfo.networkUp}</div>
            </div>
          )}
          {additionalInfo?.networkDown && (
            <div>
              <div className="text-gray-400 uppercase text-xs mb-1">Réseau ↓</div>
              <div className="text-white text-lg">{additionalInfo.networkDown}</div>
            </div>
          )}
          {additionalInfo?.processes !== undefined && (
            <div>
              <div className="text-gray-400 uppercase text-xs mb-1">Processus</div>
              <div className="text-white text-lg">{additionalInfo.processes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
