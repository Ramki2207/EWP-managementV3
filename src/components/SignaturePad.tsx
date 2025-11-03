import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onSignatureComplete: (signature: string) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ 
  onSignatureComplete, 
  onCancel, 
  disabled = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add signature line and text
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 160);
    ctx.lineTo(550, 160);
    ctx.stroke();

    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.fillText('Handtekening klant', 50, 180);
    ctx.fillText('Datum: ' + new Date().toLocaleDateString('nl-NL'), 450, 180);

    // Reset drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    setIsDrawing(true);
    setHasSignature(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    if (hasSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL('image/png');
        onSignatureComplete(dataURL);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw signature line and text
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 160);
    ctx.lineTo(550, 160);
    ctx.stroke();

    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.fillText('Handtekening klant', 50, 180);
    ctx.fillText('Datum: ' + new Date().toLocaleDateString('nl-NL'), 450, 180);

    // Reset drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    setHasSignature(false);
    onCancel();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataURL = canvas.toDataURL('image/png');
    onSignatureComplete(dataURL);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border-2 border-gray-300">
        <canvas
          ref={canvasRef}
          className={`border border-gray-300 rounded cursor-crosshair ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            width: '100%', 
            height: '200px',
            touchAction: 'none'
          }}
        />
      </div>

      <div className="flex justify-center items-center">
        <button
          type="button"
          onClick={clearSignature}
          className="btn-secondary flex items-center space-x-2"
          disabled={disabled}
        >
          <RotateCcw size={16} />
          <span>Wissen</span>
        </button>
      </div>

      <div className="text-xs text-gray-400 text-center">
        💡 Teken uw handtekening in het witte vlak hierboven
      </div>
    </div>
  );
};

export default SignaturePad;