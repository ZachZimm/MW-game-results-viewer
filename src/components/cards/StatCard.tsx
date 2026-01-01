interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: StatCardProps) {
  const trendColor =
    trend === "up"
      ? "text-positive"
      : trend === "down"
        ? "text-negative"
        : "text-text-secondary";

  return (
    <div className="bg-bg-secondary rounded-lg border border-border-color p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className={`text-2xl font-semibold mt-1 tabular-nums ${trendColor}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-text-secondary opacity-50">{icon}</div>
        )}
      </div>
    </div>
  );
}
