package com.employee.attendance.service;

import com.employee.attendance.dto.EmployeeRequest;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.Salary;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SalaryServiceTest {

    @Autowired
    private SalaryService salaryService;

    @Autowired
    private EmployeeService employeeService;

    @Test
    void testGenerateMonthlySalary() {
        EmployeeRequest empReq = new EmployeeRequest();
        empReq.setEmployeeCode("SAL-101");
        empReq.setName("Salary Test User");
        empReq.setEmail("sal.user@company.com");
        empReq.setMonthlySalary(BigDecimal.valueOf(52000));
        Employee emp = employeeService.createEmployee(empReq, "admin");

        Salary salary = salaryService.generateMonthlySalary(emp.getId(), 10, 2026, "admin");
        assertNotNull(salary.getId());
        assertEquals(10, salary.getSalaryMonth());
        assertEquals(2026, salary.getSalaryYear());
        assertTrue(salary.getFinalSalary().compareTo(BigDecimal.ZERO) > 0);
    }
}
