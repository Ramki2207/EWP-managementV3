import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ChecklistItem {
  id: string;
  question: string;
  checked: boolean | 'n.v.t';
  comments: string;
  approved?: boolean | null | 'n.v.t';
  testerComments?: string;
}

interface ApprovalData {
  submittedBy: string;
  submittedAt: string;
  reviewedBy: string;
  reviewedAt: string;
  overallApproval: boolean | null;
  generalComments: string;
  status: 'draft' | 'submitted' | 'reviewed';
}

export const openChecklistInNewWindow = (
  distributor: any,
  checklist: ChecklistItem[],
  approvalData: ApprovalData,
  currentUser: any,
  viewMode: 'form' | 'review',
  onUpdate: (checklist: ChecklistItem[], approvalData: ApprovalData) => void
) => {
  const windowFeatures = 'width=1200,height=900,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
  const newWindow = window.open('', '_blank', windowFeatures);

  if (!newWindow) {
    alert('Pop-up geblokkeerd. Sta pop-ups toe voor deze site.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pre-Testing Checklist - ${distributor.distributor_id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: #0f1419;
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .checklist-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }
    @media print {
      .no-print { display: none; }
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="checklist-container">
    <!-- Header -->
    <div class="bg-[#1a1f2e] rounded-lg p-6 mb-6 shadow-xl border border-gray-700">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">
            Pre-Testing Checklist - ${distributor.distributor_id}
          </h1>
          <p class="text-gray-400 text-lg">${distributor.kast_naam || 'Naamloos'}</p>
        </div>
        <button onclick="window.print()" class="no-print px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Printen
        </button>
      </div>

      ${approvalData.status === 'reviewed' ? `
        <div class="${approvalData.overallApproval ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'} p-4 rounded-lg mt-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-semibold text-white">
              ${approvalData.overallApproval ? '✓ Goedgekeurd voor testen' : '✗ Afgekeurd - aanpassingen nodig'}
            </span>
          </div>
          <p class="text-sm text-gray-300">
            Beoordeeld door: ${approvalData.reviewedBy} op ${new Date(approvalData.reviewedAt).toLocaleString('nl-NL')}
          </p>
        </div>
      ` : ''}
    </div>

    <!-- Checklist Items -->
    <div class="space-y-4">
      ${checklist.map((item, index) => `
        <div class="bg-[#252d3d] rounded-lg p-6 shadow-lg border border-gray-700/50">
          <div class="flex items-start gap-4">
            <span class="text-gray-400 font-mono text-lg font-semibold">${index + 1}.</span>
            <div class="flex-1">
              <p class="text-white text-lg mb-4 font-medium">${item.question}</p>

              <!-- Montage Antwoord -->
              <div class="mb-3">
                <div class="text-sm text-gray-400 mb-2">Montage antwoord:</div>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2">
                    <input type="radio" ${item.checked === true ? 'checked' : ''} disabled class="w-4 h-4">
                    <span class="text-sm ${item.checked === true ? 'text-green-400 font-semibold' : 'text-gray-400'}">Ja</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="radio" ${item.checked === false ? 'checked' : ''} disabled class="w-4 h-4">
                    <span class="text-sm ${item.checked === false ? 'text-red-400 font-semibold' : 'text-gray-400'}">Nee</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="radio" ${item.checked === 'n.v.t' ? 'checked' : ''} disabled class="w-4 h-4">
                    <span class="text-sm ${item.checked === 'n.v.t' ? 'text-gray-300 font-semibold' : 'text-gray-400'}">N.V.T.</span>
                  </label>
                </div>
              </div>

              ${item.comments ? `
                <div class="bg-[#1a1f2e] p-3 rounded mb-3">
                  <p class="text-sm text-gray-400 mb-1">Opmerkingen montage:</p>
                  <p class="text-sm text-gray-300">${item.comments}</p>
                </div>
              ` : ''}

              ${approvalData.reviewedAt ? `
                <div class="pt-3 border-t border-gray-700 mt-3">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm text-gray-400">Tester beoordeling:</span>
                    <span class="px-3 py-1 rounded text-sm font-semibold ${
                      item.approved === true ? 'bg-green-500/20 text-green-400' :
                      item.approved === false ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }">
                      ${item.approved === true ? 'Goedgekeurd' : item.approved === false ? 'Afgekeurd' : 'N.V.T.'}
                    </span>
                  </div>
                  ${item.testerComments ? `
                    <div class="bg-[#1a1f2e] p-3 rounded">
                      <p class="text-sm text-gray-400 mb-1">Opmerkingen tester:</p>
                      <p class="text-sm text-gray-300">${item.testerComments}</p>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    ${approvalData.generalComments ? `
      <div class="bg-[#1a1f2e] rounded-lg p-6 mt-6 shadow-xl border border-gray-700">
        <h3 class="text-white font-semibold mb-2">Algemene opmerkingen:</h3>
        <p class="text-gray-300">${approvalData.generalComments}</p>
      </div>
    ` : ''}

    <!-- Footer Info -->
    <div class="bg-[#1a1f2e] rounded-lg p-6 mt-6 shadow-xl border border-gray-700">
      <div class="grid grid-cols-2 gap-4 text-sm">
        ${approvalData.submittedBy ? `
          <div>
            <span class="text-gray-400">Ingediend door:</span>
            <span class="text-white ml-2 font-semibold">${approvalData.submittedBy}</span>
          </div>
        ` : ''}
        ${approvalData.submittedAt ? `
          <div>
            <span class="text-gray-400">Ingediend op:</span>
            <span class="text-white ml-2">${new Date(approvalData.submittedAt).toLocaleString('nl-NL')}</span>
          </div>
        ` : ''}
        ${approvalData.reviewedBy ? `
          <div>
            <span class="text-gray-400">Beoordeeld door:</span>
            <span class="text-white ml-2 font-semibold">${approvalData.reviewedBy}</span>
          </div>
        ` : ''}
        ${approvalData.reviewedAt ? `
          <div>
            <span class="text-gray-400">Beoordeeld op:</span>
            <span class="text-white ml-2">${new Date(approvalData.reviewedAt).toLocaleString('nl-NL')}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="no-print mt-6 flex justify-center">
      <button onclick="window.close()" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
        Sluiten
      </button>
    </div>
  </div>
</body>
</html>
  `;

  newWindow.document.write(html);
  newWindow.document.close();
};
