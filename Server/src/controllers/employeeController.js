import * as employeeService from '../services/employeeService.js';

export const listEmployees = async (req, res, next) => {
  try {
    const { search, department, status, page, limit } = req.query;
    const result = await employeeService.getEmployees({
      search,
      department,
      status,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: result.employees,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.updateEmployee(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await employeeService.deactivateEmployee(id);

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await employeeService.getDepartments();

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

export const getManagers = async (req, res, next) => {
  try {
    const { excludeId } = req.query;
    const managers = await employeeService.getEligibleManagers(excludeId);

    res.status(200).json({
      success: true,
      data: managers
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await employeeService.getEmployeeStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

