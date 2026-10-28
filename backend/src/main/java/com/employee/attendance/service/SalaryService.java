package com.employee.attendance.service;

import com.employee.attendance.entity.Attendance;
import com.employee.attendance.entity.CompanyRule;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.LeaveRequest;
import com.employee.attendance.entity.Salary;
import com.employee.attendance.repository.AttendanceRepository;
import com.employee.attendance.repository.CompanyRuleRepository;
import com.employee.attendance.repository.EmployeeRepository;
import com.employee.attendance.repository.LeaveRequestRepository;
import com.employee.attendance.repository.SalaryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;
    private final CompanyRuleRepository companyRuleRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AuditLogService auditLogService;

    public SalaryService(SalaryRepository salaryRepository,
                         EmployeeRepository employeeRepository,
                         CompanyRuleRepository companyRuleRepository,
                         AttendanceRepository attendanceRepository,
                         LeaveRequestRepository leaveRequestRepository,
                         AuditLogService auditLogService) {
        this.salaryRepository = salaryRepository;
        this.employeeRepository = employeeRepository;
        this.companyRuleRepository = companyRuleRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.auditLogService = auditLogService;
    }

    public List<Salary> getSalaryRecords() {
        return salaryRepository.findAllByOrderBySalaryYearDescSalaryMonthDesc();
    }

    public List<Salary> getMySalary(String username) {
        Employee employee = employeeRepository.findByEmail(username)
                .or(() -> employeeRepository.findByEmployeeCode(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee record linked to user " + username));
        return salaryRepository.findByEmployeeOrderBySalaryYearDescSalaryMonthDesc(employee);
    }

    public Salary getSalaryById(Long id) {
        return salaryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Salary record not found: " + id));
    }

    @Transactional
    public Salary generateMonthlySalary(Long employeeId, Integer month, Integer year, String actor) {
        if (month == null || month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid month: " + month);
        }
        if (year == null || year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year: " + year);
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found: " + employeeId));

        CompanyRule companyRule = companyRuleRepository.findAll().stream().findFirst().orElseGet(() -> {
            CompanyRule cr = new CompanyRule();
            cr.setWorkingDaysPerMonth(26);
            cr.setRequiredWorkingHours(8);
            cr.setPaidLeaveDays(10);
            cr.setUnpaidLeaveDays(5);
            return cr;
        });

        int workingDaysPerMonth = companyRule.getWorkingDaysPerMonth() > 0 ? companyRule.getWorkingDaysPerMonth() : 26;
        BigDecimal basicSalary = employee.getMonthlySalary() != null ? employee.getMonthlySalary() : BigDecimal.ZERO;
        BigDecimal dailySalary = basicSalary.divide(BigDecimal.valueOf(workingDaysPerMonth), 2, RoundingMode.HALF_UP);

        // Fetch real attendance records for this employee in the given month and year
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.plusMonths(1).minusDays(1);
        List<Attendance> attendances = attendanceRepository.findByEmployeeAndAttendanceDateBetween(employee, startOfMonth, endOfMonth);

        BigDecimal payableDays;
        BigDecimal totalOvertimeHours = BigDecimal.ZERO;

        if (!attendances.isEmpty()) {
            double presentCount = 0;
            for (Attendance a : attendances) {
                if ("PRESENT".equalsIgnoreCase(a.getStatus()) || "LATE".equalsIgnoreCase(a.getStatus())) {
                    presentCount += 1.0;
                } else if ("HALF_DAY".equalsIgnoreCase(a.getStatus())) {
                    presentCount += 0.5;
                }
                if (a.getOvertimeHours() != null && a.getOvertimeHours().compareTo(BigDecimal.ZERO) > 0) {
                    totalOvertimeHours = totalOvertimeHours.add(a.getOvertimeHours());
                }
            }
            payableDays = BigDecimal.valueOf(presentCount).setScale(2, RoundingMode.HALF_UP);
        } else {
            // Default baseline if attendance records are not yet logged for upcoming month
            payableDays = BigDecimal.valueOf(workingDaysPerMonth);
        }

        // Count approved leaves in this month
        List<LeaveRequest> leaves = leaveRequestRepository.findByEmployee(employee);
        long approvedLeaveDays = leaves.stream()
                .filter(l -> "APPROVED".equalsIgnoreCase(l.getStatus()))
                .filter(l -> !l.getStartDate().isAfter(endOfMonth) && !l.getEndDate().isBefore(startOfMonth))
                .count();

        BigDecimal paidLeaveDays = BigDecimal.valueOf(Math.min(approvedLeaveDays, companyRule.getPaidLeaveDays()));
        BigDecimal unpaidLeaveDays = BigDecimal.valueOf(Math.max(0, approvedLeaveDays - companyRule.getPaidLeaveDays()));

        int hoursPerDay = companyRule.getRequiredWorkingHours() > 0 ? companyRule.getRequiredWorkingHours() : 8;
        BigDecimal hourlyRate = dailySalary.divide(BigDecimal.valueOf(hoursPerDay), 2, RoundingMode.HALF_UP);
        BigDecimal overtimeAmount = hourlyRate.multiply(totalOvertimeHours).setScale(2, RoundingMode.HALF_UP);
        BigDecimal bonus = basicSalary.multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP); // 5% performance bonus
        BigDecimal deductions = unpaidLeaveDays.multiply(dailySalary).setScale(2, RoundingMode.HALF_UP);

        BigDecimal finalSalary = dailySalary.multiply(payableDays)
                .add(dailySalary.multiply(paidLeaveDays))
                .add(overtimeAmount)
                .add(bonus)
                .subtract(deductions)
                .setScale(2, RoundingMode.HALF_UP);

        if (finalSalary.compareTo(BigDecimal.ZERO) < 0) {
            finalSalary = BigDecimal.ZERO;
        }

        Optional<Salary> existing = salaryRepository.findByEmployeeAndSalaryMonthAndSalaryYear(employee, month, year);
        Salary salary = existing.orElseGet(Salary::new);
        salary.setEmployee(employee);
        salary.setSalaryMonth(month);
        salary.setSalaryYear(year);
        salary.setBasicSalary(basicSalary);
        salary.setPayableDays(payableDays);
        salary.setPaidLeaveDays(paidLeaveDays);
        salary.setUnpaidLeaveDays(unpaidLeaveDays);
        salary.setOvertimeAmount(overtimeAmount);
        salary.setDeductions(deductions);
        salary.setBonus(bonus);
        salary.setFinalSalary(finalSalary);

        Salary saved = salaryRepository.save(salary);
        auditLogService.log(actor, "GENERATE_SALARY", "SALARY", saved.getId(),
                "Generated payroll for " + employee.getName() + " (" + month + "/" + year + ") - Net: " + finalSalary);
        return saved;
    }

    public Salary generateMonthlySalary(Long employeeId, Integer month, Integer year) {
        return generateMonthlySalary(employeeId, month, year, "admin");
    }
}

