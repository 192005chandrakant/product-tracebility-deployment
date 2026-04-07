import React from 'react';
import { FaPlus, FaTrash, FaFileUpload, FaShieldAlt } from 'react-icons/fa';

const DOCUMENT_TYPES = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'compliance_certificate', label: 'Compliance Certificate' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'batch_report', label: 'Batch Report' },
  { value: 'shipping_document', label: 'Shipping Document' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' }
];

const DEFAULT_DOCUMENT = (stage) => ({
  stage: stage || '',
  documentType: 'certificate',
  title: '',
  standardCode: '',
  documentReference: '',
  issuingAuthority: '',
  issuerCountry: '',
  complianceScope: '',
  documentVersion: '1.0',
  certificateNumber: '',
  batchNumber: '',
  lotNumber: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
  verificationNotes: '',
  requiresVerification: true,
  file: null,
  fileName: ''
});

function StageDocumentsEditor({
  stage,
  documents = [],
  onChange,
  title = 'Stage Documentation',
  description = 'Attach optional supporting documents for verification at this stage.',
  optionalLabel = 'Documents are optional, but if you add one it will be verified when possible.'
}) {
  const normalizedDocuments = Array.isArray(documents) ? documents : [];

  const updateDocument = (index, patch) => {
    const nextDocuments = normalizedDocuments.map((document, currentIndex) => {
      if (currentIndex !== index) {
        return document;
      }
      return {
        ...document,
        ...patch
      };
    });
    onChange(nextDocuments);
  };

  const addDocument = () => {
    onChange([...normalizedDocuments, DEFAULT_DOCUMENT(stage)]);
  };

  const removeDocument = (index) => {
    const nextDocuments = normalizedDocuments.filter((_, currentIndex) => currentIndex !== index);
    onChange(nextDocuments);
  };

  const handleFileChange = (index, file) => {
    updateDocument(index, {
      file: file || null,
      fileName: file ? file.name : ''
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-lg p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold mb-2">
            <FaShieldAlt /> Optional Verification Documents
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{description}</p>
        </div>

        <button
          type="button"
          onClick={addDocument}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          Add Document
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{optionalLabel}</p>

      {normalizedDocuments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-5 text-sm text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/60">
          No documents added yet. Use <span className="font-semibold">Add Document</span> to attach a certificate, report, or other supporting file for this stage.
        </div>
      ) : (
        <div className="space-y-5">
          {normalizedDocuments.map((document, index) => (
            <article key={`${index}-${document.documentReference || document.title || 'doc'}`} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/70 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                    Document {index + 1}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Stage: {stage || document.stage || 'Unassigned'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                >
                  <FaTrash />
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Document Type</span>
                  <select
                    value={document.documentType || 'certificate'}
                    onChange={(event) => updateDocument(index, { documentType: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  >
                    {DOCUMENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Title</span>
                  <input
                    type="text"
                    value={document.title || ''}
                    onChange={(event) => updateDocument(index, { title: event.target.value })}
                    placeholder="Document title"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Standard Code</span>
                  <input
                    type="text"
                    value={document.standardCode || ''}
                    onChange={(event) => updateDocument(index, { standardCode: event.target.value })}
                    placeholder="ISO 9001, HACCP, FSSAI, etc."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Document Reference</span>
                  <input
                    type="text"
                    value={document.documentReference || ''}
                    onChange={(event) => updateDocument(index, { documentReference: event.target.value })}
                    placeholder="Unique reference or certificate number"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Issuing Authority</span>
                  <input
                    type="text"
                    value={document.issuingAuthority || ''}
                    onChange={(event) => updateDocument(index, { issuingAuthority: event.target.value })}
                    placeholder="Lab, board, or authority name"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Issuer Country</span>
                  <input
                    type="text"
                    value={document.issuerCountry || ''}
                    onChange={(event) => updateDocument(index, { issuerCountry: event.target.value })}
                    placeholder="Country code or name"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Compliance Scope</span>
                  <input
                    type="text"
                    value={document.complianceScope || ''}
                    onChange={(event) => updateDocument(index, { complianceScope: event.target.value })}
                    placeholder="What this document proves or covers"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Document Version</span>
                  <input
                    type="text"
                    value={document.documentVersion || ''}
                    onChange={(event) => updateDocument(index, { documentVersion: event.target.value })}
                    placeholder="1.0"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Certificate Number</span>
                  <input
                    type="text"
                    value={document.certificateNumber || ''}
                    onChange={(event) => updateDocument(index, { certificateNumber: event.target.value })}
                    placeholder="Optional certificate number"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Batch Number</span>
                  <input
                    type="text"
                    value={document.batchNumber || ''}
                    onChange={(event) => updateDocument(index, { batchNumber: event.target.value })}
                    placeholder="Batch number"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Lot Number</span>
                  <input
                    type="text"
                    value={document.lotNumber || ''}
                    onChange={(event) => updateDocument(index, { lotNumber: event.target.value })}
                    placeholder="Lot number"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Issue Date</span>
                  <input
                    type="date"
                    value={document.issueDate || ''}
                    onChange={(event) => updateDocument(index, { issueDate: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Expiry Date</span>
                  <input
                    type="date"
                    value={document.expiryDate || ''}
                    onChange={(event) => updateDocument(index, { expiryDate: event.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Notes</span>
                  <textarea
                    value={document.notes || ''}
                    onChange={(event) => updateDocument(index, { notes: event.target.value })}
                    rows={3}
                    placeholder="Optional notes about this document"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Verification Notes</span>
                  <textarea
                    value={document.verificationNotes || ''}
                    onChange={(event) => updateDocument(index, { verificationNotes: event.target.value })}
                    rows={3}
                    placeholder="Optional reviewer notes or document context"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="md:col-span-2 inline-flex items-center gap-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={!!document.requiresVerification}
                    onChange={(event) => updateDocument(index, { requiresVerification: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Require AI verification for this document
                </label>

                <label className="space-y-2 text-sm md:col-span-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Upload File</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(event) => handleFileChange(index, event.target.files && event.target.files[0] ? event.target.files[0] : null)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-100 dark:hover:file:bg-slate-600"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Files are uploaded with the selected stage and can be reviewed later on the product page.</p>
                </label>

                {document.fileName ? (
                  <div className="md:col-span-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/70 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <FaFileUpload className="text-blue-500" />
                    Selected file: {document.fileName}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default StageDocumentsEditor;
