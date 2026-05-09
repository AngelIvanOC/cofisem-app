export default function DatoCard({ label, value, mono, highlight }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p
        className={`text-xs font-semibold truncate ${
          highlight ? "text-emerald-600" : "text-[#13193a]"
        } ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
