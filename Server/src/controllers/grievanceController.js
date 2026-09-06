import * as grievanceService from '../services/grievanceService.js';

export const createGrievance = async (req, res, next) => {
  try {
    const grievance = await grievanceService.createGrievanceService(req.body, req.user);
    res.status(201).json({
      status: 'success',
      message: 'Grievance ticket submitted successfully.',
      data: grievance
    });
  } catch (error) {
    next(error);
  }
};

export const getGrievances = async (req, res, next) => {
  try {
    const grievances = await grievanceService.getGrievancesService(req.user, req.query);
    res.status(200).json({
      status: 'success',
      count: grievances.length,
      data: grievances
    });
  } catch (error) {
    next(error);
  }
};

export const getGrievanceById = async (req, res, next) => {
  try {
    const grievance = await grievanceService.getGrievanceByIdService(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: grievance
    });
  } catch (error) {
    next(error);
  }
};

export const resolveGrievance = async (req, res, next) => {
  try {
    const grievance = await grievanceService.resolveGrievanceService(req.params.id, req.body, req.user);
    res.status(200).json({
      status: 'success',
      message: 'Grievance resolved successfully.',
      data: grievance
    });
  } catch (error) {
    next(error);
  }
};

export const rejectGrievance = async (req, res, next) => {
  try {
    const grievance = await grievanceService.rejectGrievanceService(req.params.id, req.body, req.user);
    res.status(200).json({
      status: 'success',
      message: 'Grievance rejected.',
      data: grievance
    });
  } catch (error) {
    next(error);
  }
};
