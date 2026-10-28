package com.employee.attendance.controller;

import com.employee.attendance.entity.Salary;
import com.employee.attendance.service.SalaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SalaryController {

    private final SalaryService salaryService;

    public SalaryController(SalaryService salaryService) {
        this.salaryService = salaryService;
    }

    @GetMapping("/salary")
    public List<Salary> getSalaryRecords() {
        return salaryService.getSalaryRecords();
    }

    @GetMapping("/salary/my")
    public List<Salary> getMySalary(org.springframework.security.core.Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return salaryService.getMySalary(username);
    }

    @GetMapping({"/salary/{id}", "/salary/payslip/{id}"})
    public ResponseEntity<Salary> getPayslip(@PathVariable Long id) {
        return ResponseEntity.ok(salaryService.getSalaryById(id));
    }

    @PostMapping({"/salary/generate", "/admin/salary/generate"})
    public ResponseEntity<Salary> generateMonthlySalary(@RequestParam Long employeeId,
                                                        @RequestParam Integer month,
                                                        @RequestParam Integer year,
                                                        org.springframework.security.core.Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(salaryService.generateMonthlySalary(employeeId, month, year, actor));
    }
}
