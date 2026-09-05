import PDFDocument from 'pdfkit';

/**
 * Converts a numeric amount to Indian Rupee Words (e.g. "Indian Rupees Sixty-Eight Thousand Five Hundred Only").
 */
export function numberToWordsINR(num) {
  const n = Math.floor(Math.abs(Number(num) || 0));
  const paise = Math.round((Math.abs(Number(num) || 0) - n) * 100);

  if (n === 0 && paise === 0) return 'Indian Rupees Zero Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val) {
    if (val < 20) return ones[val];
    const unit = val % 10;
    return tens[Math.floor(val / 10)] + (unit ? '-' + ones[unit] : '');
  }

  function convertThreeDigits(val) {
    let str = '';
    const hundred = Math.floor(val / 100);
    const rest = val % 100;
    if (hundred > 0) {
      str += ones[hundred] + ' Hundred';
      if (rest > 0) str += ' ';
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundreds = remainder;

  if (crore > 0) {
    words += (words ? ' ' : '') + convertThreeDigits(crore) + ' Crore';
  }
  if (lakh > 0) {
    words += (words ? ' ' : '') + convertThreeDigits(lakh) + ' Lakh';
  }
  if (thousand > 0) {
    words += (words ? ' ' : '') + convertThreeDigits(thousand) + ' Thousand';
  }
  if (hundreds > 0) {
    words += (words ? ' ' : '') + convertThreeDigits(hundreds);
  }

  let result = 'Indian Rupees ' + (words.trim() || 'Zero');
  if (paise > 0) {
    result += ' and ' + convertTwoDigits(paise) + ' Paise';
  }
  result += ' Only';

  return result;
}

/**
 * Formats a number with Indian comma grouping and standard 2 decimal places.
 */
export const formatINR = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
  return 'INR ' + Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Builds a corporate Indian standard salary slip binary PDF buffer using PDFKit.
 */
export const buildCorporatePayslipPdf = async (slip) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const leftMargin = 30;
      const topMargin = 30;
      const pageWidth = 535; // 595 - 60

      // Outer Box Border
      doc.rect(leftMargin, topMargin, pageWidth, 782).lineWidth(1).strokeColor('#cbd5e1').stroke();

      // ─────────────────────────────────────────────────────────────
      // 1. COMPANY HEADER AREA
      // ─────────────────────────────────────────────────────────────
      doc.rect(leftMargin, topMargin, pageWidth, 72).fillColor('#f8fafc').fill();
      doc.rect(leftMargin, topMargin + 72, pageWidth, 1).fillColor('#cbd5e1').fill();

      // Company Name & Info
      doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('PEOPLEPAY360 TECHNOLOGIES INDIA PVT. LTD.', leftMargin + 15, topMargin + 12);
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text('Corporate Office: DLF Cyber City, Tower 4B, Phase-III, Gurugram, HR - 122002, India', leftMargin + 15, topMargin + 30);
      doc.text('CIN: U72900HR2022PTC104589 | GSTIN: 06AAACP9821L1Z4 | Email: payroll@peoplepay360.com', leftMargin + 15, topMargin + 42);
      doc.text('Web: https://peoplepay360.internal | HR Helpline: +91 (124) 492-8000', leftMargin + 15, topMargin + 54);

      // Payslip Month Badge on Right
      const monthTitle = (slip.periodName || 'October 2024').toUpperCase();
      doc.roundedRect(leftMargin + pageWidth - 165, topMargin + 10, 150, 52, 4).fillColor('#eff6ff').strokeColor('#93c5fd').lineWidth(0.8).fillAndStroke();
      doc.fillColor('#1e40af').fontSize(8).font('Helvetica-Bold').text('SALARY SLIP STATEMENT', leftMargin + pageWidth - 160, topMargin + 16, { width: 140, align: 'center' });
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(monthTitle, leftMargin + pageWidth - 160, topMargin + 28, { width: 140, align: 'center' });
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(`REF: ${slip.referenceCode || 'PAY-2024-10-84092'}`, leftMargin + pageWidth - 160, topMargin + 44, { width: 140, align: 'center' });

      // ─────────────────────────────────────────────────────────────
      // 2. EMPLOYEE & ATTENDANCE INFORMATION (4-COLUMN GRID)
      // ─────────────────────────────────────────────────────────────
      let y = topMargin + 80;
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('EMPLOYEE & ATTENDANCE INFORMATION', leftMargin + 15, y);
      y += 14;

      const empGridY = y;
      const empGridH = 76;
      doc.rect(leftMargin + 10, empGridY, pageWidth - 20, empGridH).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

      const col1X = leftMargin + 15;
      const col1ValX = col1X + 82;
      const col2X = leftMargin + 270;
      const col2ValX = col2X + 85;

      const bankAcc = slip.bankAccountNo ? `A/C ${slip.bankAccountNo}` : 'HDFC Bank - A/C 9841029412';
      const ifsc = slip.bankIfsc || 'HDFC0001824';
      const panNo = `AAAC${(slip.employeeCode || '8409').replace(/[^0-9]/g, '').padEnd(4, '9').slice(0, 4)}L`;
      const uanNo = `1014${(slip.employeeCode || '84092').replace(/[^0-9]/g, '').padEnd(8, '0').slice(0, 8)}`;
      const workedDaysVal = `${parseFloat(slip.workedDays || 22).toFixed(1)} Days (${(parseFloat(slip.workedDays || 22) * 8).toFixed(1)} hrs)`;

      const empRows = [
        { l1: 'Employee Name', v1: slip.employeeName || 'Staff Employee', l2: 'Employee Code', v2: slip.employeeCode || 'EMP-84092' },
        { l1: 'Designation', v1: slip.jobPosition || 'Software Engineer', l2: 'Department', v2: slip.department || 'Engineering' },
        { l1: 'Bank Details', v1: bankAcc, l2: 'Bank IFSC Code', v2: ifsc },
        { l1: 'PAN / Tax ID', v1: panNo, l2: 'PF / UAN No', v2: uanNo },
        { l1: 'Pay Period', v1: slip.periodLabel || '01 Oct 2024 - 31 Oct 2024', l2: 'Worked / Payable Days', v2: workedDaysVal }
      ];

      let ey = empGridY + 6;
      empRows.forEach((r) => {
        doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(r.l1 + ':', col1X, ey);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(r.v1, col1ValX, ey, { width: 165 });

        doc.fillColor('#64748b').font('Helvetica').text(r.l2 + ':', col2X, ey);
        doc.fillColor('#0f172a').font('Helvetica-Bold').text(r.v2, col2ValX, ey, { width: 165 });
        
        ey += 13.5;
      });

      // ─────────────────────────────────────────────────────────────
      // 3. ITEMIZED EARNINGS & DEDUCTIONS SIDE-BY-SIDE TABLES
      // ─────────────────────────────────────────────────────────────
      y = empGridY + empGridH + 12;

      const tableW = (pageWidth - 26) / 2; // ~254.5
      const earnX = leftMargin + 10;
      const dedX = earnX + tableW + 6;
      const tableH = 150;

      // Earnings Header Bar
      doc.rect(earnX, y, tableW, 20).fillColor('#1e293b').fill();
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text('EARNINGS BREAKDOWN', earnX + 8, y + 6);
      doc.text('AMOUNT (INR)', earnX + tableW - 85, y + 6, { width: 77, align: 'right' });

      // Deductions Header Bar
      doc.rect(dedX, y, tableW, 20).fillColor('#1e293b').fill();
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text('DEDUCTIONS & TAXES', dedX + 8, y + 6);
      doc.text('AMOUNT (INR)', dedX + tableW - 85, y + 6, { width: 77, align: 'right' });

      // Table Body Outlines
      doc.rect(earnX, y + 20, tableW, tableH).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
      doc.rect(dedX, y + 20, tableW, tableH).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

      const earnings = (slip.earningsBreakdown && slip.earningsBreakdown.length > 0) ? slip.earningsBreakdown : [
        { name: 'Basic Salary (Full-Time)', amount: slip.grossEarnings * 0.70 },
        { name: 'House Rent Allowance (HRA)', amount: slip.grossEarnings * 0.18 },
        { name: 'Special Allowance', amount: slip.grossEarnings * 0.08 },
        { name: 'Conveyance Allowance', amount: slip.grossEarnings * 0.04 }
      ];

      const deductions = (slip.deductionsBreakdown && slip.deductionsBreakdown.length > 0) ? slip.deductionsBreakdown : [
        { name: 'Employee Provident Fund (EPF 12%)', amount: slip.totalDeductions * 0.50 },
        { name: 'Tax Deducted at Source (TDS)', amount: slip.totalDeductions * 0.35 },
        { name: 'Professional Tax (PT)', amount: Math.min(200, slip.totalDeductions * 0.15) }
      ];

      const maxRows = Math.max(earnings.length, deductions.length, 5);
      const rowHeight = tableH / maxRows;

      let ty = y + 24;
      for (let i = 0; i < maxRows; i++) {
        const e = earnings[i];
        const d = deductions[i];

        if (i % 2 === 1) {
          doc.rect(earnX + 1, ty - 3, tableW - 2, rowHeight - 1).fillColor('#f8fafc').fill();
          doc.rect(dedX + 1, ty - 3, tableW - 2, rowHeight - 1).fillColor('#f8fafc').fill();
        }

        if (e) {
          doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(e.name, earnX + 8, ty, { width: 155 });
          doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatINR(e.amount), earnX + tableW - 85, ty, { width: 77, align: 'right' });
        }

        if (d) {
          doc.fillColor('#334155').fontSize(7.5).font('Helvetica').text(d.name, dedX + 8, ty, { width: 155 });
          doc.fillColor('#dc2626').font('Helvetica-Bold').text(`-${formatINR(Math.abs(d.amount))}`, dedX + tableW - 85, ty, { width: 77, align: 'right' });
        }

        ty += rowHeight;
      }

      // Subtotals Bar
      const subY = y + 20 + tableH;
      doc.rect(earnX, subY, tableW, 22).fillColor('#f1f5f9').strokeColor('#cbd5e1').lineWidth(0.5).fillAndStroke();
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text('TOTAL GROSS EARNINGS (A)', earnX + 8, subY + 6);
      doc.text(formatINR(slip.grossEarnings), earnX + tableW - 85, subY + 6, { width: 77, align: 'right' });

      doc.rect(dedX, subY, tableW, 22).fillColor('#fef2f2').strokeColor('#fca5a5').lineWidth(0.5).fillAndStroke();
      doc.fillColor('#991b1b').fontSize(8).font('Helvetica-Bold').text('TOTAL DEDUCTIONS (B)', dedX + 8, subY + 6);
      doc.text(`-${formatINR(slip.totalDeductions)}`, dedX + tableW - 85, subY + 6, { width: 77, align: 'right' });

      // ─────────────────────────────────────────────────────────────
      // 4. NET TAKE-HOME SALARY HIGHLIGHT CALLOUT BOX
      // ─────────────────────────────────────────────────────────────
      y = subY + 30;
      doc.roundedRect(leftMargin + 10, y, pageWidth - 20, 56, 4).fillColor('#f0fdf4').strokeColor('#86efac').lineWidth(1).fillAndStroke();

      doc.fillColor('#15803d').fontSize(9).font('Helvetica-Bold').text('NET TAKE-HOME REMITTANCE (A - B)', leftMargin + 20, y + 10);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text('Amount in Words:', leftMargin + 20, y + 24);
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(numberToWordsINR(slip.netTakeHomePay), leftMargin + 92, y + 24, { width: 275 });
      
      const disbursalText = slip.disbursalBankText || 'Direct Deposit transferred to Bank Account via NEFT/RTGS';
      doc.fillColor('#166534').fontSize(7).font('Helvetica').text(`Disbursal Mode: ${disbursalText}`, leftMargin + 20, y + 39);

      // Big Net Pay
      doc.fillColor('#15803d').fontSize(16).font('Helvetica-Bold').text(formatINR(slip.netTakeHomePay), leftMargin + pageWidth - 170, y + 18, { width: 150, align: 'right' });

      // ─────────────────────────────────────────────────────────────
      // 5. STATUTORY & TAX COMPLIANCE SUMMARY
      // ─────────────────────────────────────────────────────────────
      y += 66;
      doc.rect(leftMargin + 10, y, pageWidth - 20, 36).fillColor('#f8fafc').strokeColor('#e2e8f0').lineWidth(0.5).fillAndStroke();
      doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold').text('STATUTORY & TAX COMPLIANCE SUMMARY', leftMargin + 18, y + 6);
      
      const epfEmployerEst = (slip.grossEarnings * 0.70 * 0.12);
      doc.fillColor('#64748b').fontSize(6.8).font('Helvetica').text(`• Employer PF Contribution: ${formatINR(epfEmployerEst)} (EPF 3.67% + EPS 8.33%)   • Tax Regime: New Tax Regime (Section 115BAC)`, leftMargin + 18, y + 16);
      doc.text('• Form 16 Part B tax computation is mapped as per IT Department guidelines. Keep this statement for IT returns filing.', leftMargin + 18, y + 25);

      // ─────────────────────────────────────────────────────────────
      // 6. SIGNATURE & VERIFICATION SECTION
      // ─────────────────────────────────────────────────────────────
      y += 44;
      const signBoxW = (pageWidth - 26) / 2;
      doc.rect(leftMargin + 10, y, signBoxW, 54).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.rect(leftMargin + 10 + signBoxW + 6, y, signBoxW, 54).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

      // Left Sign Box
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('Employee Acknowledgement:', leftMargin + 16, y + 6);
      doc.text('I confirm the receipt of salary and agree with attendance/leave calculations.', leftMargin + 16, y + 16, { width: 230 });
      doc.fillColor('#94a3b8').fontSize(6.5).text('Digital confirmation recorded on portal release.', leftMargin + 16, y + 40);

      // Right Sign Box
      const signX = leftMargin + 10 + signBoxW + 6;
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text('For PEOPLEPAY360 TECHNOLOGIES INDIA PVT. LTD.', signX + 8, y + 6);
      doc.fillColor('#1e40af').fontSize(8.5).font('Helvetica-Bold').text('Aditya Sharma', signX + 8, y + 22);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('Head of Payroll & HR Compliance (Authorized Signatory)', signX + 8, y + 34);

      // ─────────────────────────────────────────────────────────────
      // 7. BOTTOM DISCLAIMER
      // ─────────────────────────────────────────────────────────────
      y += 62;
      doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica').text(
        'This is a computer-generated salary slip and does not require a physical signature. For payroll inquiries, please contact payroll-helpdesk@peoplepay360.com within 7 days of statement release.',
        leftMargin + 15,
        y,
        { width: pageWidth - 30, align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
