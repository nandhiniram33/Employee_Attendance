import React, { useState, useEffect, useRef } from 'react';
import {
  loginApi,
  getMeApi,
  getDashboardApi,
  getEmployeesApi,
  createEmployeeApi,
  updateEmployeeStatusApi,
  getAttendanceApi,
  getMyAttendanceApi,
  recordAttendanceApi,
  exportAttendanceCsvUrl,
  getLeavesApi,
  getMyLeavesApi,
  createLeaveApi,
  approveLeaveApi,
  rejectLeaveApi,
  getSalaryApi,
  getMySalaryApi,
  generateSalaryApi,
  aiRecognizeApi,
  aiRegisterApi,
  aiHealthApi,
  getMyWorkingHoursSummaryApi,
  getComplaintsApi,
  getMyComplaintsApi,
  submitComplaintApi,
  updateComplaintStatusApi,
  getCompanyRuleApi,
  updateCompanyRuleApi,
  markDailyAbsenteesApi,
} from './api/apiClient';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Authentication State
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // Auto-clear alert after 5s
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Load user details when token is available
  useEffect(() => {
    if (token) {
      getMeApi()
        .then((user) => {
          setCurrentUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await loginApi(loginUsername, loginPassword);
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        setCurrentUser({ username: res.username, role: res.role });
        setAlert({ type: 'success', message: `Welcome back, ${res.username}!` });
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setCurrentUser(null);
    setCurrentPage('Dashboard');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">HR Sync Portal</h1>
            <p className="text-sm text-slate-500 mt-1">AI-Based Attendance & Payroll Management</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Username / Email</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50/50"
                placeholder="admin or employee email"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50/50"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-2 font-medium text-center">Quick Login Demo Accounts:</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setLoginUsername('admin'); setLoginPassword('admin123'); }}
                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium transition"
              >
                Admin (admin123)
              </button>
              <button
                type="button"
                onClick={() => { setLoginUsername('EMP001'); setLoginPassword('emp123'); }}
                className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs rounded-lg font-semibold transition"
              >
                Employee (EMP001 / emp123)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col md:flex-row">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{currentPage}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {currentUser?.role || 'USER'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged in as <span className="font-semibold text-slate-700">{currentUser?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </header>

        {alert && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span>{alert.message}</span>
            <button onClick={() => setAlert(null)} className="font-bold opacity-70 hover:opacity-100">&times;</button>
          </div>
        )}

        {/* Admin Portal Views */}
        {isAdmin && currentPage === 'Dashboard' && <AdminDashboardView setAlert={setAlert} />}
        {isAdmin && currentPage === 'Employees' && <EmployeesView isAdmin={isAdmin} setAlert={setAlert} />}
        {isAdmin && currentPage === 'Attendance' && <AttendanceView isAdmin={isAdmin} currentUser={currentUser} setAlert={setAlert} />}
        {isAdmin && currentPage === 'Leaves' && <AdminLeavesView setAlert={setAlert} />}
        {isAdmin && currentPage === 'Salary' && <SalaryView isAdmin={isAdmin} currentUser={currentUser} setAlert={setAlert} />}
        {isAdmin && currentPage === 'Reports' && <ReportsView setAlert={setAlert} />}
        {isAdmin && currentPage === 'Complaints' && <AdminComplaintsView setAlert={setAlert} />}
        {isAdmin && currentPage === 'Company Rules' && <CompanyRulesView setAlert={setAlert} />}

        {/* Employee Portal Views */}
        {!isAdmin && currentPage === 'Dashboard' && <EmployeeDashboardView currentUser={currentUser} setCurrentPage={setCurrentPage} setAlert={setAlert} />}
        {!isAdmin && currentPage === 'Face Attendance' && <FaceAttendanceView currentUser={currentUser} setAlert={setAlert} />}
        {!isAdmin && currentPage === 'My Attendance' && <MyAttendanceView currentUser={currentUser} setAlert={setAlert} />}
        {!isAdmin && currentPage === 'Apply for Leave' && <ApplyLeaveView currentUser={currentUser} setCurrentPage={setCurrentPage} setAlert={setAlert} />}
        {!isAdmin && currentPage === 'My Leaves' && <MyLeavesView currentUser={currentUser} setAlert={setAlert} />}
        {!isAdmin && currentPage === 'Complaints' && <EmployeeComplaintsView currentUser={currentUser} setAlert={setAlert} />}

        {/* Common View */}
        {currentPage === 'Profile' && <ProfileView currentUser={currentUser} />}
      </main>
    </div>
  );
}

// -------------------------------------------------------------
// SIDEBAR COMPONENT
// -------------------------------------------------------------
const Sidebar = ({ currentPage, setCurrentPage, isAdmin, currentUser, onLogout }) => {
  const navItems = isAdmin
    ? ['Dashboard', 'Employees', 'Attendance', 'Leaves', 'Salary', 'Reports', 'Complaints', 'Company Rules', 'Profile']
    : ['Dashboard', 'Face Attendance', 'My Attendance', 'Apply for Leave', 'My Leaves', 'Complaints', 'Profile'];

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shrink-0">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">HR Sync</div>
            <div className="text-xs text-indigo-400 font-medium">
              {isAdmin ? 'Admin Portal' : 'Employee Portal'}
            </div>
          </div>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setCurrentPage(item)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                currentPage === item ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{item}</span>
              {currentPage === item && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
            </button>
          ))}
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition flex items-center gap-2 mt-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>System Online</span>
        </div>
        <p>Spring Boot 3.3 &bull; AI OpenCV</p>
      </div>
    </aside>
  );
};

// -------------------------------------------------------------
// ADMIN DASHBOARD VIEW
// -------------------------------------------------------------
const AdminDashboardView = ({ setAlert }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardApi()
      .then((res) => setData(res))
      .catch((err) => setAlert({ type: 'error', message: 'Failed to load dashboard metrics' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading live dashboard metrics...</div>;
  if (!data) return <div className="p-8 text-center text-slate-500">No dashboard data available.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={data.totalEmployees ?? 0} subtitle="Active on payroll" icon="users" />
        <StatCard label="Present Today" value={data.presentToday ?? 0} subtitle="Recorded at biometric" icon="check" />
        <StatCard label="Absent Today" value={data.absentToday ?? 0} subtitle="Unaccounted today" icon="x" />
        <StatCard label="Late Today" value={data.lateEmployees ?? 0} subtitle="Arrived past threshold" icon="clock" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Employees on Leave</div>
          <div className="text-2xl font-bold mt-2 text-indigo-600">{data.employeesOnLeave ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">Approved for today</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Pending Leave Requests</div>
          <div className="text-2xl font-bold mt-2 text-amber-600">{data.pendingLeaves ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">Awaiting admin review</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Estimated Monthly Payroll</div>
          <div className="text-2xl font-bold mt-2 text-emerald-600">₹{Number(data.estimatedPayroll || 0).toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">Based on base salaries</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">7-Day Attendance Trend</h3>
        <div className="h-72 w-full">
          {data.attendanceTrends && data.attendanceTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="late" name="Late Arrival" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">No trend records logged yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtitle }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
    <div className="mt-2 text-3xl font-extrabold text-slate-800">{value}</div>
    <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
  </div>
);

// -------------------------------------------------------------
// EMPLOYEES VIEW (WITH FACE ENROLLMENT)
// -------------------------------------------------------------
const EmployeesView = ({ isAdmin, setAlert }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    monthlySalary: '35000',
    workingHoursPerDay: 8,
  });

  // Face Enrollment State
  const [captureSamples, setCaptureSamples] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [enrollingEmp, setEnrollingEmp] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchEmployees = () => {
    setLoading(true);
    getEmployeesApi()
      .then((res) => setEmployees(res))
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch employees' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleStartCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAlert({ type: 'error', message: 'Webcam not supported in this browser. You can use Upload Photo instead.' });
      return;
    }

    setCameraLoading(true);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch (strictErr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera error:', err);
      setIsCameraActive(false);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera permission denied. Please allow camera permissions in browser settings.'
        : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
        ? 'No camera found. You can upload photo files using the "Upload Photo" button.'
        : `Camera error: ${err.message || 'Cannot access camera'}`;
      setAlert({ type: 'error', message: msg });
    } finally {
      setCameraLoading(false);
    }
  };

  // Sync stream to video element whenever camera becomes active and video element mounts
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCaptureSample = () => {
    const video = videoRef.current;
    if (!video) {
      setAlert({ type: 'error', message: 'Camera feed not ready yet' });
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptureSamples((prev) => [...prev, dataUrl]);
    setAlert({ type: 'success', message: `Face sample captured! (${captureSamples.length + 1} enrolled)` });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCaptureSamples((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
    setAlert({ type: 'success', message: `Added ${files.length} photo(s)` });
    e.target.value = '';
  };

  const handleSubmitEmployee = async (e) => {
    e.preventDefault();
    try {
      const created = await createEmployeeApi({
        ...formData,
        monthlySalary: parseFloat(formData.monthlySalary) || 0,
      });

      // If face samples were captured, register with AI service
      if (captureSamples.length > 0) {
        try {
          await aiRegisterApi(created.employeeCode, created.name, captureSamples);
          setAlert({ type: 'success', message: `Employee ${created.name} created and face enrolled successfully!` });
        } catch (aiErr) {
          setAlert({ type: 'warning', message: `Employee created, but face enrollment failed: ${aiErr.response?.data?.message || aiErr.message}. You can retry anytime via Face ID button.` });
        }
      } else {
        setAlert({ type: 'success', message: `Employee ${created.name} created successfully!` });
      }

      handleStopCamera();
      setShowModal(false);
      setCaptureSamples([]);
      fetchEmployees();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create employee' });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateEmployeeStatusApi(id, newStatus);
      setAlert({ type: 'success', message: `Status updated to ${newStatus}` });
      fetchEmployees();
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to update employee status' });
    }
  };

  const filtered = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
          <p className="text-xs text-slate-500">Manage organizational staff and biometric enrollment</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isAdmin && (
            <button
              onClick={() => { setShowModal(true); setCaptureSamples([]); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              + Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
              <th className="pb-3">Code</th>
              <th className="pb-3">Employee</th>
              <th className="pb-3">Department</th>
              <th className="pb-3">Designation</th>
              <th className="pb-3">Monthly Pay</th>
              <th className="pb-3">Status</th>
              {isAdmin && <th className="pb-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 font-semibold text-slate-700">{emp.employeeCode}</td>
                <td>
                  <div className="font-semibold text-slate-800">{emp.name}</div>
                  <div className="text-xs text-slate-400">{emp.email}</div>
                </td>
                <td><span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">{emp.department}</span></td>
                <td className="text-slate-600">{emp.designation}</td>
                <td className="font-semibold text-slate-800">₹{Number(emp.monthlySalary || 0).toLocaleString()}</td>
                <td>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="text-right space-x-2">
                    <button
                      onClick={() => {
                        setEnrollingEmp(emp);
                        setCaptureSamples([]);
                        setEnrollStatus(null);
                      }}
                      className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                      title="Enroll or re-enroll facial biometric samples"
                    >
                      📸 Face ID
                    </button>
                    <button
                      onClick={() => handleToggleStatus(emp.id, emp.status)}
                      className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1 rounded hover:bg-slate-100"
                    >
                      {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No employee records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b">
              <h3 className="text-lg font-bold text-slate-800">Register New Employee & Face Enrollment</h3>
              <button onClick={() => { handleStopCamera(); setShowModal(false); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleSubmitEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="EMP-101"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ravi Kumar"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ravi@company.com"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Daily Work Hours</label>
                  <input
                    type="number"
                    value={formData.workingHoursPerDay}
                    onChange={(e) => setFormData({ ...formData, workingHoursPerDay: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Biometric Face Sample Capture Section */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Biometric Face Enrollment</h4>
                    <p className="text-xs text-slate-500">Capture 1-3 face samples via webcam or upload photo files</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium transition flex items-center gap-1 border border-slate-300"
                    >
                      📁 Upload Photo
                    </button>
                    {!isCameraActive ? (
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        disabled={cameraLoading}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs rounded-xl font-medium transition flex items-center gap-1 shadow-sm"
                      >
                        📷 {cameraLoading ? 'Starting...' : 'Start Camera'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopCamera}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-medium transition flex items-center gap-1"
                      >
                        ⏹ Stop Camera
                      </button>
                    )}
                  </div>
                </div>

                {isCameraActive && (
                  <div className="space-y-3">
                    <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video max-h-56 flex items-center justify-center border border-slate-800 shadow-inner">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border border-dashed border-indigo-400/50 rounded-xl m-4 pointer-events-none flex items-center justify-center">
                        <span className="text-[11px] text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur">
                          Align face inside frame
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCaptureSample}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      📸 Capture Face Sample ({captureSamples.length} captured)
                    </button>
                  </div>
                )}

                {captureSamples.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Enrolled Face Samples ({captureSamples.length})</span>
                      <button
                        type="button"
                        onClick={() => setCaptureSamples([])}
                        className="text-rose-600 text-[11px] hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {captureSamples.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-indigo-500 shrink-0 shadow-sm">
                          <img src={img} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCaptureSamples(captureSamples.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] w-4 h-4 rounded-bl flex items-center justify-center hover:bg-rose-700"
                            title="Remove"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { handleStopCamera(); setShowModal(false); }}
                  className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-600/30"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Re-enroll Face Modal for Existing Employee (Safe Retry Without Duplicates) */}
      {enrollingEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4 border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Biometric Face Enrollment</h3>
                <p className="text-xs text-slate-500">Employee: {enrollingEmp.name} ({enrollingEmp.employeeCode})</p>
              </div>
              <button
                onClick={() => { handleStopCamera(); setEnrollingEmp(null); }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Capture 3 to 5 clear face samples using the webcam or upload photos to train the biometric recognition model.
              </p>

              {/* Camera controls */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-medium transition"
                >
                  📁 Upload Photo(s)
                </button>
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    disabled={cameraLoading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl font-medium transition"
                  >
                    📷 {cameraLoading ? 'Starting...' : 'Start Camera'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-xl font-medium transition"
                  >
                    Stop Camera
                  </button>
                )}
              </div>

              {isCameraActive && (
                <div className="space-y-2">
                  <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video max-h-56 mx-auto">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureSample}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow transition"
                  >
                    📸 Capture Face Sample ({captureSamples.length} captured)
                  </button>
                </div>
              )}

              {/* Samples preview */}
              {captureSamples.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-1 flex justify-between">
                    <span>Captured Samples ({captureSamples.length})</span>
                    <button
                      type="button"
                      onClick={() => setCaptureSamples([])}
                      className="text-rose-600 text-[11px] hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {captureSamples.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-indigo-500 shrink-0">
                        <img src={img} alt={`Sample ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCaptureSamples(captureSamples.filter((_, i) => i !== idx))}
                          className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] w-3.5 h-3.5 rounded-bl flex items-center justify-center"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {enrollStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${
                  enrollStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {enrollStatus.message}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { handleStopCamera(); setEnrollingEmp(null); }}
                  className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={enrollLoading || captureSamples.length === 0}
                  onClick={async () => {
                    setEnrollLoading(true);
                    setEnrollStatus(null);
                    try {
                      await aiRegisterApi(enrollingEmp.employeeCode, enrollingEmp.name, captureSamples);
                      setEnrollStatus({
                        type: 'success',
                        message: `Face successfully enrolled for ${enrollingEmp.name} (${captureSamples.length} samples trained)!`,
                      });
                      setAlert({ type: 'success', message: `Face biometric templates updated for ${enrollingEmp.name}` });
                    } catch (err) {
                      setEnrollStatus({
                        type: 'error',
                        message: err.response?.data?.message || err.message || 'Enrollment failed. Please retry with clearer lighting.',
                      });
                    } finally {
                      setEnrollLoading(false);
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
                >
                  {enrollLoading ? 'Enrolling...' : 'Save Face Biometrics'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// ATTENDANCE VIEW (WITH LIVE WEBCAM & RECOGNITION)
// -------------------------------------------------------------
const AttendanceView = ({ isAdmin, currentUser, setAlert }) => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingUploadAction = useRef('CHECK_IN');
  const [markingAbsent, setMarkingAbsent] = useState(false);

  const fetchAttendance = () => {
    setLoading(true);
    const req = isAdmin ? getAttendanceApi() : getMyAttendanceApi();
    req
      .then((res) => setAttendances(res))
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch attendance records' }))
      .finally(() => setLoading(false));
  };

  const handleMarkAbsentees = async () => {
    if (!window.confirm("Are you sure you want to mark absent for all active employees who haven't checked in today?")) return;
    setMarkingAbsent(true);
    try {
      const res = await markDailyAbsenteesApi();
      setAlert({ type: 'success', message: `Processed absentees: ${res.markedAbsentees} employee(s) marked.` });
      fetchAttendance();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to mark absentees' });
    } finally {
      setMarkingAbsent(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [isAdmin]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    setScanStatus(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAlert({ type: 'error', message: 'Webcam not supported in this browser. You can upload a photo to scan below.' });
      return;
    }
    setCameraLoading(true);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch (strictErr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Attendance webcam error:', err);
      setIsCameraActive(false);
      const msg = err.name === 'NotAllowedError'
        ? 'Webcam permission denied. Please allow camera permissions in browser settings.'
        : err.name === 'NotFoundError'
        ? 'No webcam found. You can upload a photo snapshot below to mark attendance.'
        : `Unable to access webcam: ${err.message || 'Unknown error'}`;
      setAlert({ type: 'error', message: msg });
    } finally {
      setCameraLoading(false);
    }
  };

  // Sync stream to video element on state change
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const processFrameAndMark = async (frameData, action = 'CHECK_IN') => {
    const actionLabel = action === 'CHECK_IN' ? 'Check-In' : 'Check-Out';
    setScanStatus({ type: 'info', message: `Analyzing frame with AI face recognition for ${actionLabel}...` });

    try {
      const aiResult = await aiRecognizeApi(frameData);

      if (aiResult.match && aiResult.employeeId) {
        setScanStatus({
          type: 'info',
          message: `Recognized: ${aiResult.employeeName} (${aiResult.confidence}% confidence). Recording ${actionLabel}...`,
        });

        const attendanceRecord = await recordAttendanceApi({
          employeeId: parseInt(aiResult.employeeId) || null,
          employeeCode: aiResult.employeeId,
          action: action,
        });

        const doneLabel = action === 'CHECK_IN' ? 'Checked In' : 'Checked Out';
        const hoursText = attendanceRecord.workingHours ? ` (${attendanceRecord.workingHours} hrs worked)` : '';
        setScanStatus({
          type: 'success',
          message: `✅ ${doneLabel} successfully for ${aiResult.employeeName}! Status: ${attendanceRecord.status}${hoursText}`,
        });
        setAlert({ type: 'success', message: `${doneLabel}: ${aiResult.employeeName} (${attendanceRecord.status})` });
        fetchAttendance();
      } else {
        setScanStatus({
          type: 'error',
          message: aiResult.message || 'Face not recognized. Please face the camera directly or enroll your face first.',
        });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'AI recognition service unavailable.';
      setScanStatus({
        type: 'error',
        message: errMsg,
      });
      setAlert({
        type: 'error',
        message: errMsg,
      });
    }
  };

  const handleRecognizeAndMark = async (action = 'CHECK_IN') => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL('image/jpeg', 0.9);
    await processFrameAndMark(frameData, action);
  };

  const triggerUpload = (action) => {
    pendingUploadAction.current = action;
    fileInputRef.current?.click();
  };

  const handleUploadPhotoRecognize = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      await processFrameAndMark(evt.target.result, pendingUploadAction.current);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Live AI Attendance Camera Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Biometric Attendance Scanner</h2>
            <p className="text-xs text-slate-500">Choose Check In or Check Out to record attendance accurately</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPhotoRecognize}
            />
            <button
              type="button"
              onClick={() => triggerUpload('CHECK_IN')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-emerald-300 cursor-pointer"
            >
              📁 Photo Check In
            </button>
            <button
              type="button"
              onClick={() => triggerUpload('CHECK_OUT')}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-amber-300 cursor-pointer"
            >
              📁 Photo Check Out
            </button>
            {!isCameraActive ? (
              <button
                onClick={handleStartCamera}
                disabled={cameraLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                📷 {cameraLoading ? 'Starting...' : 'Start Webcam'}
              </button>
            ) : (
              <button
                onClick={handleStopCamera}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Turn Off Camera
              </button>
            )}
          </div>
        </div>

        {isCameraActive ? (
          <div>
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video max-h-80 mx-auto flex items-center justify-center border border-slate-800 shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-dashed border-indigo-400/40 rounded-2xl pointer-events-none m-8 flex items-center justify-center">
                <span className="text-xs text-indigo-300 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur">Position face within frame</span>
              </div>
            </div>

            {/* Explicit Check In and Check Out Buttons below camera */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRecognizeAndMark('CHECK_IN')}
                className="py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer"
              >
                <span className="text-xl">🟢</span>
                <span>Scan Face &amp; Check In</span>
              </button>
              <button
                type="button"
                onClick={() => handleRecognizeAndMark('CHECK_OUT')}
                className="py-3 px-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer"
              >
                <span className="text-xl">🟠</span>
                <span>Scan Face &amp; Check Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Webcam is currently off. Click "Start Webcam" to begin face scan or use Photo buttons above.</p>
          </div>
        )}

        {scanStatus && (
          <div className={`mt-4 p-3 rounded-xl text-sm border font-medium ${
            scanStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            scanStatus.type === 'info' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
            'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {scanStatus.message}
          </div>
        )}
      </div>

      {/* Attendance History Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Attendance Log</h3>
            <p className="text-xs text-slate-500">Live check-in, check-out, and computed hours</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={handleMarkAbsentees}
                disabled={markingAbsent}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                title="Mark employees who haven't checked in today as ABSENT"
              >
                {markingAbsent ? 'Marking...' : 'Mark Daily Absentees'}
              </button>
            )}
            <a
              href={exportAttendanceCsvUrl}
              download="attendance_report.csv"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              Export CSV
            </a>
            <button
              onClick={fetchAttendance}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3">Date</th>
                <th className="pb-3">Employee</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Working Hours</th>
                <th className="pb-3">Overtime</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendances.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 font-medium text-slate-700">{rec.attendanceDate}</td>
                  <td>
                    <div className="font-semibold text-slate-800">{rec.employee?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-400">{rec.employee?.employeeCode}</div>
                  </td>
                  <td className="text-slate-600 font-mono text-xs">
                    {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="text-slate-600 font-mono text-xs">
                    {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="font-semibold text-slate-800">{rec.workingHours ?? '0.00'} hrs</td>
                  <td className="text-slate-600">{rec.overtimeHours ?? '0.00'} hrs</td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                      rec.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                      rec.status === 'HALF_DAY' ? 'bg-purple-100 text-purple-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
              {attendances.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">No attendance records logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// ADMIN LEAVES VIEW (APPROVAL WORKFLOW ONLY)
// -------------------------------------------------------------
const AdminLeavesView = ({ setAlert }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchLeaves = () => {
    setLoading(true);
    getLeavesApi()
      .then((res) => setLeaves(res))
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch leave requests' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveLeaveApi(id);
      setAlert({ type: 'success', message: 'Leave request approved successfully!' });
      fetchLeaves();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Approval failed' });
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectLeaveApi(id);
      setAlert({ type: 'success', message: 'Leave request rejected' });
      fetchLeaves();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Rejection failed' });
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (filterStatus === 'ALL') return true;
    return l.status === filterStatus;
  });

  const totalPending = leaves.filter((l) => l.status === 'PENDING').length;
  const totalApproved = leaves.filter((l) => l.status === 'APPROVED').length;
  const totalRejected = leaves.filter((l) => l.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Leave Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Requests</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">{leaves.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Pending Review</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{totalPending}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Approved</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{totalApproved}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Rejected</div>
          <div className="text-2xl font-bold mt-1 text-rose-600">{totalRejected}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Employee Leave Applications</h2>
            <p className="text-xs text-slate-500">Review, approve, or reject employee leave requests</p>
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
            <button
              onClick={fetchLeaves}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition ml-2"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Leave Type</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Days</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Decision / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5">
                    <div className="font-semibold text-slate-800">{l.employee?.name || 'Employee'}</div>
                    <div className="text-xs text-slate-400 font-mono">{l.employee?.employeeCode} &bull; {l.employee?.department}</div>
                  </td>
                  <td>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                      {l.leaveType}
                    </span>
                  </td>
                  <td className="text-slate-600 font-medium text-xs">
                    {l.startDate} &rarr; {l.endDate}
                  </td>
                  <td className="text-slate-700 font-semibold text-xs">
                    {l.startDate && l.endDate ? (
                      Math.max(1, Math.round((new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1)
                    ) : 1} d
                  </td>
                  <td className="text-slate-600 max-w-xs text-xs truncate" title={l.reason}>
                    {l.reason}
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      l.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="text-right">
                    {l.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(l.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(l.id)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Decided {l.approvedBy?.name ? `by ${l.approvedBy.name}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    No leave requests matching "{filterStatus}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SALARY & PAYROLL VIEW
// -------------------------------------------------------------
const SalaryView = ({ isAdmin, currentUser, setAlert }) => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Payroll generation state
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchSalaries = () => {
    setLoading(true);
    const req = isAdmin ? getSalaryApi() : getMySalaryApi();
    req
      .then((res) => setSalaries(res))
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch salary records' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSalaries();
    if (isAdmin) {
      getEmployeesApi().then((res) => {
        setEmployees(res);
        if (res.length > 0) setSelectedEmpId(res[0].id);
      });
    }
  }, [isAdmin]);

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    try {
      const generated = await generateSalaryApi(selectedEmpId, month, year);
      setAlert({ type: 'success', message: `Payroll calculated for ${generated.employee?.name}: Net ₹${generated.finalSalary}` });
      fetchSalaries();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Payroll generation failed' });
    }
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Automated Payroll Calculation</h3>
          <p className="text-xs text-slate-500 mb-4">Calculates salary according to actual attendance days, approved leaves, and overtime hours</p>
          <form onSubmit={handleGeneratePayroll} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Employee</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-xl text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Month {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-24 px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              Calculate &amp; Save
            </button>
          </form>
        </div>
      )}

      {/* Salary Records Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Salary Disbursal Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3">Employee</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Basic Pay</th>
                <th className="pb-3">Payable Days</th>
                <th className="pb-3">Overtime</th>
                <th className="pb-3">Bonus</th>
                <th className="pb-3">Deductions</th>
                <th className="pb-3">Net Salary</th>
                <th className="pb-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salaries.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 font-semibold text-slate-800">{s.employee?.name}</td>
                  <td className="text-slate-600 font-medium text-xs">{s.salaryMonth} / {s.salaryYear}</td>
                  <td className="text-slate-700">₹{Number(s.basicSalary).toLocaleString()}</td>
                  <td className="text-slate-600">{s.payableDays} days</td>
                  <td className="text-emerald-600 font-medium">+₹{Number(s.overtimeAmount || 0).toLocaleString()}</td>
                  <td className="text-emerald-600 font-medium">+₹{Number(s.bonus || 0).toLocaleString()}</td>
                  <td className="text-rose-600 font-medium">-₹{Number(s.deductions || 0).toLocaleString()}</td>
                  <td className="font-extrabold text-slate-900">₹{Number(s.finalSalary).toLocaleString()}</td>
                  <td className="text-right">
                    <button
                      onClick={() => setSelectedPayslip(s)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {salaries.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 text-sm">No payroll records computed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="border-b pb-4 mb-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Salary Payslip</h3>
                <p className="text-xs text-slate-500">Period: {selectedPayslip.salaryMonth} / {selectedPayslip.salaryYear}</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employee Name:</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.employee?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employee Code:</span>
                <span className="font-mono text-slate-700">{selectedPayslip.employee?.employeeCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department:</span>
                <span className="text-slate-700">{selectedPayslip.employee?.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Basic Monthly Salary:</span>
                <span className="font-semibold text-slate-800">₹{Number(selectedPayslip.basicSalary).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payable Days (Worked):</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.payableDays}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Paid Leaves:</span>
                <span className="text-slate-800">{selectedPayslip.paidLeaveDays}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-emerald-600 font-medium">Overtime Addition:</span>
                <span className="text-emerald-600 font-semibold">+₹{Number(selectedPayslip.overtimeAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-emerald-600 font-medium">Bonus / Incentives:</span>
                <span className="text-emerald-600 font-semibold">+₹{Number(selectedPayslip.bonus || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-rose-600 font-medium">Deductions (Unpaid Leaves):</span>
                <span className="text-rose-600 font-semibold">-₹{Number(selectedPayslip.deductions || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 text-base font-extrabold border-t-2 border-slate-900 text-slate-900">
                <span>Net Pay Disbursed:</span>
                <span>₹{Number(selectedPayslip.finalSalary).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => {
                  const slip = selectedPayslip;
                  const printWindow = window.open('', '_blank', 'width=800,height=800');
                  if (!printWindow) return;
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Payslip - ${slip.employee?.name || 'Employee'}</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
                        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0 0 5px; font-size: 24px; color: #4338ca; }
                        .header p { margin: 0; color: #64748b; font-size: 14px; }
                        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
                        .meta-item { font-size: 14px; }
                        .meta-item strong { color: #0f172a; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
                        th, td { padding: 12px 14px; text-align: left; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
                        th { background: #f8fafc; font-weight: 600; color: #475569; }
                        .amount { text-align: right; }
                        .total-row { font-size: 16px; font-weight: bold; background: #e0e7ff; color: #1e1b4b; }
                        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>HR Sync Enterprise</h1>
                        <p>Official Monthly Salary Payslip</p>
                        <p style="font-weight: 600; margin-top: 5px;">Period: Month ${slip.salaryMonth} / ${slip.salaryYear}</p>
                      </div>
                      <div class="meta-grid">
                        <div class="meta-item"><strong>Employee Name:</strong> ${slip.employee?.name || 'N/A'}</div>
                        <div class="meta-item"><strong>Employee Code:</strong> ${slip.employee?.employeeCode || 'N/A'}</div>
                        <div class="meta-item"><strong>Department:</strong> ${slip.employee?.department || 'N/A'}</div>
                        <div class="meta-item"><strong>Designation:</strong> ${slip.employee?.designation || 'Staff'}</div>
                      </div>
                      <table>
                        <thead>
                          <tr><th>Description</th><th class="amount">Days / Hours</th><th class="amount">Amount (INR)</th></tr>
                        </thead>
                        <tbody>
                          <tr><td>Basic Monthly Salary</td><td class="amount">-</td><td class="amount">₹${Number(slip.basicSalary).toLocaleString()}</td></tr>
                          <tr><td>Payable Attendance Days</td><td class="amount">${slip.payableDays} days</td><td class="amount">Pro-rated</td></tr>
                          <tr><td>Approved Paid Leaves</td><td class="amount">${slip.paidLeaveDays} days</td><td class="amount">Included</td></tr>
                          <tr><td>Overtime Pay</td><td class="amount">-</td><td class="amount" style="color: #059669;">+₹${Number(slip.overtimeAmount || 0).toLocaleString()}</td></tr>
                          <tr><td>Bonus / Incentives</td><td class="amount">-</td><td class="amount" style="color: #059669;">+₹${Number(slip.bonus || 0).toLocaleString()}</td></tr>
                          <tr><td>Deductions (Unpaid Leaves)</td><td class="amount">${slip.unpaidLeaveDays || 0} days</td><td class="amount" style="color: #e11d48;">-₹${Number(slip.deductions || 0).toLocaleString()}</td></tr>
                          <tr class="total-row">
                            <td><strong>Net Salary Disbursed</strong></td>
                            <td class="amount">-</td>
                            <td class="amount"><strong>₹${Number(slip.finalSalary).toLocaleString()}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                      <div class="footer">
                        <p>This is a computer-generated payslip authenticated by HR Sync Biometric Payroll System.</p>
                      </div>
                      <script>window.onload = function() { window.print(); };</script>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                Download / Print PDF
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close Payslip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// REPORTS VIEW
// -------------------------------------------------------------
const ReportsView = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Export Reports &amp; Audit Logs</h2>
        <p className="text-xs text-slate-500">Download system data exports and operational reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 border rounded-2xl bg-slate-50 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-800">Attendance Report (CSV)</div>
            <div className="text-xs text-slate-500 mt-1">Export full employee check-in, check-out and overtime history</div>
          </div>
          <a
            href={exportAttendanceCsvUrl}
            download="attendance_report.csv"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            Download CSV
          </a>
        </div>

        <div className="p-5 border rounded-2xl bg-slate-50 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-800">Biometric AI Service Health</div>
            <div className="text-xs text-slate-500 mt-1">Verify facial recognition microservice connectivity</div>
          </div>
          <button
            onClick={() => aiHealthApi().then((res) => alert(`AI Service Status: ${res.status}\nRegistered Faces: ${res.registeredEmployees?.length || 0}`))}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Check Status
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// COMPANY RULES VIEW
// -------------------------------------------------------------
const CompanyRulesView = ({ setAlert }) => {
  const [rule, setRule] = useState({
    companyStartTime: '09:00',
    companyEndTime: '18:00',
    requiredWorkingHours: 8,
    lateThresholdMinutes: 15,
    halfDayThresholdMinutes: 240,
    overtimeThresholdMinutes: 60,
    workingDaysPerMonth: 26,
    paidLeaveDays: 10,
    unpaidLeaveDays: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCompanyRuleApi()
      .then((data) => {
        if (data) {
          setRule({
            ...data,
            companyStartTime: data.companyStartTime ? data.companyStartTime.substring(0, 5) : '09:00',
            companyEndTime: data.companyEndTime ? data.companyEndTime.substring(0, 5) : '18:00',
          });
        }
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch company rules' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...rule,
        companyStartTime: rule.companyStartTime.length === 5 ? `${rule.companyStartTime}:00` : rule.companyStartTime,
        companyEndTime: rule.companyEndTime.length === 5 ? `${rule.companyEndTime}:00` : rule.companyEndTime,
      };
      await updateCompanyRuleApi(payload);
      setAlert({ type: 'success', message: 'Company rules and attendance policies updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update rules' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading company policies...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Company Policies &amp; Attendance Rules</h2>
        <p className="text-xs text-slate-500">Configure standard working hours, late grace periods, and leave allowances</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Office Start Time</label>
            <input
              type="time"
              value={rule.companyStartTime}
              onChange={(e) => setRule({ ...rule, companyStartTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Office End Time</label>
            <input
              type="time"
              value={rule.companyEndTime}
              onChange={(e) => setRule({ ...rule, companyEndTime: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Required Working Hours (per day)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={rule.requiredWorkingHours}
              onChange={(e) => setRule({ ...rule, requiredWorkingHours: parseInt(e.target.value) || 8 })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Late Grace Period (Minutes)</label>
            <input
              type="number"
              min="0"
              max="120"
              value={rule.lateThresholdMinutes}
              onChange={(e) => setRule({ ...rule, lateThresholdMinutes: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
            <span className="text-[11px] text-slate-400">e.g. 15 mins allows check-in up to 09:15 AM without being marked late</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Half-Day Threshold (Minutes)</label>
            <input
              type="number"
              min="60"
              value={rule.halfDayThresholdMinutes}
              onChange={(e) => setRule({ ...rule, halfDayThresholdMinutes: parseInt(e.target.value) || 240 })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
            <span className="text-[11px] text-slate-400">240 mins = 4 hours</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Overtime Threshold (Minutes after shift)</label>
            <input
              type="number"
              min="0"
              value={rule.overtimeThresholdMinutes}
              onChange={(e) => setRule({ ...rule, overtimeThresholdMinutes: parseInt(e.target.value) || 60 })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
            <span className="text-[11px] text-slate-400">60 mins = 1 hour past shift end</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Working Days/Month</label>
            <input
              type="number"
              min="20"
              max="31"
              value={rule.workingDaysPerMonth}
              onChange={(e) => setRule({ ...rule, workingDaysPerMonth: parseInt(e.target.value) || 26 })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Paid Leave Days/Year</label>
            <input
              type="number"
              min="0"
              value={rule.paidLeaveDays}
              onChange={(e) => setRule({ ...rule, paidLeaveDays: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Allowed Unpaid Leaves</label>
            <input
              type="number"
              min="0"
              value={rule.unpaidLeaveDays}
              onChange={(e) => setRule({ ...rule, unpaidLeaveDays: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 border rounded-xl"
              required
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            {saving ? 'Saving...' : 'Save Rule Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

// -------------------------------------------------------------
// PROFILE VIEW
// -------------------------------------------------------------
const ProfileView = ({ currentUser }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
    <h2 className="text-xl font-bold text-slate-800 mb-4">User Profile</h2>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between py-2 border-b">
        <span className="text-slate-500">Username / ID:</span>
        <span className="font-semibold text-slate-800">{currentUser?.username}</span>
      </div>
      <div className="flex justify-between py-2 border-b">
        <span className="text-slate-500">System Role:</span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{currentUser?.role}</span>
      </div>
      {currentUser?.name && (
        <div className="flex justify-between py-2 border-b">
          <span className="text-slate-500">Employee Name:</span>
          <span className="font-semibold text-slate-800">{currentUser?.name}</span>
        </div>
      )}
      {currentUser?.department && (
        <div className="flex justify-between py-2 border-b">
          <span className="text-slate-500">Department:</span>
          <span className="text-slate-800">{currentUser?.department}</span>
        </div>
      )}
    </div>
  </div>
);

// -------------------------------------------------------------
// ADMIN COMPLAINTS VIEW
// -------------------------------------------------------------
const AdminComplaintsView = ({ setAlert }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: 'IN_PROGRESS', resolutionNotes: '' });

  const fetchComplaints = () => {
    setLoading(true);
    getComplaintsApi()
      .then((res) => setComplaints(res))
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch complaints' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleOpenModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({
      status: complaint.status || 'IN_PROGRESS',
      resolutionNotes: complaint.resolutionNotes || '',
    });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await updateComplaintStatusApi(selectedComplaint.id, updateForm);
      setAlert({ type: 'success', message: `Complaint #${selectedComplaint.id} updated to ${updateForm.status}` });
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to update complaint' });
    }
  };

  const filtered = complaints.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const totalSubmitted = complaints.filter((c) => c.status === 'SUBMITTED').length;
  const totalInProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const totalResolved = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Complaints</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">{complaints.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Submitted</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{totalSubmitted}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">In Progress</div>
          <div className="text-2xl font-bold mt-1 text-indigo-600">{totalInProgress}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Resolved</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{totalResolved}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Employee Grievances &amp; Complaints</h2>
            <p className="text-xs text-slate-500">Track, review, and resolve organizational grievances</p>
          </div>
          <div className="flex items-center gap-2">
            {['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={fetchComplaints}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition ml-2"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3">ID</th>
                <th className="pb-3">Employee</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Subject &amp; Description</th>
                <th className="pb-3">Submitted On</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Resolution Notes</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 font-mono text-xs text-slate-500">#{c.id}</td>
                  <td>
                    <div className="font-semibold text-slate-800">{c.employee?.name || 'Employee'}</div>
                    <div className="text-xs text-slate-400 font-mono">{c.employee?.employeeCode}</div>
                  </td>
                  <td>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                      {c.category}
                    </span>
                  </td>
                  <td className="max-w-xs">
                    <div className="font-semibold text-slate-800 text-xs">{c.subject}</div>
                    <div className="text-slate-500 text-xs line-clamp-2" title={c.description}>{c.description}</div>
                  </td>
                  <td className="text-slate-600 text-xs font-mono">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="text-xs text-slate-600 max-w-xs truncate" title={c.resolutionNotes || 'None'}>
                    {c.resolutionNotes || <span className="text-slate-300 italic">No notes yet</span>}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">
                    No complaints matching "{filterStatus}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Complaint Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4 border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Update Complaint #{selectedComplaint.id}</h3>
                <p className="text-xs text-slate-500">Employee: {selectedComplaint.employee?.name} ({selectedComplaint.employee?.employeeCode})</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl border text-xs text-slate-600 space-y-1">
              <div><strong className="text-slate-700">Subject:</strong> {selectedComplaint.subject}</div>
              <div><strong className="text-slate-700">Category:</strong> {selectedComplaint.category}</div>
              <div><strong className="text-slate-700">Description:</strong> {selectedComplaint.description}</div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Resolution / Response Notes</label>
                <textarea
                  rows="4"
                  value={updateForm.resolutionNotes}
                  onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
                  placeholder="Enter details of action taken, investigation outcome, or resolution notes for the employee..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// EMPLOYEE DASHBOARD VIEW
// -------------------------------------------------------------
const EmployeeDashboardView = ({ currentUser, setCurrentPage, setAlert }) => {
  const [summary, setSummary] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyWorkingHoursSummaryApi().catch(() => null),
      getMyAttendanceApi().catch(() => []),
    ])
      .then(([sumRes, attRes]) => {
        setSummary(sumRes);
        setRecentAttendance(Array.isArray(attRes) ? attRes.slice(0, 5) : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const todayStatus = summary?.todayStatus || 'NOT_CHECKED_IN';
  const hasMissing = summary?.hasMissingCheckout;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur">
            Employee Workspace
          </span>
          <h2 className="text-2xl font-bold mt-2">
            Welcome, {currentUser?.name || currentUser?.username}!
          </h2>
          <p className="text-sm text-indigo-200 mt-1">
            Department: {currentUser?.department || 'General'} &bull; ID: {currentUser?.username}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage('Face Attendance')}
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            📷 Face Attendance
          </button>
          <button
            onClick={() => setCurrentPage('Apply for Leave')}
            className="px-4 py-2.5 bg-indigo-600/60 hover:bg-indigo-600 border border-white/20 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            Apply Leave
          </button>
        </div>
      </div>

      {/* Warning Alert if missing checkout */}
      {hasMissing && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>
              <strong>Attention:</strong> You have an incomplete or missing check-out from a previous working day. Please notify HR or check your attendance history.
            </span>
          </div>
          <button
            onClick={() => setCurrentPage('My Attendance')}
            className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-lg text-xs font-semibold"
          >
            View Log
          </button>
        </div>
      )}

      {/* Working Hours Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Today's Hours</div>
          <div className="text-3xl font-extrabold text-slate-800 mt-1">
            {summary?.todayHours != null ? `${Number(summary.todayHours).toFixed(2)} hrs` : '0.00 hrs'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Standard: 8.0 hrs/day</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">This Week's Hours</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-1">
            {summary?.weeklyHours != null ? `${Number(summary.weeklyHours).toFixed(2)} hrs` : '0.00 hrs'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Mon - Sun accumulation</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">This Month's Hours</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">
            {summary?.monthlyHours != null ? `${Number(summary.monthlyHours).toFixed(2)} hrs` : '0.00 hrs'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total recorded working time</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Today's Status</div>
          <div className="mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              todayStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
              todayStatus === 'LATE' ? 'bg-amber-100 text-amber-700' :
              todayStatus === 'CHECKED_IN' ? 'bg-indigo-100 text-indigo-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {todayStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Present days this month: <strong>{summary?.presentDaysThisMonth ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentPage('Face Attendance')}
          className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 text-left hover:border-indigo-400 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
            📷
          </div>
          <div className="font-bold text-slate-800">Biometric Attendance</div>
          <div className="text-xs text-slate-500 mt-1">Scan your face to check in or out for work</div>
        </button>

        <button
          onClick={() => setCurrentPage('Apply for Leave')}
          className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 text-left hover:border-indigo-400 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
            📝
          </div>
          <div className="font-bold text-slate-800">Apply for Leave</div>
          <div className="text-xs text-slate-500 mt-1">Submit casual, medical, or annual time off requests</div>
        </button>

        <button
          onClick={() => setCurrentPage('Complaints')}
          className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 text-left hover:border-indigo-400 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg mb-3 group-hover:bg-rose-600 group-hover:text-white transition">
            💬
          </div>
          <div className="font-bold text-slate-800">Complaints &amp; Grievances</div>
          <div className="text-xs text-slate-500 mt-1">Raise an inquiry or complaint with management</div>
        </button>
      </div>

      {/* Recent Attendance History */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Recent Attendance Records</h3>
            <p className="text-xs text-slate-500">Your last 5 recorded work shifts</p>
          </div>
          <button
            onClick={() => setCurrentPage('My Attendance')}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold"
          >
            View All History &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3">Date</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Working Hours</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Biometric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAttendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-medium text-slate-700">{rec.attendanceDate}</td>
                  <td className="text-slate-600 font-mono text-xs">
                    {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="text-slate-600 font-mono text-xs">
                    {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="font-semibold text-slate-800">{rec.workingHours ?? '0.00'} hrs</td>
                  <td>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                      rec.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                      rec.status === 'HALF_DAY' ? 'bg-purple-100 text-purple-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td>
                    {rec.biometricVerified ? (
                      <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Manual</span>
                    )}
                  </td>
                </tr>
              ))}
              {recentAttendance.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 text-sm">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// FACE ATTENDANCE VIEW (EMPLOYEE BIOMETRIC SCANNER)
// -------------------------------------------------------------
const FaceAttendanceView = ({ currentUser, setAlert }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingUploadAction = useRef('CHECK_IN');

  const fetchTodayData = () => {
    getMyWorkingHoursSummaryApi()
      .then((res) => setTodaySummary(res))
      .catch(() => {});
  };

  useEffect(() => {
    fetchTodayData();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    setScanStatus(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAlert({ type: 'error', message: 'Webcam not supported in this browser. You can upload a photo snapshot below.' });
      return;
    }
    setCameraLoading(true);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setIsCameraActive(false);
      setAlert({ type: 'error', message: `Camera access failed: ${err.message || 'Permission denied'}` });
    } finally {
      setCameraLoading(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive]);

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const processFrameAndMark = async (frameData, action = 'CHECK_IN') => {
    const actionLabel = action === 'CHECK_IN' ? 'Check-In' : 'Check-Out';
    setScanStatus({ type: 'info', message: `Analyzing face with AI Biometric Service for ${actionLabel}...` });

    try {
      // 1. Run AI facial recognition
      const aiResult = await aiRecognizeApi(frameData);

      if (!aiResult.match || !aiResult.employeeId) {
        setScanStatus({
          type: 'error',
          message: aiResult.message || 'Face not recognized! Please ensure your face is well-lit and you have enrolled your photo with Admin.',
        });
        return;
      }

      setScanStatus({
        type: 'info',
        message: `Recognized: ${aiResult.employeeName} (${aiResult.confidence}% confidence). Recording ${actionLabel}...`,
      });

      // 2. Submit to backend with biometric identity verification and chosen action
      const attendanceRecord = await recordAttendanceApi({
        employeeCode: aiResult.employeeId,
        action: action,
      });

      const actionText = action === 'CHECK_IN' ? 'Check-In recorded' : 'Check-Out recorded';
      const hoursText = attendanceRecord.workingHours ? ` (Shift Hours: ${attendanceRecord.workingHours} hrs)` : '';

      setScanStatus({
        type: 'success',
        message: `✅ Success! ${actionText} for ${aiResult.employeeName}! Status: ${attendanceRecord.status}${hoursText}`,
      });
      setAlert({
        type: 'success',
        message: `${actionText} successful (${attendanceRecord.status})`,
      });
      fetchTodayData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'AI Attendance recording failed';
      setScanStatus({
        type: 'error',
        message: errMsg,
      });
      setAlert({
        type: 'error',
        message: errMsg,
      });
    }
  };

  const handleScanWebcam = (action = 'CHECK_IN') => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL('image/jpeg', 0.9);
    processFrameAndMark(frameData, action);
  };

  const triggerUpload = (action) => {
    pendingUploadAction.current = action;
    fileInputRef.current?.click();
  };

  const handleUploadPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      processFrameAndMark(evt.target.result, pendingUploadAction.current);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const todayRecord = todaySummary?.todayRecord;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Live AI Scanner Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Biometric Face Attendance</h2>
            <p className="text-xs text-slate-500">
              Align your face and click Check In or Check Out to record your shift accurately
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadPhoto}
            />
            <button
              type="button"
              onClick={() => triggerUpload('CHECK_IN')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition border border-emerald-300 cursor-pointer"
            >
              📁 Photo Check In
            </button>
            <button
              type="button"
              onClick={() => triggerUpload('CHECK_OUT')}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition border border-amber-300 cursor-pointer"
            >
              📁 Photo Check Out
            </button>
            {!isCameraActive ? (
              <button
                onClick={handleStartCamera}
                disabled={cameraLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                📷 {cameraLoading ? 'Starting...' : 'Start Camera'}
              </button>
            ) : (
              <button
                onClick={handleStopCamera}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Turn Off Camera
              </button>
            )}
          </div>
        </div>

        {isCameraActive ? (
          <div>
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video max-h-96 mx-auto flex items-center justify-center border border-slate-800 shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-dashed border-emerald-400/50 rounded-3xl pointer-events-none m-10 flex items-center justify-center">
                <span className="text-xs text-emerald-300 bg-slate-900/80 px-4 py-1.5 rounded-full backdrop-blur border border-emerald-500/30">
                  Fit face inside boundary
                </span>
              </div>
            </div>

            {/* Explicit Check In and Check Out Action Buttons below camera */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleScanWebcam('CHECK_IN')}
                className="py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-3 text-base active:scale-95 cursor-pointer"
              >
                <span className="text-2xl">🟢</span>
                <div className="text-left">
                  <div className="font-bold leading-tight">Check In with Face</div>
                  <div className="text-xs text-emerald-100 font-normal">Start your working shift</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleScanWebcam('CHECK_OUT')}
                className="py-3.5 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/25 transition flex items-center justify-center gap-3 text-base active:scale-95 cursor-pointer"
              >
                <span className="text-2xl">🟠</span>
                <div className="text-left">
                  <div className="font-bold leading-tight">Check Out with Face</div>
                  <div className="text-xs text-amber-100 font-normal">End shift &amp; calculate hours</div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-600">Camera preview is off</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "Start Camera" above to turn on your webcam, then use the Check In or Check Out buttons below.
              </p>
            </div>

            {/* Inactive state preview buttons that prompt starting camera */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleStartCamera}
                disabled={cameraLoading}
                className="py-3.5 px-6 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 hover:text-emerald-800 font-bold rounded-xl transition flex items-center justify-center gap-3 text-base cursor-pointer"
              >
                <span className="text-2xl">🟢</span>
                <div className="text-left">
                  <div className="font-bold leading-tight">Check In</div>
                  <div className="text-xs text-slate-400 font-normal">Click to start camera &amp; check in</div>
                </div>
              </button>
              <button
                type="button"
                onClick={handleStartCamera}
                disabled={cameraLoading}
                className="py-3.5 px-6 bg-slate-100 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-slate-700 hover:text-amber-800 font-bold rounded-xl transition flex items-center justify-center gap-3 text-base cursor-pointer"
              >
                <span className="text-2xl">🟠</span>
                <div className="text-left">
                  <div className="font-bold leading-tight">Check Out</div>
                  <div className="text-xs text-slate-400 font-normal">Click to start camera &amp; check out</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {scanStatus && (
          <div className={`mt-4 p-4 rounded-xl text-sm border font-medium ${
            scanStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            scanStatus.type === 'info' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
            'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {scanStatus.message}
          </div>
        )}
      </div>

      {/* Today's Shift Status Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Shift Log</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="text-xs text-slate-500 uppercase font-semibold">Check In</div>
            <div className="text-base font-bold text-slate-800 font-mono mt-1">
              {todayRecord?.checkIn
                ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Not checked in'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="text-xs text-slate-500 uppercase font-semibold">Check Out</div>
            <div className="text-base font-bold text-slate-800 font-mono mt-1">
              {todayRecord?.checkOut
                ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Pending'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="text-xs text-slate-500 uppercase font-semibold">Working Hours</div>
            <div className="text-base font-bold text-indigo-600 mt-1">
              {todaySummary?.todayHours != null ? `${Number(todaySummary.todayHours).toFixed(2)} hrs` : '0.00 hrs'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border">
            <div className="text-xs text-slate-500 uppercase font-semibold">Biometric Status</div>
            <div className="mt-1">
              {todayRecord?.biometricVerified ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  Verified Face
                </span>
              ) : (
                <span className="text-xs text-slate-400">Awaiting scan</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MY ATTENDANCE / WORKING HOURS VIEW
// -------------------------------------------------------------
const MyAttendanceView = ({ currentUser, setAlert }) => {
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      getMyAttendanceApi().catch(() => []),
      getMyWorkingHoursSummaryApi().catch(() => null),
    ])
      .then(([attList, sumRes]) => {
        setAttendances(Array.isArray(attList) ? attList : []);
        setSummary(sumRes);
      })
      .catch(() => setAlert({ type: 'error', message: 'Failed to load attendance records' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportMyCsv = () => {
    if (!attendances.length) {
      alert('No attendance records to export.');
      return;
    }
    const headers = ['Date', 'Check In', 'Check Out', 'Working Hours', 'Overtime', 'Status', 'Biometric Verified'];
    const rows = attendances.map((a) => [
      a.attendanceDate,
      a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '',
      a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '',
      a.workingHours || 0,
      a.overtimeHours || 0,
      a.status,
      a.biometricVerified ? 'YES' : 'NO',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `my_attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Missing checkout banner */}
      {summary?.hasMissingCheckout && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
          <span className="text-xl">⚠️</span>
          <div>
            <strong>Missing Check-Out Detected:</strong> One or more shifts had no recorded departure. Please reach out to your HR administrator to regularize your timesheet.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Today's Hours</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">
            {summary?.todayHours != null ? `${Number(summary.todayHours).toFixed(2)} hrs` : '0.00'}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">This Week</div>
          <div className="text-2xl font-bold mt-1 text-indigo-600">
            {summary?.weeklyHours != null ? `${Number(summary.weeklyHours).toFixed(2)} hrs` : '0.00'}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">This Month</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {summary?.monthlyHours != null ? `${Number(summary.monthlyHours).toFixed(2)} hrs` : '0.00'}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Present Days</div>
          <div className="text-2xl font-bold mt-1 text-slate-800">
            {summary?.presentDaysThisMonth ?? 0}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500 uppercase font-semibold">Late Arrivals</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">
            {summary?.lateDaysThisMonth ?? 0}
          </div>
        </div>
      </div>

      {/* Detailed Log Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">My Attendance History</h2>
            <p className="text-xs text-slate-500">Official server-side recorded shift timestamps and computed working hours</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMyCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              📥 Export CSV
            </button>
            <button
              onClick={fetchData}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3">Date</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Working Hours</th>
                <th className="pb-3">Overtime</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Biometric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendances.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 font-medium text-slate-800">{rec.attendanceDate}</td>
                  <td className="text-slate-600 font-mono text-xs">
                    {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="text-slate-600 font-mono text-xs">
                    {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                      <span className="text-amber-500 italic">Missing / Active</span>
                    )}
                  </td>
                  <td className="font-bold text-slate-900">{rec.workingHours ?? '0.00'} hrs</td>
                  <td className="text-slate-600">{rec.overtimeHours ?? '0.00'} hrs</td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                      rec.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                      rec.status === 'HALF_DAY' ? 'bg-purple-100 text-purple-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td>
                    {rec.biometricVerified ? (
                      <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                        ✓ AI Face
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
              {attendances.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// APPLY FOR LEAVE VIEW (EMPLOYEE PORTAL ONLY)
// -------------------------------------------------------------
const ApplyLeaveView = ({ currentUser, setCurrentPage, setAlert }) => {
  const [form, setForm] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setAlert({ type: 'error', message: 'End date cannot be earlier than start date.' });
      return;
    }
    setSubmitting(true);
    try {
      await createLeaveApi(form);
      setAlert({ type: 'success', message: 'Leave request submitted successfully!' });
      setCurrentPage('My Leaves');
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to submit leave request.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Apply for Leave</h2>
        <p className="text-xs text-slate-500 mt-1">Submit your time off request for manager approval</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Leave Type</label>
          <select
            value={form.leaveType}
            onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="CASUAL">Casual Leave</option>
            <option value="SICK">Medical / Sick Leave</option>
            <option value="ANNUAL">Annual Paid Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Start Date</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">End Date</label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">Reason for Absence</label>
          <textarea
            required
            rows="4"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Please detail your reason for taking leave..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => setCurrentPage('My Leaves')}
            className="px-5 py-2.5 border rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

// -------------------------------------------------------------
// MY LEAVES VIEW (EMPLOYEE PORTAL)
// -------------------------------------------------------------
const MyLeavesView = ({ currentUser, setAlert }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyLeaves = () => {
    setLoading(true);
    getMyLeavesApi()
      .then((res) => setLeaves(res))
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch your leave records' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Leave Applications</h2>
          <p className="text-xs text-slate-500">Track status of your submitted leave requests</p>
        </div>
        <button
          onClick={fetchMyLeaves}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
              <th className="pb-3">Type</th>
              <th className="pb-3">Duration</th>
              <th className="pb-3">Reason</th>
              <th className="pb-3">Applied Date</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Decision Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leaves.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 font-medium text-slate-800">{l.leaveType}</td>
                <td className="text-slate-600 text-xs font-medium">
                  {l.startDate} &rarr; {l.endDate}
                </td>
                <td className="text-slate-600 max-w-xs text-xs truncate" title={l.reason}>
                  {l.reason}
                </td>
                <td className="text-slate-500 text-xs">
                  {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-'}
                </td>
                <td>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    l.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {l.status}
                  </span>
                </td>
                <td className="text-xs text-slate-500">
                  {l.status === 'APPROVED' ? (
                    <span className="text-emerald-600">Approved by manager</span>
                  ) : l.status === 'REJECTED' ? (
                    <span className="text-rose-600">{l.rejectionReason || 'Request rejected'}</span>
                  ) : (
                    <span className="text-slate-400 italic">Under review</span>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                  You have not submitted any leave requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// EMPLOYEE COMPLAINTS VIEW
// -------------------------------------------------------------
const EmployeeComplaintsView = ({ currentUser, setAlert }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    category: 'WORKPLACE',
    subject: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMyComplaints = () => {
    setLoading(true);
    getMyComplaintsApi()
      .then((res) => setComplaints(res))
      .catch(() => setAlert({ type: 'error', message: 'Failed to fetch complaints' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitComplaintApi(form);
      setAlert({ type: 'success', message: 'Complaint submitted successfully. HR will review it shortly.' });
      setForm({ category: 'WORKPLACE', subject: '', description: '' });
      fetchMyComplaints();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to submit complaint' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit Grievance Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">Submit a Grievance or Complaint</h2>
          <p className="text-xs text-slate-500">Your concerns will be reviewed confidentially by HR management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border text-sm bg-slate-50/50"
              >
                <option value="WORKPLACE">Workplace Environment</option>
                <option value="SALARY">Salary / Payroll Discrepancy</option>
                <option value="ATTENDANCE">Attendance / Biometric Issue</option>
                <option value="HARASSMENT">Harassment / Discrimination</option>
                <option value="EQUIPMENT">IT / Equipment Issue</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Subject</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief summary of concern"
                className="w-full px-3 py-2.5 rounded-xl border text-sm bg-slate-50/50"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Detailed Description</label>
            <textarea
              required
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide complete context, dates, and details..."
              className="w-full px-3 py-2.5 rounded-xl border text-sm bg-slate-50/50"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </div>
        </form>
      </div>

      {/* My Complaints History */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">My Grievance History</h3>
            <p className="text-xs text-slate-500">Track status and responses from administration</p>
          </div>
          <button
            onClick={fetchMyComplaints}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3">ID</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Subject &amp; Description</th>
                <th className="pb-3">Submitted</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Resolution / Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 font-mono text-xs text-slate-400">#{c.id}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                      {c.category}
                    </span>
                  </td>
                  <td className="max-w-xs">
                    <div className="font-semibold text-slate-800 text-xs">{c.subject}</div>
                    <div className="text-slate-500 text-xs line-clamp-2" title={c.description}>{c.description}</div>
                  </td>
                  <td className="text-slate-500 text-xs font-mono">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="text-xs text-slate-700 max-w-xs">
                    {c.resolutionNotes ? (
                      <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 block">
                        {c.resolutionNotes}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Pending review</span>
                    )}
                  </td>
                </tr>
              ))}
              {complaints.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400 text-sm">
                    No grievances filed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

