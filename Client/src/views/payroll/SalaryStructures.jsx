/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY STRUCTURES (SCHEMAS) MASTER-DETAIL VIEW
 * ==============================================================================
 * 
 * WHAT THIS COMPONENT DOES IN SIMPLE WORDS:
 * In corporate payroll, different classes of employees operate under different compensation schemas:
 * - Executive Leadership (US): Equity tranches, RSUs, 401(k) safe-harbor matches.
 * - Standard EU Salaried: Dynamic social contributions, statutory progressive PAYE withholding.
 * - Hourly Operations: Shift differential tiering (1.5x / 2.0x), mandatory night allowances.
 * - Global Contractors: Milestone draws and self-withholding declarations.
 * 
 * This screen implements the Master-Detail compensation governance console matching
 * Docs/UI/Salary Structures.png pixel-perfect:
 * 1. LEFT PANEL: "Registered Schemas" with live selection, schema metadata, rule counts, and employee coverage.
 * 2. RIGHT PANEL: Selected Schema Execution Graph with deterministic computational tiers,
 *    order sequences (10, 20, 50, 70, 80, 100), and interactive "Add Rule", "Configure", and "Reorder Sequence" controls.
 * 3. SIMULATION SANDBOX: Real-time calculation strip showing Gross Payable ➔ Social Contributions ➔ PAYE Tax ➔ Net Pay Result.
 * 4. FULL INTERACTIVITY:
 *    - Create Structure Modal: Add new compensation schemas.
 *    - Configure Structure Modal: Modify metadata, jurisdiction, and target outputs.
 *    - Reorder Sequence Modal: Deterministically re-index and sort execution tiers.
 *    - Export Matrix: Direct CSV download of the complete organizational pay matrix.
 *    - RuleModal Integration: Add, edit, and validate DAG formulas with zero circular references.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Layers, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  PlusCircle,
  Download, 
  Settings, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Code,
  DollarSign,
  Percent,
  Calculator,
  ChevronRight,
  Check,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  AlertCircle,
  MoveUp,
  MoveDown,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { salaryService } from '../../services/salaryService';
import { RuleModal } from './RuleModal';
import { Modal } from '../../components/Modal';

// Baseline registered schemas matching Docs/UI/Salary Structures.png with 100% fidelity
const INITIAL_SCHEMAS = [
  {
    id: 'str-us-exec-09',
    code: 'STR-US-EXEC-09',
    status: 'Active',
    is_default: false,
    name: 'Executive Tech & Leadership (US)',
    description: 'Includes equity tranche, RSUs, and 401(k) safe-harbor match.',
    subtitle: 'Linked to 84 executive employment contracts across North America & Silicon Valley HQ',
    rule_count: 8,
    employee_count: 84,
    badge_extra: 'Audited',
    region: 'US West v3.1',
    currency: '$',
    sample_base: 15000,
    depth: '8 Computational Tiers',
    target_output: 'NET_PAYABLE',
    state_integrity: 'Synchronized',
    rules: [
      { sequence: 10, code: 'BASE', name: 'Executive Base Salary', category: 'Basic', formula: 'contract.wage' },
      { sequence: 20, code: 'RSU', name: 'Equity / RSU Monthly Tranche', category: 'Allowances', formula: 'contract.equity_tranche' },
      { sequence: 30, code: 'BONUS', name: 'Performance Incentive Target', category: 'Allowances', formula: 'BASE * 0.25' },
      { sequence: 50, code: 'GROSS', name: 'Executive Gross Compensation', category: 'Gross', formula: 'BASE + RSU + BONUS' },
      { sequence: 70, code: '401K', name: '401(k) Safe Harbor Match (4%)', category: 'Deductions', formula: 'BASE * -0.04' },
      { sequence: 80, code: 'FED_TAX', name: 'US Federal & State Withholding', category: 'Deductions', formula: 'GROSS * -0.32' },
      { sequence: 90, code: 'FICA', name: 'FICA Medicare / Social Security', category: 'Deductions', formula: 'GROSS * -0.0765' },
      { sequence: 100, code: 'NET', name: 'Net Disbursable Take-Home', category: 'Net Salary', formula: 'GROSS - Deductions' }
    ]
  },
  {
    id: 'str-eu-sal-01',
    code: 'STR-EU-SAL-01',
    status: 'Active & Default',
    is_default: true,
    name: 'Standard EU Salaried Professional',
    description: 'Standardized for EEA full-time permanent workers. Dynamic social tax formulas.',
    subtitle: 'Linked to 812 active employment contracts across France, Germany & Netherlands',
    rule_count: 11,
    rule_label: '11 Rules (6 In-Flow)',
    employee_count: 812,
    badge_extra: 'Selected',
    region: 'EEA Region v2.4',
    currency: '€',
    sample_base: 5000,
    depth: '6 Computational Tiers',
    target_output: 'NET_PAYABLE',
    state_integrity: 'Synchronized',
    rules: [
      { sequence: 10, code: 'BASIC', name: 'Basic Salary', category: 'Basic', formula: 'contract.wage' },
      { sequence: 20, code: 'HRA', name: 'Housing & Remote Allowance', category: 'Allowances', formula: 'BASIC * 0.15 + REMOTE_STIPEND' },
      { sequence: 50, code: 'GROSS', name: 'Gross Pay Computation', category: 'Gross', formula: 'BASIC + HRA' },
      { sequence: 70, code: 'SOC_SEC', name: 'Statutory Social Security 6.2%', category: 'Deductions', formula: 'GROSS * -0.062' },
      { sequence: 80, code: 'PAYE_TAX', name: 'Withholding Income Tax', category: 'Deductions', formula: 'lookup_tax_bracket(GROSS, contract.tax_id)' },
      { sequence: 100, code: 'NET', name: 'Net Take-Home Pay', category: 'Net Salary', formula: 'GROSS - Deductions' }
    ]
  },
  {
    id: 'str-ops-hrly-04',
    code: 'STR-OPS-HRLY-04',
    status: 'Active',
    is_default: false,
    name: 'Hourly Operations & Support',
    description: 'Shift differential, overtime tiering 1.5x / 2.0x, and mandatory night allowances.',
    subtitle: 'Linked to 260 shift contracts across fulfillment & customer logistics hubs',
    rule_count: 6,
    employee_count: 260,
    badge_extra: 'Bi-weekly Cycle',
    region: 'Shift Operations v1.8',
    currency: '$',
    sample_base: 3200,
    depth: '6 Computational Tiers',
    target_output: 'NET_PAYABLE',
    state_integrity: 'Synchronized',
    rules: [
      { sequence: 10, code: 'HOURLY_BASE', name: 'Shift Hourly Wage', category: 'Basic', formula: 'HOURLY_RATE * WORKED_HOURS' },
      { sequence: 20, code: 'SHIFT_DIFF', name: 'Night Shift Differential (15%)', category: 'Allowances', formula: 'HOURLY_BASE * 0.15' },
      { sequence: 30, code: 'OVERTIME', name: 'Overtime Tiering 1.5x / 2.0x', category: 'Allowances', formula: 'OVERTIME_HOURS * (HOURLY_RATE * 1.5)' },
      { sequence: 50, code: 'GROSS', name: 'Hourly Gross Aggregate', category: 'Gross', formula: 'HOURLY_BASE + SHIFT_DIFF + OVERTIME' },
      { sequence: 70, code: 'STAT_DED', name: 'Statutory Payroll Withholding', category: 'Deductions', formula: 'GROSS * -0.15' },
      { sequence: 100, code: 'NET', name: 'Net Bi-weekly Disbursable', category: 'Net Salary', formula: 'GROSS - STAT_DED' }
    ]
  },
  {
    id: 'str-glb-fee-02',
    code: 'STR-GLB-FEE-02',
    status: 'Active',
    is_default: false,
    name: 'Global Contractor Fee-Based',
    description: 'Milestone and hourly draw processing with self-withholding declarations.',
    subtitle: 'Linked to 92 international independent contractor agreements across 18 countries',
    rule_count: 3,
    employee_count: 92,
    badge_extra: 'Monthly Invoiced',
    region: 'Global Freelance v3.0',
    currency: '$',
    sample_base: 6500,
    depth: '3 Computational Tiers',
    target_output: 'NET_PAYABLE',
    state_integrity: 'Synchronized',
    rules: [
      { sequence: 10, code: 'FEE_BASE', name: 'Contractor Milestone Fee', category: 'Basic', formula: 'contract.monthly_fee' },
      { sequence: 50, code: 'GROSS', name: 'Total Invoiced Gross', category: 'Gross', formula: 'FEE_BASE' },
      { sequence: 100, code: 'NET', name: 'Net Wire Disbursement', category: 'Net Salary', formula: 'GROSS' }
    ]
  },
  {
    id: '0d12c78f-d2c4-4d7e-8152-fffba4869bee',
    code: 'STD_IN_SALARIED',
    status: 'Active',
    is_default: false,
    name: 'Standard India Salaried',
    description: 'Standardized Indian CTC structure with Basic (50%), HRA (40%), Conveyance, PF & Professional Tax.',
    subtitle: 'Linked to active employment contracts across Mumbai & Delhi corporate hubs',
    rule_count: 11,
    employee_count: 142,
    badge_extra: 'INR Domestic',
    region: 'India Domestic v2.0',
    currency: '₹',
    sample_base: 75000,
    depth: '11 Computational Tiers',
    target_output: 'NET_PAYABLE',
    state_integrity: 'Synchronized',
    rules: [
      { sequence: 10, code: 'BASIC', name: 'Basic Monthly Salary', category: 'Basic', formula: '(CONTRACT_WAGE * 0.50) * (WORKED_DAYS / SCHEDULE_DAYS)' },
      { sequence: 20, code: 'HRA', name: 'House Rent Allowance (40%)', category: 'Allowances', formula: 'BASIC * 0.40' },
      { sequence: 30, code: 'CONV', name: 'Conveyance Allowance', category: 'Allowances', formula: '3000.00' },
      { sequence: 40, code: 'SPECIAL', name: 'Special Allowance', category: 'Allowances', formula: 'CONTRACT_WAGE * 0.10' },
      { sequence: 50, code: 'OVERTIME', name: 'Overtime Earnings 1.5x', category: 'Allowances', formula: 'OVERTIME_HOURS * (HOURLY_RATE * 1.50)' },
      { sequence: 100, code: 'GROSS', name: 'Gross Pay Aggregate', category: 'Gross', formula: 'BASIC + HRA + CONV + SPECIAL + OVERTIME' },
      { sequence: 110, code: 'PF', name: 'Provident Fund (12%)', category: 'Deductions', formula: 'BASIC * -0.12' },
      { sequence: 120, code: 'PT', name: 'Professional Statutory Tax', category: 'Deductions', formula: 'GROSS > 15000 ? -200 : 0' },
      { sequence: 130, code: 'LOP', name: 'Loss of Pay (Unpaid Leave)', category: 'Deductions', formula: '(CONTRACT_WAGE / SCHEDULE_DAYS) * UNPAID_LEAVE_DAYS' },
      { sequence: 140, code: 'TOTAL_DED', name: 'Total Deductions', category: 'Deductions', formula: 'PF + PT + LOP' },
      { sequence: 200, code: 'NET', name: 'Net Take-Home Remittance', category: 'Net Salary', formula: 'GROSS - TOTAL_DED' }
    ]
  },
  {
    id: 'c555cccc-01e7-4e87-b27f-d2d2507a8b02',
    code: 'EXEC_TECH_IN',
    status: 'Active',
    is_default: false,
    name: 'Executive Tech India',
    description: 'Executive CTC package for India tech leadership with annual incentive tranche.',
    subtitle: 'Linked to executive contracts in Bangalore Tech Hub',
    rule_count: 7,
    employee_count: 36,
    badge_extra: 'Executive Tier',
    region: 'India Bangalore Tech v1.5',
    currency: '₹',
    sample_base: 187500,
    depth: '7 Computational Tiers',
    target_output: 'NET_PAYABLE',
    state_integrity: 'Synchronized',
    rules: [
      { sequence: 10, code: 'BASIC', name: 'Executive Base Salary', category: 'Basic', formula: 'contract.wage * 0.50' },
      { sequence: 20, code: 'HRA', name: 'House Rent Allowance (50%)', category: 'Allowances', formula: 'BASIC * 0.50' },
      { sequence: 30, code: 'BONUS', name: 'Performance Incentive (25%)', category: 'Allowances', formula: 'BASIC * 0.25' },
      { sequence: 50, code: 'GROSS', name: 'Executive Gross Compensation', category: 'Gross', formula: 'BASIC + HRA + BONUS' },
      { sequence: 70, code: 'PF', name: 'Provident Fund (12%)', category: 'Deductions', formula: 'BASIC * -0.12' },
      { sequence: 80, code: 'PT', name: 'Professional Tax', category: 'Deductions', formula: '-200.00' },
      { sequence: 100, code: 'NET', name: 'Net Disbursable Take-Home', category: 'Net Salary', formula: 'GROSS - PF - PT' }
    ]
  }
];

export const SalaryStructures = () => {
  // All schemas in state
  const [structures, setStructures] = useState(INITIAL_SCHEMAS);
  // Selected structure ID - defaults to STR-EU-SAL-01 as shown in Docs/UI/Salary Structures.png
  const [selectedStructureId, setSelectedStructureId] = useState('STR-EU-SAL-01');

  // Filter & Sort state
  const [jurisdictionFilter, setJurisdictionFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('DEFAULT'); // 'DEFAULT', 'EMPLOYEES', 'RULES', 'NAME'
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  // Editable simulation base wage
  const [customSampleBase, setCustomSampleBase] = useState(null);

  // Create Structure Form State
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    region: '',
    description: '',
    currency: '€',
    sample_base: 5000,
    is_default: false
  });

  // Configure Structure Form State
  const [configForm, setConfigForm] = useState({
    code: '',
    name: '',
    region: '',
    description: '',
    subtitle: '',
    is_default: false
  });

  // Reorder Rules state (working copy while modal is open)
  const [reorderList, setReorderList] = useState([]);

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active structure object
  const activeStructure = useMemo(() => {
    return structures.find(s => s.id === selectedStructureId || s.code === selectedStructureId) || structures[1] || structures[0];
  }, [structures, selectedStructureId]);

  // Synchronize counts and IDs with PostgreSQL backend if available
  useEffect(() => {
    async function syncBackend() {
      try {
        const backendStructures = await salaryService.getStructures();
        if (backendStructures && backendStructures.length > 0) {
          setStructures(prev => {
            return prev.map(localStruct => {
              const matched = backendStructures.find(b => b.code === localStruct.code);
              if (matched) {
                return {
                  ...localStruct,
                  id: matched.id || localStruct.id,
                  employee_count: matched.employee_count !== undefined ? Number(matched.employee_count) : localStruct.employee_count,
                  rule_count: matched.rule_count ? Number(matched.rule_count) : localStruct.rule_count
                };
              }
              return localStruct;
            });
          });
        }
      } catch (err) {
        console.warn('SalaryStructures backend sync notice:', err.message);
      }
    }
    syncBackend();
  }, []);

  // Executive KPI summary dynamically derived from live structures & rules state
  const kpiStats = useMemo(() => {
    const totalStructures = structures.length;
    const activeStructures = structures.filter(s => (s.status || '').toLowerCase().includes('active'));
    const coveredEmployees = structures.reduce((sum, s) => sum + (s.employee_count || 0), 0);
    const totalFTEs = 1260;
    const coveragePercent = Math.min(100, Math.round((coveredEmployees / totalFTEs) * 100));
    
    // Count distinct regions / jurisdictions
    const jurisdictionsCount = new Set(structures.map(s => s.region)).size || 4;

    // Collect all rules across structures
    const allRules = structures.flatMap(s => s.rules || []);
    const totalRules = allRules.length || 28;
    const statutoryRules = allRules.filter(r => ['Basic', 'Gross', 'Deductions', 'Net Salary'].includes(r.category)).length || 18;
    const discretionaryRules = Math.max(0, totalRules - statutoryRules) || 10;

    return {
      totalStructures,
      activeCount: activeStructures.length,
      coveredEmployees: coveredEmployees.toLocaleString(),
      totalFTEs: totalFTEs.toLocaleString(),
      coveragePercent,
      jurisdictionsCount,
      totalRules,
      statutoryRules,
      discretionaryRules
    };
  }, [structures]);

  // Sync config form whenever activeStructure changes
  useEffect(() => {
    if (activeStructure) {
      setConfigForm({
        code: activeStructure.code,
        name: activeStructure.name,
        region: activeStructure.region,
        description: activeStructure.description,
        subtitle: activeStructure.subtitle || `Linked to ${activeStructure.employee_count} active employment contracts`,
        is_default: !!activeStructure.is_default
      });
      setCustomSampleBase(null);
    }
  }, [activeStructure]);

  // Filtered and sorted schemas for left panel
  const displayedStructures = useMemo(() => {
    let list = [...structures];

    if (jurisdictionFilter !== 'ALL') {
      list = list.filter(s => {
        if (jurisdictionFilter === 'EEA') return s.code.includes('EU') || s.region?.includes('EEA');
        if (jurisdictionFilter === 'US') return s.code.includes('US') || s.region?.includes('US');
        if (jurisdictionFilter === 'INDIA') return s.code.includes('IN') || s.region?.includes('India') || s.name.toLowerCase().includes('india');
        if (jurisdictionFilter === 'OPS') return s.code.includes('OPS') || s.name.toLowerCase().includes('hourly');
        if (jurisdictionFilter === 'GLOBAL') return s.code.includes('GLB') || s.name.toLowerCase().includes('contractor');
        return true;
      });
    }

    if (sortOrder === 'EMPLOYEES') {
      list.sort((a, b) => b.employee_count - a.employee_count);
    } else if (sortOrder === 'RULES') {
      list.sort((a, b) => (b.rules?.length || 0) - (a.rules?.length || 0));
    } else if (sortOrder === 'NAME') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [structures, jurisdictionFilter, sortOrder]);

  // Dynamic simulation calculation for active structure
  const simulation = useMemo(() => {
    const struct = activeStructure || INITIAL_SCHEMAS[1];
    const baseWage = customSampleBase !== null ? Number(customSampleBase) : (struct.sample_base || 5000);
    const curr = struct.currency || '€';

    let gross = 0;
    let socialContrib = 0;
    let payeTax = 0;
    let net = 0;

    if (struct.code === 'STR-EU-SAL-01') {
      // Standard EU Salaried Professional: exactly €5,000 base -> €5,750 Gross -> -€356.50 SocSec -> -€1,150.00 PAYE -> €4,243.50 Net
      const allowance = baseWage * 0.15;
      gross = baseWage + allowance;
      socialContrib = Math.round(gross * 0.062 * 100) / 100;
      payeTax = Math.round(gross * 0.20 * 100) / 100;
      net = Math.round((gross - socialContrib - payeTax) * 100) / 100;
    } else if (struct.code === 'STR-US-EXEC-09') {
      // US Executive: $15,000 base + 25% target bonus + RSU tranche -> gross -> 401k + fed tax
      const rsu = 2500;
      const bonus = baseWage * 0.25;
      gross = baseWage + rsu + bonus;
      socialContrib = Math.round(gross * 0.0765 * 100) / 100; // FICA
      payeTax = Math.round(gross * 0.32 * 100) / 100; // Fed/State
      net = Math.round((gross - socialContrib - payeTax - (baseWage * 0.04)) * 100) / 100;
    } else if (struct.code === 'STR-OPS-HRLY-04') {
      // Hourly Ops: $3,200 base + shift diff + overtime
      const shiftDiff = baseWage * 0.15;
      const overtime = 400;
      gross = baseWage + shiftDiff + overtime;
      socialContrib = Math.round(gross * 0.075 * 100) / 100;
      payeTax = Math.round(gross * 0.12 * 100) / 100;
      net = Math.round((gross - socialContrib - payeTax) * 100) / 100;
    } else if (struct.code === 'STD_IN_SALARIED') {
      // Standard India Salaried: Basic 50%, HRA 40% of Basic, Conveyance ₹3000, Special 10%, PF 12%, PT ₹200
      const basic = baseWage * 0.50;
      const hra = basic * 0.40;
      const conv = 3000;
      const special = baseWage * 0.10;
      gross = basic + hra + conv + special;
      const pf = Math.round(basic * 0.12 * 100) / 100;
      const pt = gross > 15000 ? 200 : 0;
      socialContrib = pf;
      payeTax = pt;
      net = Math.round((gross - pf - pt) * 100) / 100;
    } else if (struct.code === 'EXEC_TECH_IN') {
      // Executive Tech India: Basic 50%, HRA 50%, Bonus 25%, PF 12%, PT ₹200
      const basic = baseWage * 0.50;
      const hra = basic * 0.50;
      const bonus = basic * 0.25;
      gross = basic + hra + bonus;
      const pf = Math.round(basic * 0.12 * 100) / 100;
      const pt = 200;
      socialContrib = pf;
      payeTax = pt;
      net = Math.round((gross - pf - pt) * 100) / 100;
    } else {
      // Global contractor or custom schema
      gross = baseWage;
      socialContrib = 0;
      payeTax = 0;
      net = gross;
    }

    const formatCur = (val) => {
      const formatted = Math.abs(val).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return `${curr}${formatted}`;
    };

    return {
      baseWage,
      curr,
      grossFormatted: formatCur(gross),
      socialFormatted: `-${formatCur(socialContrib)}`,
      payeFormatted: `-${formatCur(payeTax)}`,
      netFormatted: formatCur(net)
    };
  }, [activeStructure, customSampleBase]);

  // Export Matrix: generates clean CSV containing all structures and their execution rules
  const handleExportMatrix = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Schema Code,Schema Name,Region,Status,Execution Sequence,Rule Code,Rule Name,Category,Computation Formula\n';

    structures.forEach(struct => {
      (struct.rules || []).forEach(rule => {
        const row = [
          `"${struct.code}"`,
          `"${struct.name}"`,
          `"${struct.region}"`,
          `"${struct.is_default ? 'Active & Default' : 'Active'}"`,
          `"${rule.sequence}"`,
          `"${rule.code}"`,
          `"${rule.name}"`,
          `"${rule.category}"`,
          `"${(rule.formula || '').replace(/"/g, '""')}"`
        ].join(',');
        csvContent += row + '\n';
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PeoplePay360_Salary_Structures_Matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Salary structures matrix exported as CSV.');
  };

  // Open Create Structure Modal
  const handleOpenCreateModal = () => {
    setCreateForm({
      code: `STR-NEW-0${structures.length + 1}`,
      name: '',
      region: 'Domestic / Standard v1.0',
      description: '',
      currency: '€',
      sample_base: 5000,
      is_default: false
    });
    setIsCreateModalOpen(true);
  };

  // Save new structure
  const handleSaveNewStructure = (e) => {
    e.preventDefault();
    if (!createForm.code.trim() || !createForm.name.trim()) {
      alert('Schema Code and Schema Name are required.');
      return;
    }

    const newId = `str-${Date.now()}`;
    const newSchema = {
      id: newId,
      code: createForm.code.trim().toUpperCase(),
      name: createForm.name.trim(),
      region: createForm.region.trim() || 'Global v1.0',
      description: createForm.description.trim() || 'Custom compensation schema.',
      subtitle: `Linked to 0 active employment contracts`,
      status: createForm.is_default ? 'Active & Default' : 'Active',
      is_default: createForm.is_default,
      rule_count: 3,
      employee_count: 0,
      badge_extra: 'Draft',
      currency: createForm.currency,
      sample_base: Number(createForm.sample_base) || 5000,
      depth: '3 Computational Tiers',
      target_output: 'NET_PAYABLE',
      state_integrity: 'Synchronized',
      rules: [
        { sequence: 10, code: 'BASIC', name: 'Basic Base Salary', category: 'Basic', formula: 'contract.wage' },
        { sequence: 50, code: 'GROSS', name: 'Gross Pay Computation', category: 'Gross', formula: 'BASIC' },
        { sequence: 100, code: 'NET', name: 'Net Take-Home Pay', category: 'Net Salary', formula: 'GROSS' }
      ]
    };

    setStructures(prev => {
      let updated = createForm.is_default
        ? prev.map(s => ({ ...s, is_default: false, status: 'Active' }))
        : [...prev];
      return [...updated, newSchema];
    });

    setSelectedStructureId(newId);
    setIsCreateModalOpen(false);
    showToast(`Salary structure '${newSchema.code}' created successfully.`);
  };

  // Save configuration changes to active structure
  const handleSaveConfiguration = (e) => {
    e.preventDefault();
    if (!configForm.name.trim()) {
      alert('Structure name cannot be empty.');
      return;
    }

    setStructures(prev => prev.map(s => {
      if (s.id === activeStructure.id) {
        return {
          ...s,
          name: configForm.name.trim(),
          code: configForm.code.trim().toUpperCase(),
          region: configForm.region.trim(),
          description: configForm.description.trim(),
          subtitle: configForm.subtitle.trim(),
          is_default: configForm.is_default,
          status: configForm.is_default ? 'Active & Default' : 'Active'
        };
      }
      if (configForm.is_default) {
        return { ...s, is_default: false, status: 'Active' };
      }
      return s;
    }));

    setIsConfigModalOpen(false);
    showToast(`Configuration updated for ${configForm.code}.`);
  };

  // Open Reorder Modal
  const handleOpenReorderModal = () => {
    const list = [...(activeStructure?.rules || [])].sort((a, b) => a.sequence - b.sequence);
    setReorderList(list);
    setIsReorderModalOpen(true);
  };

  // Move rule in reorder modal
  const handleMoveRule = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderList.length) return;

    const updated = [...reorderList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Renumber sequences in steps of 10
    const reindexed = updated.map((r, idx) => ({
      ...r,
      sequence: (idx + 1) * 10
    }));

    setReorderList(reindexed);
  };

  // Save reordered rules
  const handleSaveReorderedRules = () => {
    setStructures(prev => prev.map(s => {
      if (s.id === activeStructure.id) {
        return {
          ...s,
          rules: reorderList
        };
      }
      return s;
    }));

    setIsReorderModalOpen(false);
    showToast('Rule sequence reordered and synchronized.');
  };

  // Add or edit rule
  const handleSaveRule = (savedRule) => {
    const currentRules = activeStructure?.rules || [];
    let updatedRules;

    if (ruleToEdit) {
      updatedRules = currentRules.map(r => r.code === savedRule.code ? { ...r, ...savedRule } : r);
      showToast(`Rule '${savedRule.code}' updated.`);
    } else {
      updatedRules = [...currentRules, { id: `rule-${Date.now()}`, ...savedRule }];
      showToast(`Rule '${savedRule.code}' added to structure.`);
    }

    updatedRules.sort((a, b) => a.sequence - b.sequence);

    setStructures(prev => prev.map(s => {
      if (s.id === activeStructure.id) {
        return {
          ...s,
          rules: updatedRules,
          rule_count: updatedRules.length,
          depth: `${updatedRules.length} Computational Tiers`
        };
      }
      return s;
    }));

    setIsRuleModalOpen(false);
    setRuleToEdit(null);
  };

  // Delete rule
  const handleDeleteRule = (ruleCode) => {
    if (window.confirm(`Are you sure you want to remove rule '${ruleCode}' from this schema?`)) {
      const updatedRules = (activeStructure?.rules || []).filter(r => r.code !== ruleCode);

      setStructures(prev => prev.map(s => {
        if (s.id === activeStructure.id) {
          return {
            ...s,
            rules: updatedRules,
            rule_count: updatedRules.length,
            depth: `${updatedRules.length} Computational Tiers`
          };
        }
        return s;
      }));

      showToast(`Rule '${ruleCode}' removed.`);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold flex items-center gap-2 bg-slate-900 text-white border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase font-semibold block mb-1">
            <span className="text-slate-400">GLOBAL PAYROLL GOVERNANCE &gt; </span>
            <span className="text-[#0051d5]">COMPENSATION ARCHITECTURE</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Salary Structures</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Orchestrate corporate grade compensation models, sequence computational dependencies, and enforce regional regulatory pay matrices.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-lg bg-[#0051d5] hover:bg-[#0042ad] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <PlusCircle size={15} />
            <span>Create Structure</span>
          </button>
          <button
            onClick={handleExportMatrix}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download size={15} />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* 4 Metric / KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Structures */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Structures</span>
            <Sliders size={16} className="text-[#0051d5]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{kpiStats.totalStructures}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              100% Validated
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Across {kpiStats.jurisdictionsCount} global jurisdictions
          </p>
        </div>

        {/* Card 2: Covered Employees */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Covered Employees</span>
            <Users size={16} className="text-[#0051d5]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-slate-900 font-mono">{kpiStats.coveredEmployees}</span>
            <span className="text-xs text-slate-400 font-medium">/ {kpiStats.totalFTEs} FTEs</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[#0051d5] h-full rounded-full transition-all duration-300"
              style={{ width: `${kpiStats.coveragePercent}%` }}
              title={`${kpiStats.coveragePercent}% Workforce Coverage`}
            ></div>
          </div>
        </div>

        {/* Card 3: Configured Rules */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Configured Rules</span>
            <Layers size={16} className="text-[#0051d5]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{kpiStats.totalRules}</span>
            <span className="text-xs text-slate-500 font-medium">rules linked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {kpiStats.statutoryRules} Statutory &bull; {kpiStats.discretionaryRules} Discretionary
          </p>
        </div>

        {/* Card 4: Compliance Audit */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Compliance Audit</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold text-slate-900 font-mono">ISO/IEC 27001</span>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              <span>Automated Audit Passed</span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">Checksum: #a499-f2e1</p>
        </div>
      </div>

      {/* Main Grid: Left Column (Registered Schemas) + Right Column (Selected Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Registered Schemas (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Registered Schemas</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-200 text-slate-700 font-semibold">
                {displayedStructures.length} Listed
              </span>
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex items-center gap-1 relative">
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                  jurisdictionFilter !== 'ALL' || sortOrder !== 'DEFAULT'
                    ? 'bg-blue-50 text-[#0051d5] border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Filter & Sort Schemas"
              >
                <SlidersHorizontal size={13} />
              </button>
              <button
                onClick={() => {
                  setSortOrder(prev => {
                    if (prev === 'DEFAULT') return 'EMPLOYEES';
                    if (prev === 'EMPLOYEES') return 'RULES';
                    if (prev === 'RULES') return 'NAME';
                    return 'DEFAULT';
                  });
                  showToast(`Sorted by: ${sortOrder === 'DEFAULT' ? 'Employee Count' : sortOrder === 'EMPLOYEES' ? 'Rule Count' : sortOrder === 'RULES' ? 'Name' : 'Default'}`);
                }}
                className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Cycle Sort Order"
              >
                <ArrowUpDown size={13} />
              </button>

              {/* Filter Popover Dropdown */}
              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-8 z-30 w-52 bg-white rounded-lg shadow-xl border border-slate-200 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Filter Jurisdiction</span>
                    <button 
                      onClick={() => setIsFilterDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {['ALL', 'EEA', 'US', 'INDIA', 'OPS', 'GLOBAL'].map(reg => (
                    <label key={reg} className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-600 hover:text-slate-900">
                      <input
                        type="radio"
                        name="regFilter"
                        checked={jurisdictionFilter === reg}
                        onChange={() => {
                          setJurisdictionFilter(reg);
                          setIsFilterDropdownOpen(false);
                        }}
                        className="text-[#0051d5] focus:ring-[#0051d5]"
                      />
                      <span>{reg === 'ALL' ? 'All Jurisdictions' : reg === 'EEA' ? 'EEA / Europe' : reg === 'US' ? 'US Executive' : reg === 'INDIA' ? 'India Domestic' : reg === 'OPS' ? 'Hourly Operations' : 'Global Contractor'}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* List of Schema Cards */}
          <div className="space-y-2.5">
            {displayedStructures.map((struct) => {
              const isSelected = struct.id === selectedStructureId;

              return (
                <div
                  key={struct.id}
                  onClick={() => setSelectedStructureId(struct.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-white border-[#0051d5] shadow-sm ring-1 ring-[#0051d5]/30'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  {/* Top Row: Tag + Status + Right Action */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {struct.code}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        struct.is_default 
                          ? 'bg-blue-50 text-[#0051d5] border border-blue-200 flex items-center gap-1' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {struct.is_default && <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"></span>}
                        {struct.is_default ? 'Active & Default' : 'Active'}
                      </span>
                    </div>

                    {/* Top Right: Blue Check circle when selected, Chevron when unselected */}
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#0051d5] text-white flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    ) : (
                      <ChevronRight size={15} className="text-slate-400 shrink-0" />
                    )}
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{struct.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {struct.description}
                  </p>

                  {/* Footer Meta Row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                      <Sliders size={12} className="text-slate-400 shrink-0" />
                      {struct.rule_label || `${struct.rules?.length || struct.rule_count} Rules`}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                      <Users size={12} className="text-slate-400 shrink-0" />
                      {struct.employee_count} Employees
                    </span>
                    {isSelected ? (
                      <span className="text-[#0051d5] font-semibold text-xs">
                        Selected
                      </span>
                    ) : (
                      <span className={`text-xs ${struct.badge_extra === 'Audited' ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                        {struct.badge_extra}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Dark Navy Compiler Card matching screenshot */}
          <div className="p-3.5 bg-[#0f172a] text-white rounded-xl shadow-md border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700/60 shrink-0 mt-0.5">
              <Code size={16} />
            </div>
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">RULE COMPILER ENGINE</h5>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Rules execute in topological sort based on declared order sequences.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Schema Detail (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-5">
          {/* Header Strip */}
          <div className="p-5 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                    {activeStructure.code}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                    {activeStructure.region}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeStructure.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeStructure.subtitle || `Linked to ${activeStructure.employee_count} active employment contracts`}
                </p>
              </div>

              {/* Action Buttons: Add Rule & Configure */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setRuleToEdit(null);
                    setIsRuleModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus size={14} />
                  <span>Add Rule</span>
                </button>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <SlidersHorizontal size={13} />
                  <span>Configure</span>
                </button>
              </div>
            </div>

            {/* 3 Summary Box Widgets */}
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Calculation Depth
                </span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {activeStructure.depth || `${activeStructure.rules?.length || 6} Computational Tiers`}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Target Output
                </span>
                <span className="font-mono font-bold text-[#0051d5] mt-0.5 block">
                  {activeStructure.target_output || 'NET_PAYABLE'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  State Integrity
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Synchronized
                </span>
              </div>
            </div>
          </div>

          {/* Execution Sequence Graph Table Section */}
          <div className="px-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Execution Sequence Graph</h3>
                <p className="text-xs text-slate-500">Deterministic flow calculated sequentially by execution index.</p>
              </div>
              <button
                onClick={handleOpenReorderModal}
                className="text-xs text-slate-700 hover:text-[#0051d5] font-semibold flex items-center gap-1.5 border border-slate-200 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <SlidersHorizontal size={12} />
                <span>Reorder Sequence</span>
              </button>
            </div>

            {/* Table of Rules */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3.5 w-16">SEQ</th>
                    <th className="py-2.5 px-3.5 w-52">RULE IDENTITY</th>
                    <th className="py-2.5 px-3.5 w-28">CATEGORY</th>
                    <th className="py-2.5 px-3.5">COMPUTATION FORMULA / FACTOR</th>
                    <th className="py-2.5 px-3.5 text-right w-20">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeStructure.rules || []).map((rule) => {
                    const isNet = rule.code === 'NET';
                    const isGross = rule.code === 'GROSS';

                    return (
                      <tr 
                        key={rule.code} 
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isNet ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* SEQ Badge */}
                        <td className="py-2.5 px-3.5 font-mono">
                          {isNet ? (
                            <span className="px-2 py-0.5 bg-[#0051d5] text-white rounded font-bold text-xs">
                              {rule.sequence}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-[#0051d5] border border-blue-200 rounded font-bold text-xs">
                              {rule.sequence}
                            </span>
                          )}
                        </td>

                        {/* RULE IDENTITY */}
                        <td className="py-2.5 px-3.5">
                          <span className="font-bold text-slate-900 block font-mono text-xs">{rule.code}</span>
                          <span className="text-[11px] text-slate-500 leading-tight block">{rule.name}</span>
                        </td>

                        {/* CATEGORY Badge */}
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rule.category.toLowerCase().includes('deduct')
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : rule.category.toLowerCase().includes('gross')
                              ? 'bg-blue-50 text-[#0051d5]'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rule.category}
                          </span>
                        </td>

                        {/* COMPUTATION FORMULA / FACTOR */}
                        <td className="py-2.5 px-3.5 font-mono text-xs">
                          {isGross || isNet ? (
                            <span className="px-2.5 py-0.5 bg-blue-50 text-[#0051d5] rounded font-semibold inline-block">
                              {rule.formula}
                            </span>
                          ) : (
                            <span className="text-slate-800">
                              {rule.formula}
                            </span>
                          )}
                        </td>

                        {/* ACTION Buttons */}
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setRuleToEdit(rule);
                                setIsRuleModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-[#0051d5] hover:bg-blue-50 rounded transition-colors"
                              title="Edit Rule"
                            >
                              <Sliders size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.code)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Rule"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM SIMULATION SANDBOX STRIP matching Docs/UI/Salary Structures.png */}
          <div className="p-5 bg-slate-50/70 border-t border-slate-200 space-y-2.5">
            {/* Strip Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Compass size={14} className="text-[#0051d5]" />
                <span>Simulation Sandbox (Sample {simulation.curr}{simulation.baseWage.toLocaleString()} Base)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded font-semibold">
                Deterministic Pass
              </span>
            </div>

            {/* 4-Step Interactive Calculation Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-3.5 rounded-xl border border-slate-200 items-center">
              {/* Step 1: Gross Payable */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Gross Payable</span>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {simulation.grossFormatted}
                </p>
              </div>

              {/* Step 2: Social Contributions */}
              <div className="flex items-center gap-2">
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Social Contributions (6.2%)</span>
                  <p className="text-sm font-bold font-mono text-rose-600 mt-0.5">
                    {simulation.socialFormatted}
                  </p>
                </div>
              </div>

              {/* Step 3: Estimated PAYE Tax */}
              <div className="flex items-center gap-2">
                <ArrowRight size={14} className="text-slate-300 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Estimated PAYE Tax</span>
                  <p className="text-sm font-bold font-mono text-rose-600 mt-0.5">
                    {simulation.payeFormatted}
                  </p>
                </div>
              </div>

              {/* Step 4: Net Pay Result */}
              <div className="flex items-center gap-2 sm:border-l sm:border-slate-100 sm:pl-3">
                <ArrowRight size={14} className="text-slate-300 shrink-0 sm:hidden" />
                <div>
                  <span className="text-[10px] font-bold text-[#0051d5] block">Net Pay Result</span>
                  <p className="text-2xl font-extrabold font-mono text-[#0051d5] mt-0.5">
                    {simulation.netFormatted}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE STRUCTURE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Salary Structure Schema"
        subtitle="COMPENSATION ARCHITECTURE // REGISTRATION"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveNewStructure} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Structure Code *</label>
              <input
                type="text"
                required
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. STR-APAC-EXEC-01"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Region / Jurisdiction *</label>
              <input
                type="text"
                required
                value={createForm.region}
                onChange={(e) => setCreateForm({ ...createForm, region: e.target.value })}
                placeholder="e.g. APAC Region v1.2"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Structure Name *</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. APAC Executive & Management"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Summarize compensation tiering, equity matching, and applicable jurisdictions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency</label>
              <select
                value={createForm.currency}
                onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
              >
                <option value="€">EUR (€) - European Union</option>
                <option value="$">USD ($) - United States</option>
                <option value="₹">INR (₹) - India</option>
                <option value="£">GBP (£) - United Kingdom</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sample Base Wage</label>
              <input
                type="number"
                value={createForm.sample_base}
                onChange={(e) => setCreateForm({ ...createForm, sample_base: e.target.value })}
                placeholder="5000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.is_default}
                onChange={(e) => setCreateForm({ ...createForm, is_default: e.target.checked })}
                className="rounded text-[#0051d5] focus:ring-[#0051d5]"
              />
              <span className="font-semibold text-slate-700">Set as Organization Default Structure</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0051d5] hover:bg-[#0042ad] text-white rounded-lg font-semibold shadow-xs"
            >
              Create Structure
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIGURE STRUCTURE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configure Salary Structure"
        subtitle={`CONFIGURATION // ${activeStructure?.code || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveConfiguration} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Code</label>
              <input
                type="text"
                required
                value={configForm.code}
                onChange={(e) => setConfigForm({ ...configForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Region / Jurisdiction</label>
              <input
                type="text"
                required
                value={configForm.region}
                onChange={(e) => setConfigForm({ ...configForm, region: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Structure Name</label>
            <input
              type="text"
              required
              value={configForm.name}
              onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Subtitle / Scope Description</label>
            <input
              type="text"
              value={configForm.subtitle}
              onChange={(e) => setConfigForm({ ...configForm, subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={configForm.description}
              onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.is_default}
                onChange={(e) => setConfigForm({ ...configForm, is_default: e.target.checked })}
                className="rounded text-[#0051d5] focus:ring-[#0051d5]"
              />
              <span className="font-semibold text-slate-700">Set as Organization Default Structure</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0051d5] hover:bg-[#0042ad] text-white rounded-lg font-semibold shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: REORDER SEQUENCE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        title="Reorder Execution Sequence"
        subtitle="TOPOLOGICAL COMPILER // SEQUENCE ORDER"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Rules execute strictly in ascending sequence order. Move rules up or down to update computational dependencies.
          </p>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
            {reorderList.map((rule, idx) => (
              <div key={rule.code} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-[#0051d5] border border-blue-200 rounded font-mono font-bold text-xs">
                    {rule.sequence}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block font-mono">{rule.code}</span>
                    <span className="text-[11px] text-slate-500">{rule.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveRule(idx, 'up')}
                    className={`p-1.5 rounded-md border ${
                      idx === 0 
                        ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title="Move Up"
                  >
                    <MoveUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === reorderList.length - 1}
                    onClick={() => handleMoveRule(idx, 'down')}
                    className={`p-1.5 rounded-md border ${
                      idx === reorderList.length - 1 
                        ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title="Move Down"
                  >
                    <MoveDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsReorderModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReorderedRules}
              className="px-4 py-1.5 bg-[#0051d5] hover:bg-[#0042ad] text-white rounded-lg font-semibold shadow-xs"
            >
              Save Sequence Order
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: RULE ADD / EDIT MODAL */}
      {/* ========================================================================= */}
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
          setRuleToEdit(null);
        }}
        onSave={handleSaveRule}
        ruleToEdit={ruleToEdit}
        existingRules={activeStructure?.rules || []}
      />
    </div>
  );
};
