import * as leaveService from '../services/leaveService.js';

export const getLeaveTypes = async (req, res, next) => {
  try {
    const types = await leaveService.getLeaveTypes();
    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLeaveBalances = async (req, res, next) => {
  try {
    const data = await leaveService.getMyLeaveBalances(req.user.employeeId);
    res.status(200).json({
      success: true,
      data: data.balances,
      hasProfile: data.hasProfile,
      employeeId: data.employeeId,
      message: data.message
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveBalances = async (req, res, next) => {
  try {
    const targetEmployeeId = req.query.employee_id || req.query.employeeId;
    const balances = await leaveService.getLeaveBalances(
      targetEmployeeId,
      req.user.employeeId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamBalances = async (req, res, next) => {
  try {
    const balances = await leaveService.getTeamBalances();
    res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveAllocations = async (req, res, next) => {
  try {
    const { employeeId, department, search, page, limit } = req.query;
    const result = await leaveService.getLeaveAllocations({
      employeeId,
      department,
      search,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: result.allocations,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateAllocation = async (req, res, next) => {
  try {
    const allocation = await leaveService.createOrUpdateAllocation(req.body);
    res.status(200).json({
      success: true,
      message: 'Leave allocation updated successfully',
      data: allocation
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequests = async (req, res, next) => {
  try {
    const { employeeId, status, department, search, page, limit } = req.query;
    const result = await leaveService.getLeaveRequests({
      employeeId,
      status,
      department,
      search,
      currentEmployeeId: req.user.employeeId,
      userRole: req.user.role,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: result.requests,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await leaveService.getLeaveRequestById(id);
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (req, res, next) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;
    const request = await leaveService.createLeaveRequest({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      reason,
      currentEmployeeId: req.user.employeeId,
      userRole: req.user.role
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

export const approveLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedRequest = await leaveService.approveLeaveRequest(
      id,
      req.user.employeeId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

export const rejectLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const updatedRequest = await leaveService.rejectLeaveRequest(
      id,
      req.user.employeeId,
      rejectionReason,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

export const cancelLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await leaveService.cancelLeaveRequest(
      id,
      req.user.employeeId,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
