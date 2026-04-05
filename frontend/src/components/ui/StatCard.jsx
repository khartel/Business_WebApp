import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "primary",
}) {
  const colors = {
    primary: "text-primary-400 bg-primary-500/10",
    green: "text-green-400 bg-green-500/10",
    yellow: "text-yellow-400 bg-yellow-500/10",
    red: "text-red-400 bg-red-500/10",
    blue: "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-dark-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-dark-400 text-xs mt-1">{subtitle}</p>
          )}
          {trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" ? (
                <TrendingUp size={14} className="text-green-400" />
              ) : (
                <TrendingDown size={14} className="text-red-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend === "up" ? "text-green-400" : "text-red-400"
                }`}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon size={22} className={colors[color].split(" ")[0]} />
          </div>
        )}
      </div>
    </div>
  );
}