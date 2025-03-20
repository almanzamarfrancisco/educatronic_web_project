import { h } from "preact"
import { useEffect, useState } from "preact/hooks";
import { CheckCircle, XCircle, Loader2, Bot } from "lucide-preact";

const StatusIcon = ({ status = "neutral", size = 32 }) => {
  const [icon, setIcon] = useState(status);

  useEffect(() => {
    setIcon(status);
  }, [status]);

  return (
    <div className="flex items-center justify-center">
      {icon === "neutral" && (
        <Bot
          className="text-gray-400 animate-wiggle"
          size={size}
        />
      )}
      {icon === "loading" && (
        <Loader2
          className="animate-spin text-blue-500"
          size={size}
        />
      )}
      {icon === "success" && (
        <CheckCircle
          className="text-green-500 animate-bounce"
          size={size}
        />
      )}
      {icon === "fail" && (
        <XCircle
          className="text-red-500 animate-pulse"
          size={size}
        />
      )}
    </div>
  );
};

export default StatusIcon;
