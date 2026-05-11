import Card from "../ui/Card";

export default function StatCard({ label, value, tone = "blue", icon: Icon }) {
  return (
    <Card className={`stat-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {Icon ? (
        <span className="stat-icon">
          <Icon size={22} />
        </span>
      ) : null}
    </Card>
  );
}
