import * as scheduleService from '../services/scheduleService.js';

export async function getSchedules(req, res, next) {
  try {
    const schedules = await scheduleService.getSchedules();
    res.status(200).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
}

export async function getScheduleById(req, res, next) {
  try {
    const schedule = await scheduleService.getScheduleById(req.params.id);
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req, res, next) {
  try {
    const created = await scheduleService.createSchedule(req.body);
    res.status(201).json({
      success: true,
      message: 'Working schedule created successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSchedule(req, res, next) {
  try {
    const updated = await scheduleService.updateSchedule(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Working schedule updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSchedule(req, res, next) {
  try {
    const result = await scheduleService.deleteSchedule(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Working schedule deleted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}
