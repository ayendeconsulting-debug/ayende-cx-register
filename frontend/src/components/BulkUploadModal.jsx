import { useState, useRef } from 'react';
import { Upload, X, FileText, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../config/apiClient';
import toast from 'react-hot-toast';

/**
 * Bulk Upload Modal Component
 * Handles CSV/Excel file uploads for products and customers
 */
const BulkUploadModal = ({ isOpen, onClose, type = 'products', onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const config = {
    products: {
      title: 'Import Products',
      templateEndpoint: '/bulk-upload/templates/products',
      previewEndpoint: '/bulk-upload/products/preview',
      importEndpoint: '/bulk-upload/products/import',
      templateFilename: 'product_import_template.csv',
      requiredFields: 'SKU, Name, Category, Price',
    },
    customers: {
      title: 'Import Customers',
      templateEndpoint: '/bulk-upload/templates/customers',
      previewEndpoint: '/bulk-upload/customers/preview',
      importEndpoint: '/bulk-upload/customers/import',
      templateFilename: 'customer_import_template.csv',
      requiredFields: 'First Name, Last Name, Email or Phone',
    },
  };

  const currentConfig = config[type];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));

      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(ext)) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setPreview(null);
      setImportResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = fileInputRef.current;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      input.files = dataTransfer.files;
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const downloadTemplate = async () => {
    try {
      const response = await apiClient.get(currentConfig.templateEndpoint, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', currentConfig.templateFilename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setPreviewing(true);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(currentConfig.previewEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setPreview(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to preview file');
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('createCategories', 'true');
      formData.append('syncToCRM', 'true');

      const response = await apiClient.post(currentConfig.importEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setImportResult(response.data.data);
        toast.success(response.data.message);
        
        if (response.data.data.successful > 0 && onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed');
      if (error.response?.data?.data) {
        setImportResult(error.response.data.data);
      }
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{currentConfig.title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Template Download */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">Download Template</p>
                <p className="text-sm text-blue-600 mt-1">
                  Required fields: {currentConfig.requiredFields}
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            
            {file ? (
              <div className="space-y-2">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-green-700 font-medium">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setImportResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports CSV, XLSX, XLS (max 5MB)
                </p>
              </label>
            )}
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Preview Results</h3>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{preview.totalRows}</p>
                  <p className="text-sm text-gray-600">Total Rows</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{preview.validRows}</p>
                  <p className="text-sm text-green-700">Valid</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{preview.invalidRows}</p>
                  <p className="text-sm text-red-700">Invalid</p>
                </div>
              </div>

              {/* New Categories (for products) */}
              {preview.newCategories && preview.newCategories.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800">
                    New categories to be created: {preview.newCategories.join(', ')}
                  </p>
                </div>
              )}

              {/* Errors */}
              {preview.errors && preview.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {preview.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {preview.warnings && preview.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Warnings:</p>
                  <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                    {preview.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Data */}
              {preview.preview && preview.preview.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Sample data (first {preview.preview.length} rows):
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(preview.preview[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 border-b text-gray-600">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-gray-800">Import Results</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{importResult.totalProcessed}</p>
                  <p className="text-sm text-gray-600">Processed</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                  <p className="text-sm text-green-700">Created</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              </div>

              {/* Created Categories */}
              {importResult.createdCategories && importResult.createdCategories.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Categories created:</span> {importResult.createdCategories.join(', ')}
                  </p>
                </div>
              )}

              {/* Sync Info */}
              {importResult.syncQueued > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <p className="text-sm text-indigo-800">
                    <span className="font-medium">{importResult.syncQueued}</span> customers queued for CRM sync
                  </p>
                </div>
              )}

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>
          
          <div className="flex gap-3">
            {!importResult && (
              <>
                <button
                  onClick={handlePreview}
                  disabled={!file || previewing}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {previewing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Preview'
                  )}
                </button>
                
                <button
                  onClick={handleImport}
                  disabled={!file || uploading || (preview && preview.validRows === 0)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import
                    </>
                  )}
                </button>
              </>
            )}
            
            {importResult && importResult.successful > 0 && (
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
