import React from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaIndustry, FaListUl } from 'react-icons/fa';

function toDisplayDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function ProductStageEventsSection({ stageEvents, stages }) {
  const normalized = Array.isArray(stageEvents) && stageEvents.length > 0
    ? stageEvents
    : Array.isArray(stages)
      ? stages.map((stage, index) => ({
          stage,
          timestamp: null,
          actor: 'system',
          location: null,
          notes: index === stages.length - 1 ? 'Current stage' : ''
        }))
      : [];

  if (normalized.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <FaListUl className="text-indigo-500" />
        Stage Events
      </h3>

      <div className="space-y-3">
        {normalized.map((event, index) => (
          <article key={`${event.stage || 'stage'}-${index}`} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {event.stage || 'Unknown Stage'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-700 dark:text-slate-300">
              <p className="flex items-center gap-2"><FaCalendarAlt className="text-slate-500" /> {toDisplayDate(event.timestamp || event.recordedAt)}</p>
              <p className="flex items-center gap-2"><FaIndustry className="text-slate-500" /> {event.actor || event.updatedBy || 'system'}</p>
              <p className="flex items-center gap-2"><FaMapMarkerAlt className="text-slate-500" /> {event.location || 'Not specified'}</p>
            </div>

            {event.notes ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{event.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductStageEventsSection;
