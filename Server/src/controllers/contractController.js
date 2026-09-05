import * as contractService from '../services/contractService.js';

export async function getContractMetrics(req, res, next) {
  try {
    const metrics = await contractService.getContractMetrics();
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
}

export async function getContracts(req, res, next) {
  try {
    const { page, limit, status, department, structureId, search } = req.query;
    const result = await contractService.getContracts({
      page,
      limit,
      status,
      department,
      structureId,
      search
    });

    res.status(200).json({
      success: true,
      data: result.contracts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

export async function getContractById(req, res, next) {
  try {
    const contract = await contractService.getContractById(req.params.id);
    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    next(error);
  }
}

export async function createContract(req, res, next) {
  try {
    const newContract = await contractService.createContract(req.body);
    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: newContract
    });
  } catch (error) {
    next(error);
  }
}

export async function updateContract(req, res, next) {
  try {
    const updated = await contractService.updateContract(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function renewContract(req, res, next) {
  try {
    const renewed = await contractService.renewContract(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Contract renewed successfully',
      data: renewed
    });
  } catch (error) {
    next(error);
  }
}

export async function completeContract(req, res, next) {
  try {
    const completed = await contractService.completeContract(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Draft contract finalized and activated',
      data: completed
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteContract(req, res, next) {
  try {
    const result = await contractService.deleteContract(req.params.id);
    res.status(200).json({
      success: true,
      message: result.action === 'archived_due_to_payslips' 
        ? 'Contract marked as CANCELLED to preserve payslip history' 
        : 'Contract deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function exportContractsLedger(req, res, next) {
  try {
    const rows = await contractService.exportContractsLedger();
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}
