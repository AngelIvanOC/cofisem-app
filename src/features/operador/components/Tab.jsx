export default function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
        active
          ? "border-[#13193a] text-[#13193a]"
          : "border-transparent text-gray-400 hover:text-gray-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
