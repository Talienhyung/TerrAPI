interface ConnectedDeviceProps {
  name: string;
  status: string;
  color: string;
  isOnline: boolean;
}

export function ConnectedDevice({ name, status, color, isOnline }: ConnectedDeviceProps) {
  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-800 flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} style={{ backgroundColor: color }}>
        <div className="w-6 h-6 rounded bg-white/20"></div>
      </div>
      <div className="flex-1">
        <h4 className="text-white text-sm font-medium">{name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          <span className="text-xs text-gray-400">{status}</span>
        </div>
      </div>
    </div>
  );
}
