import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const AI_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5001';

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

export const aiClient = axios.create({
  baseURL: AI_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication
export const loginApi = async (username, password) => {
  const res = await apiClient.post('/api/auth/login', { username, password });
  return res.data;
};

export const getMeApi = async () => {
  const res = await apiClient.get('/api/auth/me');
  return res.data;
};

// Dashboard
export const getDashboardApi = async () => {
  const res = await apiClient.get('/api/dashboard');
  return res.data;
};

// Employees
export const getEmployeesApi = async () => {
  const res = await apiClient.get('/api/employees');
  return res.data;
};

export const createEmployeeApi = async (employeeData) => {
  const res = await apiClient.post('/api/employees', employeeData);
  return res.data;
};

export const updateEmployeeApi = async (id, employeeData) => {
  const res = await apiClient.put(`/api/employees/${id}`, employeeData);
  return res.data;
};

export const updateEmployeeStatusApi = async (id, status) => {
  const res = await apiClient.patch(`/api/employees/${id}/status?status=${status}`);
  return res.data;
};

// Attendance
export const getAttendanceApi = async () => {
  const res = await apiClient.get('/api/attendance');
  return res.data;
};

export const getMyAttendanceApi = async () => {
  const res = await apiClient.get('/api/attendance/my');
  return res.data;
};

export const recordAttendanceApi = async (data) => {
  const res = await apiClient.post('/api/attendance/recognize', data);
  return res.data;
};

export const exportAttendanceCsvUrl = `${BACKEND_URL}/api/attendance/export`;

// Leaves
export const getLeavesApi = async () => {
  const res = await apiClient.get('/api/leaves');
  return res.data;
};

export const getMyLeavesApi = async () => {
  const res = await apiClient.get('/api/leaves/my');
  return res.data;
};

export const createLeaveApi = async (leaveData) => {
  const res = await apiClient.post('/api/leaves', leaveData);
  return res.data;
};

export const approveLeaveApi = async (id) => {
  const res = await apiClient.patch(`/api/leaves/${id}/approve`);
  return res.data;
};

export const rejectLeaveApi = async (id) => {
  const res = await apiClient.patch(`/api/leaves/${id}/reject`);
  return res.data;
};

// Salary
export const getSalaryApi = async () => {
  const res = await apiClient.get('/api/salary');
  return res.data;
};

export const getMySalaryApi = async () => {
  const res = await apiClient.get('/api/salary/my');
  return res.data;
};

export const generateSalaryApi = async (employeeId, month, year) => {
  const res = await apiClient.post(`/api/salary/generate?employeeId=${employeeId}&month=${month}&year=${year}`);
  return res.data;
};

// AI Face Service
export const aiRecognizeApi = async (imageData) => {
  const res = await aiClient.post('/api/recognize', { imageData });
  return res.data;
};

export const aiRegisterApi = async (employeeId, employeeName, images) => {
  const res = await aiClient.post('/api/register', { employeeId, employeeName, images });
  return res.data;
};

export const aiHealthApi = async () => {
  const res = await aiClient.get('/health');
  return res.data;
};

// Working Hours Summary
export const getMyWorkingHoursSummaryApi = async () => {
  const res = await apiClient.get('/api/attendance/my/summary');
  return res.data;
};

// Complaints
export const getComplaintsApi = async () => {
  const res = await apiClient.get('/api/complaints');
  return res.data;
};

export const getMyComplaintsApi = async () => {
  const res = await apiClient.get('/api/complaints/my');
  return res.data;
};

export const submitComplaintApi = async (complaintData) => {
  const res = await apiClient.post('/api/complaints', complaintData);
  return res.data;
};

export const updateComplaintStatusApi = async (id, statusData) => {
  const res = await apiClient.patch(`/api/complaints/${id}/status`, statusData);
  return res.data;
};

// Company Rules & Policies
export const getCompanyRuleApi = async () => {
  const res = await apiClient.get('/api/attendance/rule');
  return res.data;
};

export const updateCompanyRuleApi = async (ruleData) => {
  const res = await apiClient.put('/api/attendance/rule', ruleData);
  return res.data;
};

// Absentee Automation
export const markDailyAbsenteesApi = async (date) => {
  const url = date ? `/api/attendance/mark-absent?date=${date}` : '/api/attendance/mark-absent';
  const res = await apiClient.post(url);
  return res.data;
};

