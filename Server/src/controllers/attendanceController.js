import { 
  getTodayStatusService, 
  punchInService, 
  punchOutService, 
  getOperationalRosterService, 
  correctAttendanceService, 
  getAttendanceMetricsService,
  getMyAttendanceMetricsService,
  getMyAttendanceHistoryService,
  bulkValidateLogsService,
  exportTimesheetService
} from '../services/attendanceService.js';

const HR_ADMIN_ROLES = ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'];

/**
 * Controller: Get current punch status for active session.
 */
export const getStatus = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    const status = await getTodayStatusService(employeeId);
    res.status(200).json({
      status: 'success',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Handle Employee Punch In (Check-In).
 */
export const punchIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    const result = await punchInService(employeeId);
    res.status(200).json({
      status: 'success',
      message: 'Successfully clocked in.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Handle Employee Punch Out (Check-Out).
 */
export const punchOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    const result = await punchOutService(employeeId);
    res.status(200).json({
      status: 'success',
      message: 'Successfully clocked out.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Fetch Operational Attendance Roster with filters.
 * Only accessible by HR/Admin roles — enforced at route level via requireRoles.
 */
export const getRoster = async (req, res, next) => {
  try {
    const rosterData = await getOperationalRosterService(req.query);
    res.status(200).json({
      status: 'success',
      data: rosterData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Apply Attendance Correction / Manual Adjustment.
 */
export const correctAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedRecord = await correctAttendanceService(id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Attendance record updated successfully.',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get summary attendance metrics.
 * Returns org-wide metrics for HR/Admin; employee's own metrics for EMPLOYEE role.
 */
export const getMetrics = async (req, res, next) => {
  try {
    let metrics;
    if (HR_ADMIN_ROLES.includes(req.user.role)) {
      metrics = await getAttendanceMetricsService();
    } else {
      // EMPLOYEE role — scope metrics to their own records
      metrics = await getMyAttendanceMetricsService(req.user.employeeId);
    }
    res.status(200).json({
      status: 'success',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get authenticated employee's own attendance history.
 * The employee ID is always taken from the JWT — never from the request body/query.
 */
export const getMyHistory = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    const historyData = await getMyAttendanceHistoryService(employeeId, req.query);
    res.status(200).json({
      status: 'success',
      data: historyData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Bulk validate selected attendance log records.
 * Only accessible by HR/Admin roles — enforced at route level via requireRoles.
 */
export const bulkValidateLogs = async (req, res, next) => {
  try {
    const { attendanceIds } = req.body;
    if (!Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'attendanceIds must be a non-empty array.'
      });
    }
    const result = await bulkValidateLogsService(attendanceIds);
    res.status(200).json({
      status: 'success',
      message: `${result.validated} attendance record(s) validated successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Export timesheet data for payroll as CSV.
 * Only accessible by HR/Admin roles — enforced at route level via requireRoles.
 */
export const exportTimesheet = async (req, res, next) => {
  try {
    const rows = await exportTimesheetService(req.query);

    // Build CSV content
    const headers = [
      'Employee Code',
      'First Name',
      'Last Name',
      'Department',
      'Job Position',
      'Work Date',
      'Check In',
      'Check Out',
      'Worked Hours',
      'Overtime Hours',
      'Manual Edit'
    ];

    const csvRows = rows.map((r) => [
      r.employee_code || '',
      r.first_name || '',
      r.last_name || '',
      r.department || '',
      r.job_position || '',
      r.work_date ? new Date(r.work_date).toISOString().split('T')[0] : '',
      r.check_in ? new Date(r.check_in).toISOString().replace('T', ' ').substring(0, 19) : '',
      r.check_out ? new Date(r.check_out).toISOString().replace('T', ' ').substring(0, 19) : '',
      r.worked_hours != null ? parseFloat(r.worked_hours).toFixed(2) : '',
      r.overtime_hours != null ? parseFloat(r.overtime_hours).toFixed(2) : '',
      r.is_manual_edit ? 'Yes' : 'No'
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="timesheet_${today}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
