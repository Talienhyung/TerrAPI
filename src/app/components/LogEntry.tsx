interface LogEntryProps {
  timestamp: string;
  type: "SYSTEM" | "ROBOT" | "SERVER";
  message: string;
}

export function LogEntry({ timestamp, type, message }: LogEntryProps) {
  const typeColors = {
    SYSTEM: "text-blue-400",
    ROBOT: "text-green-400",
    SERVER: "text-green-400",
  };

  return (
    <div className="flex gap-4 text-sm font-mono">
      <span className="text-gray-600">[{timestamp}]</span>
      <span className={typeColors[type]}>{type}</span>
      <span className="text-gray-400">{message}</span>
    </div>
  );
}
