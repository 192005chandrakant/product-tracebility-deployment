import React, { useState } from 'react';
import { generateProductDescription } from '../utils/aiApi';
import AIStructuredResponse from './AIStructuredResponse';

function AIDescriptionGeneratorPanel({ onUseDescription }) {
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setDescription('');

    if (!keywords.trim()) {
      setError('Please enter keywords');
      return;
    }

    setLoading(true);
    try {
      const response = await generateProductDescription({
        keywords: keywords.trim(),
        tone
      });

      if (response && response.success && response.data) {
        setDescription(response.data.description || 'No description returned.');
      } else {
        setError((response && response.message) || 'Unable to generate description');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to generate description');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4 border rounded-lg cyber-glass">
      <h3 className="text-lg font-semibold mb-3 text-white">Generate Product Description</h3>
      <div className="space-y-3">
        <textarea
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          placeholder="Example: organic coffee beans, single origin, arabica, fair trade"
          className="w-full p-3 border border-white/10 rounded-md bg-white/5 text-slate-100 placeholder-slate-400"
          rows={3}
          maxLength={1200}
        />

        <label className="flex items-center gap-2 text-sm text-slate-300">
          Tone
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            className="px-2 py-1 border border-white/10 rounded-md bg-white/5 text-slate-100"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="technical">Technical</option>
            <option value="marketing">Marketing</option>
          </select>
        </label>

        <button
          type="button"
          onClick={handleGenerate}
          className="px-4 py-2 rounded-md bg-gradient-to-r from-[#2DD4BF] to-[#A855F7] text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {description ? (
        <div className="mt-4 p-3 rounded-md bg-white/5 border border-white/10">
          <AIStructuredResponse
            content={description}
            fallbackTitle="Generated Description"
            titleClassName="text-xs font-semibold uppercase tracking-wide text-teal-200"
            bodyClassName="text-sm leading-6 text-slate-200"
          />
          {typeof onUseDescription === 'function' ? (
            <button
              type="button"
              onClick={() => onUseDescription(description)}
              className="mt-3 px-4 py-2 rounded-md bg-gradient-to-r from-[#2DD4BF] to-[#A855F7] text-white"
            >
              Use in Form
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default AIDescriptionGeneratorPanel;
