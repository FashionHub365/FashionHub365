import React from "react";

const AdminUnavailablePanel = ({ title, apiNeeded = [], notes = [] }) => {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">
        Real data cannot be loaded yet because the backend does not provide the required admin endpoint.
      </p>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Required APIs</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
          {apiNeeded.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {notes.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
            {notes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default AdminUnavailablePanel;
