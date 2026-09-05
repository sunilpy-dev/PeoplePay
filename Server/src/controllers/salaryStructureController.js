/**
 * ==============================================================================
 * PEOPLEPAY360: SALARY STRUCTURE & RULES CONTROLLER
 * ==============================================================================
 * 
 * WHAT THIS FILE DOES IN SIMPLE WORDS:
 * When the React frontend sends an HTTP request (like "GET /api/v1/salary-structures"
 * or "POST /api/v1/salary-structures/:id/simulate"), Express routes it here.
 * 
 * Each controller function:
 * 1. Unpacks the request parameters and body.
 * 2. Calls the appropriate service method.
 * 3. Sends back a clean, standardized JSON response:
 *    { "success": true, "data": { ... } }
 * 4. If something goes wrong, forwards the error to our centralized errorHandler.
 */

import * as salaryService from '../services/salaryStructureService.js';
import { validateRuleDAG } from '../engine/dagValidator.js';

/**
 * GET /api/v1/salary-structures
 * Returns list of all registered salary structures with rule and employee counts.
 */
export const getStructures = async (req, res, next) => {
  try {
    const structures = await salaryService.getAllStructures();
    res.status(200).json({
      success: true,
      data: structures
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/salary-structures/:id
 * Returns a specific structure with its ordered rules and DAG verification status.
 */
export const getStructure = async (req, res, next) => {
  try {
    const structure = await salaryService.getStructureById(req.params.id);
    res.status(200).json({
      success: true,
      data: structure
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/salary-structures
 * Creates a new salary structure schema.
 */
export const createStructure = async (req, res, next) => {
  try {
    const created = await salaryService.createStructure(req.body);
    res.status(201).json({
      success: true,
      message: 'Salary structure created successfully.',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/salary-structures/:id
 * Updates structure metadata (name, code, active status).
 */
export const updateStructure = async (req, res, next) => {
  try {
    const updated = await salaryService.updateStructure(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Salary structure updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/salary-structures/:id
 * Deletes a structure (if not linked to active contracts).
 */
export const deleteStructure = async (req, res, next) => {
  try {
    const result = await salaryService.deleteStructure(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Salary structure deleted successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/salary-structures/:id/rules
 * Adds a new salary rule to the structure after validating the DAG for circular dependencies.
 */
export const addRule = async (req, res, next) => {
  try {
    const rule = await salaryService.addRuleToStructure(req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Salary rule added and verified via DAG.',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/salary-structures/:id/rules/:ruleId
 * Updates an existing rule and re-verifies DAG integrity.
 */
export const updateRule = async (req, res, next) => {
  try {
    const rule = await salaryService.updateRuleInStructure(req.params.id, req.params.ruleId, req.body);
    res.status(200).json({
      success: true,
      message: 'Salary rule updated and verified via DAG.',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/salary-structures/:id/rules/:ruleId
 * Deletes a rule from the structure (if no other rule depends on it).
 */
export const deleteRule = async (req, res, next) => {
  try {
    const result = await salaryService.deleteRuleFromStructure(req.params.id, req.params.ruleId);
    res.status(200).json({
      success: true,
      message: 'Salary rule deleted.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/salary-structures/:id/simulate
 * Runs an interactive simulation against test compensation inputs (wage, worked days, overtime).
 */
export const simulateStructure = async (req, res, next) => {
  try {
    const simulationResult = await salaryService.simulateStructureCalculation(req.params.id, req.body || {});
    res.status(200).json({
      success: true,
      data: simulationResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/salary-structures/validate-dag
 * Dry-run check for an arbitrary rule array before saving.
 */
export const validateDAG = async (req, res, next) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        error: 'Rules must be an array.'
      });
    }
    const result = validateRuleDAG(rules);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
