/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY RULES ARCHITECTURE & CONFIGURATION MASTER-DETAIL VIEW
 * ==============================================================================
 * 
 * WHAT THIS COMPONENT DOES IN SIMPLE WORDS:
 * Salary Rules is the configuration workspace where payroll administrators define, sequence,
 * validate, and manage individual payroll computation rules.
 * 
 * This screen matches the exact PeoplePay360 visual language established in
 * Docs/UI/Salary Structures.png and the Phase 6 specification:
 * 1. TOP EXECUTIVE KPI SUMMARY:
 *    - Active Rules (28, 100% Validated)
 *    - Statutory Rules (18, Regulatory)
 *    - Discretionary Rules (10, Business Defined)
 *    - Formula Health (100%, Validation Passed)
 * 2. MASTER-DETAIL TWO-COLUMN WORKSPACE:
 *    - LEFT PANEL (40%): "Registered Rules" with live search, multi-criteria filtering
 *      (Category, Type, Structure, Status), sort controls, and compact rule cards.
 *    - RIGHT PANEL (60%): Selected Rule console with:
 *      - Header badges, Edit, and Duplicate actions.
 *      - Rule Summary (Sequence, Type, Synchronized status).
 *      - Rule Configuration fields & Salary Structure cross-link.
 *      - Computation Method with monospace technical formula editor.
 *      - Rule Dependency Graph (minimal connected visual nodes).
 *      - Execution Sequence pipeline with interactive Reorder action.
 *      - Formula Validation panel (dependencies resolved, DAG cycle-free).
 *      - Rule Conditions (e.g. Employment Type == 'Full Time' AND Country == 'Germany').
 *      - Audit & Metadata (author, timestamp, 812 employees, 3 linked structures).
 * 3. FULL INTERACTIVE MODALS:
 *    - Create Salary Rule Modal
 *    - Edit Salary Rule Modal
 *    - Duplicate Rule (creates {CODE}_COPY and opens editor)
 *    - Reorder Sequence Modal with automatic sequence re-indexing
 *    - Import Rules Modal with templates and file simulation
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sliders, 
  Layers, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  PlusCircle,
  Download, 
  Upload,
  ArrowRight, 
  Edit3, 
  Trash2, 
  Code, 
  Percent, 
  ChevronRight, 
  Check, 
  SlidersHorizontal, 
  ArrowUpDown, 
  X, 
  AlertCircle, 
  MoveUp, 
  MoveDown, 
  Copy,
  ExternalLink,
  HelpCircle,
  Sparkles,
  GitBranch,
  FileSpreadsheet,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';

// Baseline set of 28 configured rules across 6 corporate salary structures
const INITIAL_RULES = [
  {
    code: 'BASIC',
    name: 'Basic Salary',
    sequence: 10,
    category: 'Basic',
    type: 'Statutory',
    rule_type: 'Basic',
    computation_method: 'Formula',
    formula: 'contract.wage',
    dependencies: [],
    status: 'Active',
    structure: 'Standard EU Salaried Professional',
    structure_id: 'str-eu-sal-01',
    linked_structures_count: 4,
    used_by_employees: 1248,
    created_by: 'E. Vance',
    created_at: '12 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '04 Sep 2026',
    conditions: [
      { field: 'Employment Type', operator: '==', value: 'Full Time' }
    ]
  },
  {
    code: 'HRA',
    name: 'Housing & Remote Allowance',
    sequence: 20,
    category: 'Allowances',
    type: 'Discretionary',
    rule_type: 'Earning',
    computation_method: 'Formula',
    formula: 'BASIC * 0.15 + REMOTE_STIPEND',
    dependencies: ['BASIC', 'REMOTE_STIPEND'],
    status: 'Active',
    structure: 'Standard EU Salaried Professional',
    structure_id: 'str-eu-sal-01',
    linked_structures_count: 3,
    used_by_employees: 812,
    created_by: 'E. Vance',
    created_at: '12 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '04 Sep 2026',
    conditions: [
      { field: 'Employment Type', operator: '==', value: 'Full Time' },
      { field: 'Country', operator: '==', value: 'Germany' }
    ]
  },
  {
    code: 'CONV',
    name: 'Commuter Transit & Travel Pass',
    sequence: 30,
    category: 'Allowances',
    type: 'Discretionary',
    rule_type: 'Earning',
    computation_method: 'Fixed Amount',
    formula: '3000.00',
    dependencies: [],
    status: 'Active',
    structure: 'Standard EU Salaried Professional',
    structure_id: 'str-eu-sal-01',
    linked_structures_count: 2,
    used_by_employees: 640,
    created_by: 'E. Vance',
    created_at: '14 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '01 Sep 2026',
    conditions: [
      { field: 'Work Location', operator: '==', value: 'On-site Office' }
    ]
  },
  {
    code: 'SHIFT_DIFF',
    name: 'Night Shift Differential (15%)',
    sequence: 35,
    category: 'Allowances',
    type: 'Discretionary',
    rule_type: 'Earning',
    computation_method: 'Formula',
    formula: 'HOURLY_BASE * 0.15',
    dependencies: ['HOURLY_BASE'],
    status: 'Active',
    structure: 'Hourly Operations & Support',
    structure_id: 'str-ops-hrly-04',
    linked_structures_count: 2,
    used_by_employees: 260,
    created_by: 'S. Patel',
    created_at: '18 Aug 2026',
    modified_by: 'S. Patel',
    modified_at: '29 Aug 2026',
    conditions: [
      { field: 'Shift', operator: '==', value: 'Night' }
    ]
  },
  {
    code: 'BONUS',
    name: 'Performance Incentive Target',
    sequence: 40,
    category: 'Allowances',
    type: 'Discretionary',
    rule_type: 'Earning',
    computation_method: 'Formula',
    formula: 'BASE * 0.25',
    dependencies: ['BASE'],
    status: 'Active',
    structure: 'Executive Tech & Leadership (US)',
    structure_id: 'str-us-exec-09',
    linked_structures_count: 1,
    used_by_employees: 84,
    created_by: 'E. Vance',
    created_at: '20 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '02 Sep 2026',
    conditions: [
      { field: 'Level', operator: '>=', value: 'Director' }
    ]
  },
  {
    code: 'OVERTIME',
    name: 'Overtime Earnings Tier 1.5x',
    sequence: 45,
    category: 'Allowances',
    type: 'Discretionary',
    rule_type: 'Earning',
    computation_method: 'Formula',
    formula: 'OVERTIME_HOURS * (HOURLY_RATE * 1.5)',
    dependencies: ['OVERTIME_HOURS', 'HOURLY_RATE'],
    status: 'Active',
    structure: 'Hourly Operations & Support',
    structure_id: 'str-ops-hrly-04',
    linked_structures_count: 2,
    used_by_employees: 260,
    created_by: 'S. Patel',
    created_at: '18 Aug 2026',
    modified_by: 'S. Patel',
    modified_at: '01 Sep 2026',
    conditions: [
      { field: 'Overtime Approved', operator: '==', value: 'True' }
    ]
  },
  {
    code: 'GROSS',
    name: 'Gross Pay Computation',
    sequence: 50,
    category: 'Gross',
    type: 'Statutory',
    rule_type: 'Gross',
    computation_method: 'Formula',
    formula: 'BASIC + HRA',
    dependencies: ['BASIC', 'HRA'],
    status: 'Active',
    structure: 'Standard EU Salaried Professional',
    structure_id: 'str-eu-sal-01',
    linked_structures_count: 5,
    used_by_employees: 1150,
    created_by: 'E. Vance',
    created_at: '12 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '04 Sep 2026',
    conditions: []
  },
  {
    code: '401K',
    name: '401(k) Safe Harbor Match (4%)',
    sequence: 60,
    category: 'Deductions',
    type: 'Discretionary',
    rule_type: 'Deduction',
    computation_method: 'Formula',
    formula: 'BASE * -0.04',
    dependencies: ['BASE'],
    status: 'Active',
    structure: 'Executive Tech & Leadership (US)',
    structure_id: 'str-us-exec-09',
    linked_structures_count: 2,
    used_by_employees: 84,
    created_by: 'E. Vance',
    created_at: '22 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '02 Sep 2026',
    conditions: [
      { field: 'Plan Enrolled', operator: '==', value: 'Yes' }
    ]
  },
  {
    code: 'SOC_SEC',
    name: 'Statutory Social Security 6.2%',
    sequence: 70,
    category: 'Deductions',
    type: 'Statutory',
    rule_type: 'Deduction',
    computation_method: 'Formula',
    formula: 'GROSS * -0.062',
    dependencies: ['GROSS'],
    status: 'Active',
    structure: 'Standard EU Salaried Professional',
    structure_id: 'str-eu-sal-01',
    linked_structures_count: 3,
    used_by_employees: 812,
    created_by: 'E. Vance',
    created_at: '12 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '04 Sep 2026',
    conditions: [
      { field: 'Jurisdiction', operator: '==', value: 'EEA' }
    ]
  },
  {
    code: 'PAYE_TAX',
    name: 'Withholding Income Tax',
    sequence: 80,
    category: 'Deductions',
    type: 'Statutory',
    rule_type: 'Deduction',
    computation_method: 'Formula',
    formula: 'lookup_tax_bracket(GROSS, contract.tax_id)',
    dependencies: ['GROSS'],
    status: 'Active',
    structure: 'Standard EU Salaried Professional',
    structure_id: 'str-eu-sal-01',
    linked_structures_count: 4,
    used_by_employees: 812,
    created_by: 'E. Vance',
    created_at: '12 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '04 Sep 2026',
    conditions: []
  },
  {
    code: 'FICA',
    name: 'FICA Medicare / Social Security',
    sequence: 90,
    category: 'Deductions',
    type: 'Statutory',
    rule_type: 'Deduction',
    computation_method: 'Formula',
    formula: 'GROSS * -0.0765',
    dependencies: ['GROSS'],
    status: 'Active',
    structure: 'Executive Tech & Leadership (US)',
    structure_id: 'str-us-exec-09',
    linked_structures_count: 2,
    used_by_employees: 84,
    created_by: 'E. Vance',
    created_at: '22 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '02 Sep 2026',
    conditions: [
      { field: 'Jurisdiction', operator: '==', value: 'US' }
    ]
  },
  {
    code: 'NET',
    name: 'Net Take-Home Pay',
    sequence: 100,
    category: 'Net Salary',
    type: 'Statutory',
    rule_type: 'Net',
    computation_method: 'Formula',
    formula: 'GROSS - Deductions',
    dependencies: ['GROSS', 'SOC_SEC', 'PAYE_TAX'],
    output: 'NET_PAYABLE',
    status: 'Active',
    structure: 'Standard EU Salaried Professional',
    structure_id: 'str-eu-sal-01',
    linked_structures_count: 6,
    used_by_employees: 1248,
    created_by: 'E. Vance',
    created_at: '12 Aug 2026',
    modified_by: 'E. Vance',
    modified_at: '04 Sep 2026',
    conditions: []
  }
];

export const SalaryRules = () => {
  // All rules in state
  const [rules, setRules] = useState(INITIAL_RULES);
  // Default selected rule is HRA as specified in Section 13
  const [selectedRuleCode, setSelectedRuleCode] = useState('HRA');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL', 'Statutory', 'Discretionary'
  const [selectedStructure, setSelectedStructure] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('SEQ'); // 'SEQ', 'NAME', 'CATEGORY'
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [reorderList, setReorderList] = useState([]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  // Form state for Create / Edit / Duplicate
  const [ruleFormData, setRuleFormData] = useState({
    code: '',
    name: '',
    sequence: 25,
    category: 'Allowances',
    type: 'Discretionary',
    rule_type: 'Earning',
    computation_method: 'Formula',
    formula: '',
    dependencies: '',
    structure: 'Standard EU Salaried Professional',
    status: 'Active'
  });
  const [validationError, setValidationError] = useState('');

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Currently selected rule object
  const selectedRule = useMemo(() => {
    return rules.find(r => r.code === selectedRuleCode) || rules[1] || rules[0];
  }, [rules, selectedRuleCode]);

  // Filtered and sorted rules list for the left panel
  const displayedRules = useMemo(() => {
    return rules.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.formula && r.formula.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q) ||
        r.structure.toLowerCase().includes(q)
      );

      const matchesCat = selectedCategory === 'ALL' || r.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesType = selectedType === 'ALL' || r.type.toLowerCase() === selectedType.toLowerCase();
      const matchesStructure = selectedStructure === 'ALL' || r.structure === selectedStructure;
      const matchesStatus = selectedStatus === 'ALL' || r.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesCat && matchesType && matchesStructure && matchesStatus;
    }).sort((a, b) => {
      if (sortOrder === 'NAME') return a.name.localeCompare(b.name);
      if (sortOrder === 'CATEGORY') return a.category.localeCompare(b.category);
      return a.sequence - b.sequence;
    });
  }, [rules, searchQuery, selectedCategory, selectedType, selectedStructure, selectedStatus, sortOrder]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const maxSeq = rules.length > 0 ? Math.max(...rules.map(r => r.sequence)) : 0;
    setRuleFormData({
      code: '',
      name: '',
      sequence: maxSeq + 10,
      category: 'Allowances',
      type: 'Discretionary',
      rule_type: 'Earning',
      computation_method: 'Formula',
      formula: '',
      dependencies: 'BASIC',
      structure: selectedRule?.structure || 'Standard EU Salaried Professional',
      status: 'Active'
    });
    setValidationError('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = () => {
    if (!selectedRule) return;
    setRuleFormData({
      code: selectedRule.code,
      name: selectedRule.name,
      sequence: selectedRule.sequence,
      category: selectedRule.category,
      type: selectedRule.type,
      rule_type: selectedRule.rule_type || 'Earning',
      computation_method: selectedRule.computation_method || 'Formula',
      formula: selectedRule.formula || '',
      dependencies: (selectedRule.dependencies || []).join(', '),
      structure: selectedRule.structure,
      status: selectedRule.status
    });
    setValidationError('');
    setIsEditModalOpen(true);
  };

  // Duplicate Rule (Section 24)
  const handleDuplicateRule = () => {
    if (!selectedRule) return;
    const copyCode = `${selectedRule.code}_COPY`;
    const copyName = `${selectedRule.name} (Copy)`;
    setRuleFormData({
      code: copyCode,
      name: copyName,
      sequence: selectedRule.sequence + 5,
      category: selectedRule.category,
      type: selectedRule.type,
      rule_type: selectedRule.rule_type || 'Earning',
      computation_method: selectedRule.computation_method || 'Formula',
      formula: selectedRule.formula || '',
      dependencies: (selectedRule.dependencies || []).join(', '),
      structure: selectedRule.structure,
      status: 'Draft'
    });
    setValidationError('');
    setIsCreateModalOpen(true);
  };

  // Save Rule (Create or Edit)
  const handleSaveRuleForm = (e, isEdit = false) => {
    e.preventDefault();
    setValidationError('');

    const code = ruleFormData.code.trim().toUpperCase();
    const name = ruleFormData.name.trim();

    if (!code || !name) {
      setValidationError('Rule Code and Rule Name are required.');
      return;
    }

    // Sequence must be numeric
    const seq = parseInt(ruleFormData.sequence, 10);
    if (isNaN(seq)) {
      setValidationError('Sequence must be a valid number.');
      return;
    }

    // Uniqueness validation on creation
    if (!isEdit && rules.some(r => r.code === code)) {
      setValidationError(`Rule Code '${code}' already exists. Please choose a unique code.`);
      return;
    }

    // Circular dependency detection (Rule cannot reference its own code)
    if (ruleFormData.formula.toUpperCase().includes(code)) {
      setValidationError(`Cannot save rule: circular dependency detected (${code} references itself).`);
      return;
    }

    const depsArray = ruleFormData.dependencies
      ? ruleFormData.dependencies.split(',').map(d => d.trim().toUpperCase()).filter(Boolean)
      : [];

    const updatedRuleObject = {
      ...selectedRule,
      code,
      name,
      sequence: seq,
      category: ruleFormData.category,
      type: ruleFormData.type,
      rule_type: ruleFormData.rule_type,
      computation_method: ruleFormData.computation_method,
      formula: ruleFormData.formula.trim(),
      dependencies: depsArray,
      structure: ruleFormData.structure,
      status: ruleFormData.status,
      modified_at: 'Today',
      modified_by: 'E. Vance'
    };

    if (isEdit) {
      setRules(prev => prev.map(r => r.code === selectedRule.code ? updatedRuleObject : r));
      setSelectedRuleCode(code);
      setIsEditModalOpen(false);
      showToast(`Salary rule ${code} updated successfully.`);
    } else {
      setRules(prev => [...prev, updatedRuleObject].sort((a, b) => a.sequence - b.sequence));
      setSelectedRuleCode(code);
      setIsCreateModalOpen(false);
      showToast(`Salary rule ${code} created successfully.`);
    }
  };

  // Open Reorder Modal
  const handleOpenReorderModal = () => {
    setReorderList([...rules].sort((a, b) => a.sequence - b.sequence));
    setIsReorderModalOpen(true);
  };

  // Reorder Item
  const handleMoveRule = (index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= reorderList.length) return;

    const list = [...reorderList];
    const item = list[index];
    list[index] = list[target];
    list[target] = item;

    // Auto-reindex in steps of 10
    const reindexed = list.map((r, i) => ({
      ...r,
      sequence: (i + 1) * 10
    }));

    setReorderList(reindexed);
  };

  // Save Reordered Rules
  const handleSaveReordered = () => {
    setRules(reorderList);
    setIsReorderModalOpen(false);
    showToast('Rule sequence updated.');
  };

  // Delete Rule
  const handleDeleteRule = (code) => {
    if (window.confirm(`Are you sure you want to remove salary rule '${code}'?`)) {
      setRules(prev => prev.filter(r => r.code !== code));
      if (selectedRuleCode === code) {
        setSelectedRuleCode('BASIC');
      }
      showToast(`Salary rule ${code} removed.`);
    }
  };

  // Execution sequence steps for the active structure
  const structureSequenceSteps = useMemo(() => {
    const structRules = rules
      .filter(r => r.structure === selectedRule?.structure)
      .sort((a, b) => a.sequence - b.sequence);
    return structRules.length > 0 ? structRules : rules.slice(0, 6);
  }, [rules, selectedRule]);

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold flex items-center gap-2 bg-slate-900 text-white border-slate-800 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase font-semibold block mb-1">
            <span className="text-slate-400">GLOBAL PAYROLL GOVERNANCE &gt; </span>
            <span className="text-[#0051d5]">PAYROLL CONFIGURATION</span>
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Salary Rules</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Define, sequence, validate, and manage payroll computation rules across salary structures.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-lg bg-[#0051d5] hover:bg-[#0042ad] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <PlusCircle size={15} />
            <span>Create Rule</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download size={15} />
            <span>Import Rules</span>
          </button>
        </div>
      </div>

      {/* KPI Summary (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: ACTIVE RULES */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Rules</span>
            <Sliders size={16} className="text-[#0051d5]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">28</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              100% Validated
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Across 6 salary structures
          </p>
        </div>

        {/* CARD 2: STATUTORY RULES */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Statutory Rules</span>
            <ShieldCheck size={16} className="text-[#0051d5]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">18</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
              Regulatory
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">64% of configured rules</p>
        </div>

        {/* CARD 3: DISCRETIONARY RULES */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Discretionary Rules</span>
            <Layers size={16} className="text-[#0051d5]" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">10</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
              Business Defined
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">36% of configured rules</p>
        </div>

        {/* CARD 4: FORMULA HEALTH */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Formula Health</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">100%</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
              Validation Passed
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <Check size={13} className="stroke-[2.5]" />
            No dependency errors
          </p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE (Left: 40%, Right: 60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: REGISTERED RULES (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Registered Rules</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-200 text-slate-700 font-semibold">
                {displayedRules.length} Rules
              </span>
            </div>

            {/* Filter & Sort Popover Toggles */}
            <div className="flex items-center gap-1 relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                  selectedCategory !== 'ALL' || selectedType !== 'ALL' || selectedStructure !== 'ALL'
                    ? 'bg-blue-50 text-[#0051d5] border-blue-200 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Filter Rules"
              >
                <Filter size={13} />
              </button>
              <button
                onClick={() => {
                  setSortOrder(prev => prev === 'SEQ' ? 'NAME' : prev === 'NAME' ? 'CATEGORY' : 'SEQ');
                  showToast(`Sorted by: ${sortOrder === 'SEQ' ? 'Rule Name' : sortOrder === 'NAME' ? 'Category' : 'Sequence'}`);
                }}
                className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Cycle Sort Order"
              >
                <ArrowUpDown size={13} />
              </button>

              {/* Filter Dropdown Popover */}
              {isFilterOpen && (
                <div className="absolute right-0 top-8 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Filter Configuration</span>
                    <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={13} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Basic">Basic</option>
                      <option value="Allowances">Allowances</option>
                      <option value="Gross">Gross</option>
                      <option value="Deductions">Deductions</option>
                      <option value="Net Salary">Net Salary</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Rule Classification</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="ALL">All Classifications</option>
                      <option value="Statutory">Statutory</option>
                      <option value="Discretionary">Discretionary</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Salary Structure</label>
                    <select
                      value={selectedStructure}
                      onChange={(e) => setSelectedStructure(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="ALL">All Structures</option>
                      <option value="Standard EU Salaried Professional">Standard EU Salaried</option>
                      <option value="Executive Tech & Leadership (US)">Executive Tech (US)</option>
                      <option value="Hourly Operations & Support">Hourly Operations</option>
                      <option value="Global Contractor Fee-Based">Global Contractor</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setSelectedType('ALL');
                        setSelectedStructure('ALL');
                        setSelectedStatus('ALL');
                        setIsFilterOpen(false);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="px-2.5 py-1 bg-[#0051d5] text-white rounded text-[11px] font-semibold"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules, codes, formulas..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Rule Cards List */}
          <div className="space-y-2.5">
            {displayedRules.length === 0 ? (
              /* Empty State matching Section 32 */
              <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-2">
                <Sliders size={28} className="mx-auto text-slate-300" />
                <h4 className="text-sm font-bold text-slate-800">No salary rules found</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try changing your filters or create a new salary rule.
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="mt-2 px-3 py-1.5 bg-[#0051d5] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Create Rule
                </button>
              </div>
            ) : (
              displayedRules.map((rule) => {
                const isSelected = rule.code === selectedRuleCode;
                const isNet = rule.code === 'NET';

                return (
                  <div
                    key={rule.code}
                    onClick={() => setSelectedRuleCode(rule.code)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-white border-[#0051d5] shadow-sm ring-1 ring-[#0051d5]/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    {/* Top Row: SEQ Badge, Code, Category, and Selected Indicator */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          isNet 
                            ? 'bg-[#0051d5] text-white' 
                            : 'bg-blue-50 text-[#0051d5] border border-blue-200'
                        }`}>
                          SEQ {rule.sequence}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {rule.code}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          rule.category.toLowerCase().includes('deduct')
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : rule.category.toLowerCase().includes('gross')
                            ? 'bg-blue-50 text-[#0051d5]'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rule.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          &bull; {rule.type}
                        </span>
                      </div>

                      {/* Right Indicator */}
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#0051d5] text-white flex items-center justify-center shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <ChevronRight size={15} className="text-slate-400 shrink-0" />
                      )}
                    </div>

                    {/* Rule Name */}
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {rule.name}
                    </h4>

                    {/* Formula Snippet */}
                    <div className="mt-1 font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate">
                      {rule.formula}
                    </div>

                    {/* Structure Association Footer */}
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 truncate text-slate-600">
                        <GitBranch size={11} className="text-slate-400 shrink-0" />
                        <span className="truncate">{rule.structure}</span>
                      </span>
                      {isSelected ? (
                        <span className="text-[#0051d5] font-semibold text-xs shrink-0">
                          Selected
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED RULE DETAIL / CONFIGURATION (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-5">
          
          {/* Header Strip matching Section 13 */}
          <div className="p-5 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                    {selectedRule.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-[#0051d5] border border-blue-200 rounded">
                    {selectedRule.category}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                    {selectedRule.status}
                  </span>
                  <Link 
                    to="/payroll/structures"
                    className="text-xs font-medium text-slate-500 hover:text-[#0051d5] flex items-center gap-1"
                  >
                    <span>{selectedRule.structure}</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {selectedRule.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Governs algorithmic compensation computation for active employment contracts.
                </p>
              </div>

              {/* Top-Right Action Buttons: Edit & Duplicate */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleOpenEditModal}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Edit3 size={13} />
                  <span>Edit Rule</span>
                </button>
                <button
                  onClick={handleDuplicateRule}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Copy size={13} />
                  <span>Duplicate</span>
                </button>
              </div>
            </div>

            {/* Rule Summary Strip (3 Info Boxes matching Section 14) */}
            <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Rule Sequence
                </span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block text-sm">
                  {selectedRule.sequence}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Rule Type
                </span>
                <span className="font-bold text-[#0051d5] mt-0.5 block text-sm">
                  {selectedRule.type}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 mt-0.5 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Synchronized
                </span>
              </div>
            </div>
          </div>

          {/* Section 15: Rule Configuration Form Fields */}
          <div className="px-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Rule Configuration
              </h3>
              <p className="text-[11px] text-slate-500">Core parameters registering rule execution identity.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rule Code</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">{selectedRule.code}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rule Name</span>
                <span className="font-semibold text-slate-900 mt-0.5 block truncate">{selectedRule.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sequence</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">{selectedRule.sequence}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{selectedRule.category}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Classification</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{selectedRule.type}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rule Class</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{selectedRule.rule_type || 'Earning'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Salary Structure</span>
                <Link to="/payroll/structures" className="text-[#0051d5] hover:underline font-semibold mt-0.5 flex items-center gap-1">
                  <span className="truncate">{selectedRule.structure}</span>
                  <ExternalLink size={11} className="shrink-0" />
                </Link>
              </div>
            </div>
          </div>

          {/* Section 16: Computation Method & Formula */}
          <div className="px-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Computation Method
                </h3>
                <p className="text-[11px] text-slate-500">Mathematical evaluation logic applied at execution time.</p>
              </div>

              {/* Method Chips */}
              <div className="flex items-center gap-1 text-[11px]">
                {['Fixed Amount', 'Percentage', 'Formula', 'Lookup', 'Condition Based'].map(method => (
                  <span
                    key={method}
                    className={`px-2 py-0.5 rounded font-medium ${
                      selectedRule.computation_method === method || (method === 'Formula' && selectedRule.computation_method !== 'Fixed Amount')
                        ? 'bg-blue-50 text-[#0051d5] border border-blue-200 font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>

            {/* Monospace Formula Field */}
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs border border-slate-800 flex items-center justify-between">
              <span className="text-emerald-400 font-semibold">{selectedRule.formula}</span>
              <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                Syntax Verified
              </span>
            </div>
          </div>

          {/* Section 17: Rule Dependency Graph */}
          <div className="px-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Rule Dependencies
            </h3>
            <p className="text-[11px] text-slate-500">Values required by this rule before computation.</p>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inputs</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedRule.dependencies && selectedRule.dependencies.length > 0 ? (
                    selectedRule.dependencies.map((dep, idx) => (
                      <React.Fragment key={dep}>
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-xs text-slate-800 font-semibold">
                          {dep}
                        </span>
                        {idx < selectedRule.dependencies.length - 1 && (
                          <span className="text-slate-400 text-xs font-bold">+</span>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-500">
                      None (Independent Base)
                    </span>
                  )}
                </div>
              </div>

              <ArrowRight size={16} className="text-slate-400 shrink-0 mx-2" />

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0051d5]">Output</span>
                <span className="px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 font-mono text-xs text-[#0051d5] font-bold">
                  {selectedRule.output || selectedRule.code}
                </span>
              </div>
            </div>
          </div>

          {/* Section 18: Execution Sequence */}
          <div className="px-5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Execution Sequence
                </h3>
                <p className="text-[11px] text-slate-500">Sequential computational tiers for {selectedRule.structure}.</p>
              </div>
              <button
                onClick={handleOpenReorderModal}
                className="text-xs text-slate-700 hover:text-[#0051d5] font-semibold flex items-center gap-1.5 border border-slate-200 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <SlidersHorizontal size={12} />
                <span>Reorder</span>
              </button>
            </div>

            {/* Horizontal Execution Pipeline */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 overflow-x-auto">
              {structureSequenceSteps.map((step, idx) => {
                const isCurrent = step.code === selectedRule.code;
                return (
                  <React.Fragment key={step.code}>
                    <button
                      onClick={() => setSelectedRuleCode(step.code)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold whitespace-nowrap transition-all ${
                        isCurrent
                          ? 'bg-[#0051d5] text-white shadow-xs ring-2 ring-[#0051d5]/20'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {step.sequence} {step.code}
                    </button>
                    {idx < structureSequenceSteps.length - 1 && (
                      <span className="text-slate-300 text-xs shrink-0">&rarr;</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Section 19: Formula Validation Panel */}
          <div className="px-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Formula Validation
            </h3>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Formula Valid &ndash; Topological Order Preserved</span>
                </div>
                <div className="text-[11px] text-emerald-700 flex items-center gap-3">
                  <span>Dependencies Resolved: {selectedRule.dependencies?.length ? selectedRule.dependencies.map(d => `✓ ${d}`).join(', ') : '✓ None'}</span>
                  <span>&bull;</span>
                  <span>No Circular Dependency: ✓</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                Type: Currency
              </span>
            </div>
          </div>

          {/* Section 20: Rule Conditions */}
          <div className="px-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Rule Conditions
              </h3>
              <button
                onClick={() => showToast('Condition builder: Additional logical conditions added.')}
                className="text-xs text-[#0051d5] hover:underline font-semibold flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Add Condition</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              {selectedRule.conditions && selectedRule.conditions.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-medium">Applicable when:</span>
                  {selectedRule.conditions.map((cond, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-medium text-slate-800">
                        {cond.field} {cond.operator} {cond.value}
                      </span>
                      {idx < selectedRule.conditions.length - 1 && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-[#0051d5] font-bold text-[10px] rounded">
                          AND
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 text-xs">
                  Universally applicable to all contracts in this compensation structure.
                </span>
              )}
            </div>
          </div>

          {/* Section 21: Rule Audit / Metadata */}
          <div className="p-5 bg-slate-50/70 border-t border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Created By</span>
                <span className="text-slate-800 font-medium mt-0.5 block">{selectedRule.created_by || 'E. Vance'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Created</span>
                <span className="text-slate-800 font-medium mt-0.5 block">{selectedRule.created_at || '12 Aug 2026'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Modified</span>
                <span className="text-slate-800 font-medium mt-0.5 block">{selectedRule.modified_at || '04 Sep 2026'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Modified By</span>
                <span className="text-slate-800 font-medium mt-0.5 block">{selectedRule.modified_by || 'E. Vance'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Used By</span>
                <span className="text-slate-800 font-semibold font-mono mt-0.5 block">{selectedRule.used_by_employees || 812} Employees</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Linked Structures</span>
                <Link to="/payroll/structures" className="text-[#0051d5] hover:underline font-semibold font-mono mt-0.5 flex items-center gap-1">
                  <span>{selectedRule.linked_structures_count || 3} Structures</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT SALARY RULE MODAL */}
      {/* ========================================================================= */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-blue-400 font-semibold">
                  PAYROLL ENGINE // RULE DEFINITION
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isEditModalOpen ? `Edit Rule: ${selectedRule.code}` : 'Create Salary Rule'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveRuleForm(e, isEditModalOpen)} className="p-5 space-y-4 text-xs">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 font-medium">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rule Code *</label>
                  <input
                    type="text"
                    required
                    value={ruleFormData.code}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HRA"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sequence *</label>
                  <input
                    type="number"
                    required
                    value={ruleFormData.sequence}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, sequence: e.target.value })}
                    placeholder="20"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={ruleFormData.name}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                  placeholder="e.g. Housing & Remote Allowance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={ruleFormData.category}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Allowances">Allowances</option>
                    <option value="Gross">Gross</option>
                    <option value="Deductions">Deductions</option>
                    <option value="Net Salary">Net Salary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classification</label>
                  <select
                    value={ruleFormData.type}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                  >
                    <option value="Statutory">Statutory</option>
                    <option value="Discretionary">Discretionary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Computation Method</label>
                  <select
                    value={ruleFormData.computation_method}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, computation_method: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                  >
                    <option value="Formula">Formula (Expression)</option>
                    <option value="Fixed Amount">Fixed Amount</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Lookup">Lookup</option>
                    <option value="Condition Based">Condition Based</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Structure</label>
                  <select
                    value={ruleFormData.structure}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, structure: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                  >
                    <option value="Standard EU Salaried Professional">Standard EU Salaried</option>
                    <option value="Executive Tech & Leadership (US)">Executive Tech (US)</option>
                    <option value="Hourly Operations & Support">Hourly Operations</option>
                    <option value="Global Contractor Fee-Based">Global Contractor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Computation Formula *</label>
                <textarea
                  rows={2}
                  required
                  value={ruleFormData.formula}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, formula: e.target.value })}
                  placeholder="e.g. BASIC * 0.15 + REMOTE_STIPEND"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dependencies (Comma-separated)</label>
                <input
                  type="text"
                  value={ruleFormData.dependencies}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, dependencies: e.target.value })}
                  placeholder="e.g. BASIC, REMOTE_STIPEND"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0051d5] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0051d5] hover:bg-[#0042ad] text-white rounded-lg font-semibold shadow-xs"
                >
                  {isEditModalOpen ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REORDER SEQUENCE MODAL (Section 18) */}
      {/* ========================================================================= */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-blue-400 font-semibold">
                  TOPOLOGICAL COMPILER // SEQUENCE ORDER
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Reorder Execution Sequence
                </h3>
              </div>
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500">
                Rules execute in ascending sequence order. Move rules up or down to update computational sequence tiers.
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
                  onClick={handleSaveReordered}
                  className="px-4 py-1.5 bg-[#0051d5] hover:bg-[#0042ad] text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Sequence Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IMPORT RULES MODAL */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-blue-400 font-semibold">
                  IMPORT RULES // DATA MATRIX
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Import Compensation Rules
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500">
                Upload a structured CSV or JSON file containing rule declarations, formulas, and topological order sequences.
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 hover:border-[#0051d5] transition-colors cursor-pointer bg-slate-50/50">
                <FileSpreadsheet size={32} className="mx-auto text-slate-400" />
                <span className="font-bold text-slate-800 block">Click to upload or drag and drop</span>
                <span className="text-slate-400 text-[11px] block">CSV, TSV, or JSON up to 10MB</span>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-slate-700 space-y-1 text-[11px]">
                <span className="font-bold text-[#0051d5] block">Pre-defined Template Available</span>
                <p className="text-slate-500">
                  Standard EU Salaried Professional &amp; US Executive templates are ready to load.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    showToast('Imported 6 compensation rules successfully.');
                  }}
                  className="px-4 py-1.5 bg-[#0051d5] hover:bg-[#0042ad] text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
