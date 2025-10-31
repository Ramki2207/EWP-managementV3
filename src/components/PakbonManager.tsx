import React, { useState, useRef } from 'react';
import { X, FileText, Printer, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import SignaturePad from './SignaturePad';
import { generatePakbonPDF } from './PakbonPDF';
import { supabase } from '../lib/supabase';

interface PakbonManagerProps {
  project: any;
  onClose: () => void;
}

const PakbonManager: React.FC<PakbonManagerProps> = ({ project, onClose }) => {
  const [selectedVerdeler, setSelectedVerdeler] = useState<any>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pickupPersonName, setPickupPersonName] = useState('');
  const [signature, setSignature] = useState('');
  const [generating, setGenerating] = useState(false);
  const signaturePadRef = useRef<any>(null);

  const verdelers = project?.distributors || [];

  const handleGeneratePakbon = (verdeler: any) => {
    setSelectedVerdeler(verdeler);
    setShowSignatureModal(true);
    setPickupPersonName('');
    setSignature('');
  };

  const handleSignatureConfirm = async () => {
    console.log('🔍 PAKBON: Starting pakbon generation with signature');
    console.log('🔍 PAKBON: Project:', project);
    console.log('🔍 PAKBON: Selected Verdeler:', selectedVerdeler);
    console.log('🔍 PAKBON: Pickup person name:', pickupPersonName);
    console.log('🔍 PAKBON: Has signature:', !!signature);

    if (!pickupPersonName.trim()) {
      toast.error('Vul de naam van de ontvanger in');
      return;
    }

    if (!signature) {
      toast.error('Plaats een handtekening');
      return;
    }

    try {
      setGenerating(true);

      console.log('🔍 PAKBON: Generating PDF...');
      const blob = await generatePakbonPDF(project, selectedVerdeler, {
        name: pickupPersonName,
        signature: signature
      });
      console.log('🔍 PAKBON: PDF generated, blob size:', blob.size);

      const verdelerName = selectedVerdeler.kast_naam || selectedVerdeler.kastNaam || 'verdeler';
      const fileName = `Pakbon_${project.project_number}_${verdelerName}_${new Date().getTime()}.pdf`;
      const filePath = `project-files/${project.id}/${selectedVerdeler.id}/Pakbon/${fileName}`;

      console.log('🔍 PAKBON: Uploading to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ PAKBON: Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ PAKBON: Upload successful!');
      toast.success('Pakbon succesvol gegenereerd en opgeslagen!');
      setShowSignatureModal(false);
      setSelectedVerdeler(null);
    } catch (error) {
      console.error('❌ PAKBON: Error generating pakbon:', error);
      toast.error('Er is een fout opgetreden bij het genereren van de pakbon: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrintPakbon = async (verdeler: any) => {
    try {
      setGenerating(true);

      const blob = await generatePakbonPDF(project, verdeler, null);

      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast.success('Pakbon wordt afgedrukt...');
    } catch (error) {
      console.error('Error printing pakbon:', error);
      toast.error('Er is een fout opgetreden bij het afdrukken van de pakbon');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!pickupPersonName.trim()) {
      toast.error('Vul de naam van de ontvanger in');
      return;
    }

    if (!signature) {
      toast.error('Plaats een handtekening');
      return;
    }

    try {
      setGenerating(true);

      const blob = await generatePakbonPDF(project, selectedVerdeler, {
        name: pickupPersonName,
        signature: signature
      });

      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast.success('Pakbon wordt afgedrukt...');
      setShowSignatureModal(false);
      setSelectedVerdeler(null);
    } catch (error) {
      console.error('Error printing pakbon:', error);
      toast.error('Er is een fout opgetreden bij het afdrukken van de pakbon');
    } finally {
      setGenerating(false);
    }
  };

  const handleSignatureChange = (dataUrl: string) => {
    setSignature(dataUrl);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-blue-400">📦 Pakbon Genereren</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Selecteer een verdeler om een pakbon te genereren of af te drukken.
            </p>
          </div>

          {verdelers.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">Geen verdelers gevonden voor dit project</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verdelers.map((verdeler: any) => (
                <div
                  key={verdeler.id}
                  className="bg-[#2A303C] rounded-lg p-4 flex items-center justify-between hover:bg-[#323944] transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {verdeler.kast_naam || 'Naamloze Verdeler'}
                    </h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Verdeler ID: {verdeler.distributor_id || '-'}</p>
                      <p>Systeem: {verdeler.systeem || '-'}</p>
                      <p>Voeding: {verdeler.voeding || '-'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 ml-4">
                    <button
                      onClick={() => handleGeneratePakbon(verdeler)}
                      className="btn-primary flex items-center space-x-2"
                      disabled={generating}
                    >
                      <FileText size={18} />
                      <span>Genereer Pakbon</span>
                    </button>
                    <button
                      onClick={() => handlePrintPakbon(verdeler)}
                      className="btn-secondary flex items-center space-x-2"
                      disabled={generating}
                    >
                      <Printer size={18} />
                      <span>Print Pakbon</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-blue-400">✍️ Ontvangstgegevens</h3>
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setSelectedVerdeler(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-gray-300 mb-4">
                  Vul de naam in van de persoon die de verdeler ophaalt en laat deze persoon
                  een handtekening plaatsen voordat de pakbon wordt gegenereerd.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Naam ontvanger <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={pickupPersonName}
                  onChange={(e) => setPickupPersonName(e.target.value)}
                  placeholder="Volledige naam"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Handtekening <span className="text-red-400">*</span>
                </label>
                <SignaturePad
                  ref={signaturePadRef}
                  onSignatureChange={handleSignatureChange}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSelectedVerdeler(null);
                  }}
                  className="btn-secondary"
                  disabled={generating}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSignatureConfirm}
                  className="btn-primary flex items-center space-x-2"
                  disabled={generating}
                >
                  <Save size={20} />
                  <span>{generating ? 'Genereren...' : 'Genereer & Opslaan'}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="btn-secondary flex items-center space-x-2"
                  disabled={generating}
                >
                  <Printer size={20} />
                  <span>{generating ? 'Afdrukken...' : 'Afdrukken'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PakbonManager;
