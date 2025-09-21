'use client';

import React, { useState } from 'react';
import { StockMovementForm } from './StockMovementForm';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementType: 'in' | 'out';
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  movementType
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [movementData, setMovementData] = useState<any>(null);

  if (!isOpen) return null;

  const handleSuccess = (data: any) => {
    setMovementData(data);
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
    setMovementData(null);
    onClose();
  };

  const downloadGatePass = async () => {
    if (movementData?.movementId) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/protected/gatekeeper/gate-pass/${movementData.movementId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gate-pass-${movementData.gatePassNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          console.error('Failed to download gate pass');
        }
      } catch (error) {
        console.error('Error downloading gate pass:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Stock Movement Recorded Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                The {movementType === 'in' ? 'inbound' : 'outbound'} stock movement has been recorded and a gate pass has been generated.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h4 className="font-semibold text-gray-900 mb-4">Movement Details:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Movement ID:</span> {movementData?.movementId}
                </div>
                <div>
                  <span className="font-medium">Gate Pass Number:</span> {movementData?.gatePassNumber}
                </div>
                <div>
                  <span className="font-medium">Quantity:</span> {movementData?.data?.quantity} units
                </div>
                <div>
                  <span className="font-medium">Vehicle:</span> {movementData?.data?.vehicle_number}
                </div>
                <div>
                  <span className="font-medium">Driver:</span> {movementData?.data?.driver_name}
                </div>
                <div>
                  <span className="font-medium">Batch Number:</span> {movementData?.data?.batch_number}
                </div>
                {movementData?.data?.source && (
                  <div>
                    <span className="font-medium">Source:</span> {movementData.data.source}
                  </div>
                )}
                {movementData?.data?.destination && (
                  <div>
                    <span className="font-medium">Destination:</span> {movementData.data.destination}
                  </div>
                )}
                <div>
                  <span className="font-medium">Recorded At:</span> {new Date(movementData?.entryTime || movementData?.exitTime).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={downloadGatePass}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                📄 Download Gate Pass PDF
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {movementType === 'in' ? 'Record Inbound Stock' : 'Record Outbound Stock'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <StockMovementForm
              movementType={movementType}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
};
