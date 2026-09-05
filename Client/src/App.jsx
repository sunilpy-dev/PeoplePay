import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { Unauthorized } from './views/Unauthorized';
import { Contracts } from './views/Contracts';
import { WorkingSchedules } from './views/WorkingSchedules';
import { EmployeeDirectory } from './views/Employees/EmployeeDirectory';
import { EmployeeDetails } from './views/Employees/EmployeeDetails';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';

export function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected App Routes under AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/contracts" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="unauthorized" element={<Unauthorized />} />
        
        {/* Phase 2: Employee Master Management */}
        <Route 
          path="employees" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER']}>
              <EmployeeDirectory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="employees/:id" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER']}>
              <EmployeeDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="contracts" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER']}>
              <Contracts />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="schedules" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER']}>
              <WorkingSchedules />
            </ProtectedRoute>
          } 
        />
        <Route path="attendance" element={<Dashboard />} />
        <Route path="leaves" element={<Dashboard />} />
        <Route 
          path="payroll/*" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
