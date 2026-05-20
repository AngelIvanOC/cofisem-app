import { Fragment } from "react";
import { PASOS } from "../constants/cobertura";

export default function StepBar({ paso }) {
  return (
    <div className="flex items-center mb-6">
      {PASOS.map((p, i) => (
        <Fragment key={p.num}>
          <div className="flex flex-col items-center shrink-0">
            <div className={[
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              paso > p.num ? "bg-emerald-500 text-white" : paso === p.num ? "bg-[#13193a] text-white" : "bg-gray-100 text-gray-400",
            ].join(" ")}>
              {paso > p.num ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : p.num}
            </div>
            <p className={`text-[10px] mt-1.5 font-semibold hidden md:block whitespace-nowrap ${paso === p.num ? "text-[#13193a]" : "text-gray-400"}`}>
              {p.titulo}
            </p>
          </div>
          {i < PASOS.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${paso > p.num ? "bg-emerald-400" : "bg-gray-200"}`} />
          )}
        </Fragment>
      ))}
    </div>
  );
}
