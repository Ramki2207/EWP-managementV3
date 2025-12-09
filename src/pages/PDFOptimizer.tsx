import React, { useState } from 'react';
import { FileText, RefreshCw, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { regenerateTestCertificatePDFs, getTestCertificateStats } from '../lib/pdfOptimizer';
import toast from 'react-hot-toast';

const PDFOptimizer: React.FC = () => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const statsData = await getTestCertificateStats();
      setStats(statsData);
    } catch (error) {
      toast.error('Fout bij laden statistieken');
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Weet u zeker dat u alle test certificaten wilt regenereren? Dit kan enkele minuten duren.')) {
      return;
    }

    setIsRegenerating(true);
    setResult(null);

    try {
      toast.loading('Bezig met regenereren van PDFs...', { duration: 10000 });
      const regenerationResult = await regenerateTestCertificatePDFs();
      setResult(regenerationResult);

      toast.dismiss();
      if (regenerationResult.success > 0) {
        toast.success(`${regenerationResult.success} PDFs succesvol geregenereerd!`);
      }
      if (regenerationResult.failed > 0) {
        toast.error(`${regenerationResult.failed} PDFs mislukt`);
      }

      await loadStats();
    } catch (error: any) {
      toast.dismiss();
      toast.error('Fout bij regenereren PDFs: ' + error.message);
      console.error(error);
    } finally {
      setIsRegenerating(false);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const calculateSavings = () => {
    if (!result) return null;
    const saved = result.totalSizeBefore - result.totalSizeAfter;
    const percentage = ((saved / result.totalSizeBefore) * 100).toFixed(1);
    return { saved, percentage };
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Optimizer</h1>
        <p className="text-gray-600">
          Optimaliseer bestaande test certificaten door ze opnieuw te genereren met gecomprimeerde afbeeldingen
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-blue-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
            <p className="text-sm text-gray-600">Totaal PDFs</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="text-orange-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSizeMB} MB</p>
            <p className="text-sm text-gray-600">Totale grootte</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-purple-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgSizeMB} MB</p>
            <p className="text-sm text-gray-600">Gemiddelde grootte</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.maxSizeMB} MB</p>
            <p className="text-sm text-gray-600">Grootste PDF</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Regenereren</h2>
        <p className="text-gray-600 mb-4">
          Deze actie zal alle test certificaten opnieuw genereren met geoptimaliseerde afbeeldingen.
          De originele test data wordt gebruikt om nieuwe, kleinere PDFs te maken.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-yellow-900 mb-1">Let op</p>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Dit proces kan enkele minuten duren</li>
                <li>• De originele PDFs worden overschreven</li>
                <li>• Verwachte besparing: 90-95% kleinere bestanden</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || loadingStats}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={isRegenerating ? 'animate-spin' : ''} size={20} />
          {isRegenerating ? 'Bezig met regenereren...' : 'Start regenereren'}
        </button>
      </div>

      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Resultaat</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600" size={20} />
                <p className="font-semibold text-green-900">Succesvol</p>
              </div>
              <p className="text-2xl font-bold text-green-900">{result.success}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-red-600" size={20} />
                <p className="font-semibold text-red-900">Mislukt</p>
              </div>
              <p className="text-2xl font-bold text-red-900">{result.failed}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-gray-600" size={20} />
                <p className="font-semibold text-gray-900">Overgeslagen</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{result.skipped}</p>
            </div>
          </div>

          {calculateSavings() && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-lg mb-3">Besparing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Voor</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatBytes(result.totalSizeBefore)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Na</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatBytes(result.totalSizeAfter)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bespaard</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatBytes(calculateSavings()!.saved)} ({calculateSavings()!.percentage}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Fouten</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.errors.map((err: any, idx: number) => (
                  <div key={idx} className="text-sm text-red-800 bg-white p-2 rounded">
                    <p className="font-medium">Document ID: {err.docId}</p>
                    <p className="text-red-600">{err.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFOptimizer;
