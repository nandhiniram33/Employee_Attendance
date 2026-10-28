package com.employee.attendance.service;

import com.employee.attendance.dto.EmployeeRequest;
import com.employee.attendance.entity.Employee;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EmployeeServiceTest {

    @Autowired
    private EmployeeService employeeService;

    @Test
    void testCreateEmployeeSuccess() {
        EmployeeRequest req = new EmployeeRequest();
        req.setEmployeeCode("TEST-101");
        req.setName("Test User");
        req.setEmail("test.user@company.com");
        req.setDepartment("Engineering");
        req.setMonthlySalary(BigDecimal.valueOf(40000));

        Employee emp = employeeService.createEmployee(req, "admin");
        assertNotNull(emp.getId());
        assertEquals("TEST-101", emp.getEmployeeCode());
        assertEquals("ACTIVE", emp.getStatus());
    }

    @Test
    void testDuplicateEmailThrowsException() {
        EmployeeRequest req1 = new EmployeeRequest();
        req1.setEmployeeCode("TEST-102");
        req1.setName("User One");
        req1.setEmail("dup@company.com");
        employeeService.createEmployee(req1, "admin");

        EmployeeRequest req2 = new EmployeeRequest();
        req2.setEmployeeCode("TEST-103");
        req2.setName("User Two");
        req2.setEmail("dup@company.com");

        assertThrows(ResponseStatusException.class, () -> employeeService.createEmployee(req2, "admin"));
    }

    @Test
    void testUpdateStatus() {
        EmployeeRequest req = new EmployeeRequest();
        req.setEmployeeCode("TEST-104");
        req.setName("User Status");
        req.setEmail("status@company.com");
        Employee emp = employeeService.createEmployee(req, "admin");

        Employee updated = employeeService.updateStatus(emp.getId(), "INACTIVE", "admin");
        assertEquals("INACTIVE", updated.getStatus());
    }
}
