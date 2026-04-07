import React, { useEffect, useState } from 'react';
import { aiChat } from '../utils/aiApi';
import AIStructuredResponse from './AIStructuredResponse';

function AIProductChatPanel({ productId }) {
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setReply('');
    setError('');
    setChatHistory([]);
    setQuestion('');
  }, [productId]);

  const handleAsk = async (event) => {
    event.preventDefault();
    setError('');
    setReply('');

    if (!productId) {
      setError('Product ID is required');
      return;
    }

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    try {
      const response = await aiChat({
        productId,
        question: question.trim(),
        chatHistory
      });

      if (response && response.success && response.data) {
        const finalReply = response.data.reply || 'No response received.';
        setReply(finalReply);
        setChatHistory((previous) => {
          const next = [
            ...previous,
            { role: 'user', message: question.trim() },
            { role: 'assistant', message: finalReply }
          ];
          return next.slice(-8);
        });
        setQuestion('');
      } else {
        setError((response && response.message) || 'Unable to get AI response');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4 border rounded-lg bg-white dark:bg-gray-900">
      <h3 className="text-lg font-semibold mb-3">Ask AI About This Product</h3>
      <form onSubmit={handleAsk} className="space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about certifications, origin, or lifecycle stages"
          className="w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-800"
          rows={4}
          maxLength={800}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Asking...' : 'Ask AI'}
        </button>
      </form>

      {chatHistory.length > 0 ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Context memory active for this product chat ({Math.ceil(chatHistory.length / 2)} turn(s)).
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {reply ? (
        <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950">
          <AIStructuredResponse
            content={reply}
            fallbackTitle="AI Guidance"
            titleClassName="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"
            bodyClassName="text-sm leading-6 text-blue-900 dark:text-blue-100"
          />
        </div>
      ) : null}
    </section>
  );
}

export default AIProductChatPanel;
