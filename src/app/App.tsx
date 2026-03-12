import { DeviceCard } from "./components/DeviceCard";
import { ConnectedDevice } from "./components/ConnectedDevice";
import { LogEntry } from "./components/LogEntry";
import { Monitor, Camera } from "lucide-react";
import { useState, useEffect } from "react";

export default function App() {
  const [autoUpdate, setAutoUpdate] = useState(true);
  
  // Generate chart data
  const generateChartData = () => {
    return Array.from({ length: 30 }, () => ({
      value: Math.random() * 40 + 30,
    }));
  };

  const [robotChartData, setRobotChartData] = useState(generateChartData());
  const [serverChartData, setServerChartData] = useState(generateChartData());

  useEffect(() => {
    if (autoUpdate) {
      const interval = setInterval(() => {
        setRobotChartData(generateChartData());
        setServerChartData(generateChartData());
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoUpdate]);

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-16 bg-[#1a1f2e] border-r border-gray-800 flex flex-col items-center py-4 gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center text-black font-bold text-sm">
          DB
        </div>
        <button className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center">
          <Monitor className="w-5 h-5 text-black" />
        </button>
        <button className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-gray-500 hover:text-white">
          <span className="text-xs">Mise</span>
        </button>
        <button className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-gray-500 hover:text-white">
          <Camera className="w-5 h-5" />
        </button>
        
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] text-gray-400">BOT</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] text-gray-400">SRV</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-16 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-semibold mb-1">Home</h1>
              <p className="text-gray-500 text-sm">Vue d'ensemble — appareils connectés</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Mise à jour auto</span>
              <div 
                onClick={() => setAutoUpdate(!autoUpdate)}
                className={`w-3 h-3 rounded-full cursor-pointer ${autoUpdate ? 'bg-green-500' : 'bg-gray-500'}`}
              ></div>
            </div>
          </div>
        </div>

        {/* Device Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <DeviceCard
            type="ROBOT"
            name="RoboUnit-01"
            status="En ligne"
            badge="BOT"
            cpuValue={67}
            ramValue={58}
            cpuColor="#06b6d4"
            ramColor="#a78bfa"
            additionalInfo={{
              battery: 72,
              speed: "34 cm/s",
              mode: "Autonome",
            }}
            chartData={robotChartData}
            chartColor="#06b6d4"
          />
          <DeviceCard
            type="SERVEUR"
            name="Main-Server"
            status="Uptime 3.08m"
            badge="[ SRV ]"
            cpuValue={41}
            ramValue={63}
            cpuColor="#10b981"
            ramColor="#fbbf24"
            additionalInfo={{
              networkUp: "1.2 MB/s",
              networkDown: "3.8 MB/s",
              processes: 142,
            }}
            chartData={serverChartData}
            chartColor="#10b981"
          />
        </div>

        {/* Connected Devices */}
        <div className="mb-8">
          <h2 className="text-sm text-gray-400 uppercase mb-4">Appareils connectés</h2>
          <div className="grid grid-cols-4 gap-4">
            <ConnectedDevice
              name="RoboUnit-01"
              status="Bat. 72%"
              color="#06b6d4"
              isOnline={true}
            />
            <ConnectedDevice
              name="Main-Server"
              status="Up 3.08m"
              color="#10b981"
              isOnline={true}
            />
            <ConnectedDevice
              name="Caméra-01"
              status="72cp"
              color="#a78bfa"
              isOnline={true}
            />
            <ConnectedDevice
              name="Capteur-T°"
              status="Hors ligne"
              color="#6b7280"
              isOnline={false}
            />
            <ConnectedDevice
              name="Réseau-AP"
              status="5 GHz"
              color="#fbbf24"
              isOnline={true}
            />
          </div>
        </div>

        {/* Logs */}
        <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Logs</h2>
            <span className="text-xs text-gray-500">Dernière : 11/03/2026 15:31:38</span>
          </div>
          <div className="space-y-2">
            <LogEntry
              timestamp="11/03/2026 15:31:38"
              type="SYSTEM"
              message='{"msg":"dashboard_ready"}'
            />
            <LogEntry
              timestamp="11/03/2026 15:31:35"
              type="ROBOT"
              message='{"cpu":67,"ram":58,"bat":72}'
            />
            <LogEntry
              timestamp="11/03/2026 15:31:30"
              type="SERVER"
              message='{"cpu":41,"ram":63,"disk":55}'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
