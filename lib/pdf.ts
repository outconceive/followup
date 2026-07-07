import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { colors } from '../constants/theme';

export async function exportPdf(summary: string): Promise<void> {
  const lines = summary.split('\n');
  const htmlLines = lines.map(line => {
    if (line.startsWith('═') || line.startsWith('─')) {
      return '<hr style="border:none;border-top:1px solid #ccc;margin:8px 0;">';
    }
    if (line.startsWith('──') && line.endsWith('──')) {
      const section = line.replace(/[─\s]/g, '').trim();
      return `<h3 style="color:#333;font-size:13px;margin:16px 0 6px 0;text-transform:uppercase;letter-spacing:1px;">${section}</h3>`;
    }
    if (line.startsWith('•')) {
      return `<p style="margin:3px 0 3px 12px;font-size:12px;line-height:1.5;">${escapeHtml(line)}</p>`;
    }
    if (line.trim() === '') {
      return '<br>';
    }
    if (line.includes('COMPANION OBSERVATION RECORD')) {
      return `<h1 style="text-align:center;font-size:16px;margin:0;">${escapeHtml(line.trim())}</h1>`;
    }
    return `<p style="margin:2px 0;font-size:12px;line-height:1.5;">${escapeHtml(line)}</p>`;
  });

  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
            padding: 24px;
            color: #222;
            max-width: 600px;
            margin: 0 auto;
          }
          @media print {
            body { padding: 12px; }
          }
        </style>
      </head>
      <body>
        ${htmlLines.join('\n')}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (isSharingAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Companion Observation Record',
      UTI: 'com.adobe.pdf',
    });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
