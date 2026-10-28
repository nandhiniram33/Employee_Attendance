package com.employee.attendance.service;

import com.employee.attendance.entity.Attendance;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.LeaveRequest;
import com.employee.attendance.repository.AttendanceRepository;
import com.employee.attendance.repository.EmployeeRepository;
import com.employee.attendance.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public DashboardService(EmployeeRepository employeeRepository,
                            AttendanceRepository attendanceRepository,
                            LeaveRequestRepository leaveRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    public Map<String, Object> getDashboardSummary() {
        List<Employee> employees = employeeRepository.findAll();
        LocalDate today = LocalDate.now();
        List<Attendance> todayRecords = attendanceRepository.findByAttendanceDate(today);

        long presentToday = todayRecords.stream()
                .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()) || "LATE".equalsIgnoreCase(a.getStatus()))
                .count();

        List<LeaveRequest> allLeaves = leaveRequestRepository.findAll();
        long employeesOnLeave = allLeaves.stream()
                .filter(l -> "APPROVED".equalsIgnoreCase(l.getStatus()))
                .filter(l -> !today.isBefore(l.getStartDate()) && !today.isAfter(l.getEndDate()))
                .count();

        long pendingLeaves = allLeaves.stream()
                .filter(l -> "PENDING".equalsIgnoreCase(l.getStatus()))
                .count();

        long lateToday = todayRecords.stream().filter(Attendance::isLate).count();
        long absentToday = Math.max(0, employees.size() - presentToday - employeesOnLeave);

        double totalHours = todayRecords.stream()
                .mapToDouble(a -> a.getWorkingHours() != null ? a.getWorkingHours().doubleValue() : 0.0)
                .sum();

        double totalOvertime = todayRecords.stream()
                .mapToDouble(a -> a.getOvertimeHours() != null ? a.getOvertimeHours().doubleValue() : 0.0)
                .sum();

        double estimatedPayroll = employees.stream()
                .mapToDouble(e -> e.getMonthlySalary() != null ? e.getMonthlySalary().doubleValue() : 0.0)
                .sum();

        // 7-day attendance trend
        List<Map<String, Object>> trends = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            List<Attendance> dayRecords = attendanceRepository.findByAttendanceDate(d);
            long dayPresent = dayRecords.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()) || "LATE".equalsIgnoreCase(a.getStatus())).count();
            long dayLate = dayRecords.stream().filter(Attendance::isLate).count();
            long dayAbsent = Math.max(0, employees.size() - dayPresent);

            Map<String, Object> dayTrend = new HashMap<>();
            dayTrend.put("date", d.toString());
            dayTrend.put("day", d.getDayOfWeek().toString().substring(0, 3));
            dayTrend.put("present", dayPresent);
            dayTrend.put("late", dayLate);
            dayTrend.put("absent", dayAbsent);
            trends.add(dayTrend);
        }

        // Department breakdown
        Map<String, Long> departments = employees.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getDepartment() != null ? e.getDepartment() : "General",
                        Collectors.counting()
                ));

        Map<String, Object> response = new HashMap<>();
        response.put("totalEmployees", employees.size());
        response.put("presentToday", presentToday);
        response.put("absentToday", absentToday);
        response.put("employeesOnLeave", employeesOnLeave);
        response.put("lateEmployees", lateToday);
        response.put("pendingLeaves", pendingLeaves);
        response.put("totalWorkingHours", Math.round(totalHours * 100.0) / 100.0);
        response.put("overtimeHours", Math.round(totalOvertime * 100.0) / 100.0);
        response.put("estimatedPayroll", estimatedPayroll);
        response.put("attendanceTrends", trends);
        response.put("departments", departments);

        return response;
    }
}

