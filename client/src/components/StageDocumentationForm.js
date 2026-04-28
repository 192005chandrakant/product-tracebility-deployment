import React from 'react';
import StageDocumentsEditor from './StageDocumentsEditor';

function StageDocumentationForm({
  stage,
  title,
  subtitle,
  description,
  documents,
  setDocuments,
  validationErrors,
  enforceVerification,
  optionalLabel
}) {
  const resolvedDescription = subtitle || description || 'Attach optional supporting documents for this stage.';
  const resolvedOptionalLabel = enforceVerification
    ? 'Documents added here will be verified when possible.'
    : optionalLabel || 'Documents are optional, but if you add one it will be verified when possible.';

  return (
    <div className="space-y-3">
      <StageDocumentsEditor
        stage={stage}
        documents={documents}
        onChange={setDocuments}
        title={title || 'Stage Documentation'}
        description={resolvedDescription}
        optionalLabel={resolvedOptionalLabel}
      />

      {Array.isArray(validationErrors) && validationErrors.length > 0 ? (
        <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Document Validation</p>
          <ul className="space-y-1 text-sm text-rose-900 dark:text-rose-100">
            {validationErrors.map((error, index) => (
              <li key={`${index}-${error}`}>- {error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default StageDocumentationForm;
