package com.employee.attendance.service;

import com.employee.attendance.dto.AttendanceRequest;
import com.employee.attendance.entity.Attendance;
import com.employee.attendance.entity.CompanyRule;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.repository.AttendanceRepository;
import com.employee.attendance.repository.CompanyRuleRepository;
import com.employee.attendance.repository.EmployeeRepository;
import com.employee.attendance.repository.LeaveRequestRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CompanyRuleRepository companyRuleRepository;
    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AuditLogService auditLogService;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             CompanyRuleRepository companyRuleRepository,
                             EmployeeService employeeService,
                             EmployeeRepository employeeRepository,
                             LeaveRequestRepository leaveRequestRepository,
                             AuditLogService auditLogService) {
        this.attendanceRepository = attendanceRepository;
        this.companyRuleRepository = companyRuleRepository;
        this.employeeService = employeeService;
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Attendance recordAttendance(AttendanceRequest request) {
        return recordAttendance(request, null);
    }

    @Transactional
    public Attendance recordAttendance(AttendanceRequest request, org.springframework.security.core.Authentication authentication) {
        Employee employee;
        if (request.getEmployeeId() != null) {
            employee = employeeService.findById(request.getEmployeeId());
        } else if (request.getEmployeeCode() != null && !request.getEmployeeCode().trim().isEmpty()) {
            employee = employeeService.findByEmployeeCode(request.getEmployeeCode().trim());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee ID or Employee Code is required");
        }

        if (!"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee is inactive");
        }

        // Biometric Security Check: If an authenticated employee is making the request,
        // verify that the recognized biometric identity matches their logged-in account
        if (authentication != null && authentication.isAuthenticated() &&
                !(authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                String authUsername = authentication.getName();
                Employee authEmp = employeeRepository.findByEmail(authUsername)
                        .or(() -> employeeRepository.findByEmployeeCode(authUsername))
                        .orElse(null);
                if (authEmp != null && !authEmp.getId().equals(employee.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Biometric Mismatch: The recognized face (" + employee.getName() + " - " + employee.getEmployeeCode() +
                            ") does not match your logged-in employee account (" + authEmp.getName() + ").");
                }
            }
        }

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        Optional<Attendance> existing = attendanceRepository.findByEmployeeAndAttendanceDate(employee, today);

        Attendance attendance = existing.orElseGet(Attendance::new);
        attendance.setEmployee(employee);
        attendance.setAttendanceDate(today);

        CompanyRule rule = getCompanyRule();
        String action = request.getAction() != null ? request.getAction().trim().toUpperCase() : null;

        // Validate explicit actions requested by user
        if ("CHECK_IN".equals(action)) {
            if (attendance.getCheckIn() != null) {
                if (attendance.getCheckOut() != null) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "You have already completed attendance for today (Checked in at " +
                            attendance.getCheckIn().toLocalTime().toString().substring(0, 5) +
                            " and checked out at " +
                            attendance.getCheckOut().toLocalTime().toString().substring(0, 5) + ").");
                }
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "You have already checked in today at " +
                        attendance.getCheckIn().toLocalTime().toString().substring(0, 5) +
                        "! Please use the Check Out button when leaving.");
            }
        } else if ("CHECK_OUT".equals(action)) {
            if (attendance.getCheckIn() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "You have not checked in yet today! Please check in first before checking out.");
            }
            if (attendance.getCheckOut() != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "You have already checked out today at " +
                        attendance.getCheckOut().toLocalTime().toString().substring(0, 5) + "!");
            }
        }

        // Case 1: First scan of the day -> CHECK-IN
        if (attendance.getCheckIn() == null) {
            LocalDateTime checkInTime = request.getCheckIn() != null ? request.getCheckIn() : now;
            attendance.setCheckIn(checkInTime);
            attendance.setStatus("PRESENT");
            attendance.setBiometricVerified(true);

            if (rule != null && rule.getCompanyStartTime() != null) {
                LocalTime threshold = rule.getCompanyStartTime().plusMinutes(rule.getLateThresholdMinutes());
                if (checkInTime.toLocalTime().isAfter(threshold)) {
                    attendance.setLate(true);
                    attendance.setStatus("LATE");
                }
            }
            auditLogService.log("AI_RECOGNITION", "CHECK_IN", "ATTENDANCE", employee.getId(),
                    "Checked in employee " + employee.getName() + " at " + checkInTime);
            return attendanceRepository.save(attendance);
        }

        // Case 2: Already checked in and checked out -> Prevent duplicate clocking
        if (attendance.getCheckOut() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Attendance for today is already completed! Checked in at " +
                    attendance.getCheckIn().toLocalTime().toString().substring(0, 5) +
                    " and checked out at " +
                    attendance.getCheckOut().toLocalTime().toString().substring(0, 5) +
                    " (" + attendance.getWorkingHours() + " hrs worked).");
        }

        // Case 3: Checked in -> Record CHECK-OUT
        LocalDateTime checkOutTime = request.getCheckOut() != null ? request.getCheckOut() : now;
        if (!"CHECK_OUT".equals(action) && request.getCheckOut() == null && Duration.between(attendance.getCheckIn(), checkOutTime).toSeconds() < 60) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Check-in was recorded just moments ago. Please wait at least 1 minute before checking out.");
        }

        attendance.setCheckOut(checkOutTime);
        attendance.setBiometricVerified(true);
        Duration duration = Duration.between(attendance.getCheckIn(), checkOutTime);
        BigDecimal hours = BigDecimal.valueOf(duration.toMinutes()).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        attendance.setWorkingHours(hours);

        if (rule != null) {
            if (duration.toMinutes() < rule.getHalfDayThresholdMinutes()) {
                attendance.setStatus("HALF_DAY");
            } else if (!attendance.isLate()) {
                attendance.setStatus("PRESENT");
            }

            BigDecimal required = BigDecimal.valueOf(rule.getRequiredWorkingHours());
            if (hours.compareTo(required) > 0) {
                attendance.setOvertimeHours(hours.subtract(required));
            } else {
                attendance.setOvertimeHours(BigDecimal.ZERO);
            }
        }
        auditLogService.log("AI_RECOGNITION", "CHECK_OUT", "ATTENDANCE", employee.getId(),
                "Checked out employee " + employee.getName() + " at " + checkOutTime + " (Hours: " + hours + ")");
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAllByOrderByAttendanceDateDesc();
    }

    public List<Attendance> getMyAttendance(String username) {
        Employee employee = employeeRepository.findByEmail(username)
                .or(() -> employeeRepository.findByEmployeeCode(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee record linked to user " + username));
        return attendanceRepository.findByEmployeeOrderByAttendanceDateDesc(employee);
    }

    public java.util.Map<String, Object> getMyWorkingHoursSummary(String username) {
        Employee employee = employeeRepository.findByEmail(username)
                .or(() -> employeeRepository.findByEmployeeCode(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee record linked to user " + username));

        LocalDate today = LocalDate.now();
        List<Attendance> records = attendanceRepository.findByEmployeeOrderByAttendanceDateDesc(employee);

        Optional<Attendance> todayOpt = records.stream()
                .filter(a -> today.equals(a.getAttendanceDate()))
                .findFirst();

        BigDecimal todayHours = BigDecimal.ZERO;
        String todayStatus = "NOT_CHECKED_IN";
        LocalDateTime todayCheckIn = null;
        LocalDateTime todayCheckOut = null;

        if (todayOpt.isPresent()) {
            Attendance todayAtt = todayOpt.get();
            todayCheckIn = todayAtt.getCheckIn();
            todayCheckOut = todayAtt.getCheckOut();
            todayHours = todayAtt.getWorkingHours() != null ? todayAtt.getWorkingHours() : BigDecimal.ZERO;
            todayStatus = todayAtt.getStatus() != null ? todayAtt.getStatus() : "PRESENT";
            if (todayCheckIn != null && todayCheckOut == null) {
                todayStatus = todayAtt.isLate() ? "CHECKED_IN (LATE)" : "CHECKED_IN";
                Duration elapsed = Duration.between(todayCheckIn, LocalDateTime.now());
                todayHours = BigDecimal.valueOf(elapsed.toMinutes()).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            }
        }

        LocalDate startOfWeek = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        BigDecimal weekHours = records.stream()
                .filter(a -> !a.getAttendanceDate().isBefore(startOfWeek) && !a.getAttendanceDate().isAfter(today))
                .map(a -> a.getWorkingHours() != null ? a.getWorkingHours() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate startOfMonth = today.withDayOfMonth(1);
        BigDecimal monthHours = records.stream()
                .filter(a -> !a.getAttendanceDate().isBefore(startOfMonth) && !a.getAttendanceDate().isAfter(today))
                .map(a -> a.getWorkingHours() != null ? a.getWorkingHours() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long monthPresentDays = records.stream()
                .filter(a -> !a.getAttendanceDate().isBefore(startOfMonth) && !a.getAttendanceDate().isAfter(today))
                .filter(a -> a.getCheckIn() != null)
                .count();

        long monthLateDays = records.stream()
                .filter(a -> !a.getAttendanceDate().isBefore(startOfMonth) && !a.getAttendanceDate().isAfter(today))
                .filter(Attendance::isLate)
                .count();

        long missingCheckouts = records.stream()
                .filter(a -> a.getAttendanceDate().isBefore(today))
                .filter(a -> a.getCheckIn() != null && a.getCheckOut() == null)
                .count();

        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("employeeId", employee.getId());
        summary.put("employeeName", employee.getName());
        summary.put("employeeCode", employee.getEmployeeCode());
        summary.put("todayCheckIn", todayCheckIn != null ? todayCheckIn.toString() : null);
        summary.put("todayCheckOut", todayCheckOut != null ? todayCheckOut.toString() : null);
        summary.put("todayWorkingHours", todayHours);
        summary.put("todayStatus", todayStatus);
        summary.put("weekWorkingHours", weekHours);
        summary.put("monthWorkingHours", monthHours);
        summary.put("monthPresentDays", monthPresentDays);
        summary.put("monthLateDays", monthLateDays);
        summary.put("missingCheckouts", missingCheckouts);

        return summary;
    }

    public CompanyRule getCompanyRule() {
        return companyRuleRepository.findAll().stream().findFirst().orElseGet(() -> {
            CompanyRule defaultRule = new CompanyRule();
            defaultRule.setCompanyStartTime(LocalTime.of(9, 0));
            defaultRule.setCompanyEndTime(LocalTime.of(18, 0));
            defaultRule.setRequiredWorkingHours(8);
            defaultRule.setLateThresholdMinutes(15);
            defaultRule.setHalfDayThresholdMinutes(240);
            defaultRule.setOvertimeThresholdMinutes(60);
            defaultRule.setWorkingDaysPerMonth(26);
            defaultRule.setPaidLeaveDays(10);
            defaultRule.setUnpaidLeaveDays(5);
            return defaultRule;
        });
    }

    @Transactional
    public CompanyRule updateCompanyRule(CompanyRule updatedRule, String actor) {
        CompanyRule rule = getCompanyRule();
        if (updatedRule.getCompanyStartTime() != null) rule.setCompanyStartTime(updatedRule.getCompanyStartTime());
        if (updatedRule.getCompanyEndTime() != null) rule.setCompanyEndTime(updatedRule.getCompanyEndTime());
        if (updatedRule.getRequiredWorkingHours() != null) rule.setRequiredWorkingHours(updatedRule.getRequiredWorkingHours());
        if (updatedRule.getLateThresholdMinutes() != null) rule.setLateThresholdMinutes(updatedRule.getLateThresholdMinutes());
        if (updatedRule.getHalfDayThresholdMinutes() != null) rule.setHalfDayThresholdMinutes(updatedRule.getHalfDayThresholdMinutes());
        if (updatedRule.getOvertimeThresholdMinutes() != null) rule.setOvertimeThresholdMinutes(updatedRule.getOvertimeThresholdMinutes());
        if (updatedRule.getWorkingDaysPerMonth() != null) rule.setWorkingDaysPerMonth(updatedRule.getWorkingDaysPerMonth());
        if (updatedRule.getPaidLeaveDays() != null) rule.setPaidLeaveDays(updatedRule.getPaidLeaveDays());
        if (updatedRule.getUnpaidLeaveDays() != null) rule.setUnpaidLeaveDays(updatedRule.getUnpaidLeaveDays());

        CompanyRule saved = companyRuleRepository.save(rule);
        auditLogService.log(actor != null ? actor : "admin", "UPDATE_COMPANY_RULES", "CompanyRule", saved.getId(),
                "Updated company attendance, working hours, and leave limits");
        return saved;
    }

    @Transactional
    public int markDailyAbsentees(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<Employee> activeEmployees = employeeRepository.findAll().stream()
                .filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()))
                .toList();

        int markedCount = 0;
        for (Employee emp : activeEmployees) {
            Optional<Attendance> existing = attendanceRepository.findByEmployeeAndAttendanceDate(emp, targetDate);
            if (existing.isEmpty()) {
                boolean onLeave = leaveRequestRepository.findByEmployee(emp).stream()
                        .anyMatch(l -> "APPROVED".equalsIgnoreCase(l.getStatus()) &&
                                !targetDate.isBefore(l.getStartDate()) && !targetDate.isAfter(l.getEndDate()));

                Attendance att = new Attendance();
                att.setEmployee(emp);
                att.setAttendanceDate(targetDate);
                att.setStatus(onLeave ? "ON_LEAVE" : "ABSENT");
                att.setWorkingHours(BigDecimal.ZERO);
                att.setOvertimeHours(BigDecimal.ZERO);
                att.setLate(false);
                attendanceRepository.save(att);
                markedCount++;
            }
        }
        return markedCount;
    }

    @Scheduled(cron = "0 55 23 * * MON-SAT")
    public void scheduledDailyAbsenteeRun() {
        markDailyAbsentees(LocalDate.now());
    }

    public String exportAttendanceCsv() {
        List<Attendance> attendances = getAllAttendance();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Employee Code,Employee Name,Department,Date,Check In,Check Out,Working Hours,Overtime Hours,Status,Late\n");

        for (Attendance a : attendances) {
            String empCode = a.getEmployee() != null ? sanitizeCsv(a.getEmployee().getEmployeeCode()) : "";
            String empName = a.getEmployee() != null ? sanitizeCsv(a.getEmployee().getName()) : "";
            String dept = a.getEmployee() != null ? sanitizeCsv(a.getEmployee().getDepartment()) : "";
            String date = a.getAttendanceDate() != null ? a.getAttendanceDate().toString() : "";
            String checkIn = a.getCheckIn() != null ? a.getCheckIn().toLocalTime().toString() : "";
            String checkOut = a.getCheckOut() != null ? a.getCheckOut().toLocalTime().toString() : "";
            String hours = a.getWorkingHours() != null ? a.getWorkingHours().toString() : "0.00";
            String overtime = a.getOvertimeHours() != null ? a.getOvertimeHours().toString() : "0.00";
            String status = a.getStatus() != null ? a.getStatus() : "";
            boolean isLate = a.isLate();

            csv.append(String.format("%d,%s,%s,%s,%s,%s,%s,%s,%s,%s,%b\n",
                    a.getId(), empCode, empName, dept, date, checkIn, checkOut, hours, overtime, status, isLate));
        }

        return csv.toString();
    }

    private String sanitizeCsv(String value) {
        if (value == null) return "";
        // Prevent formula injection
        String clean = value.replaceAll("[\r\n,\"]", " ");
        if (clean.startsWith("=") || clean.startsWith("+") || clean.startsWith("-") || clean.startsWith("@")) {
            clean = "'" + clean;
        }
        return clean;
    }
}

