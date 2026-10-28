package com.employee.attendance.service;

import com.employee.attendance.dto.EmployeeRequest;
import com.employee.attendance.dto.LeaveRequestDto;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.LeaveRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LeaveServiceTest {

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private EmployeeService employeeService;

    @Test
    void testApplyAndApproveLeave() {
        EmployeeRequest empReq = new EmployeeRequest();
        empReq.setEmployeeCode("LV-101");
        empReq.setName("Leave Employee");
        empReq.setEmail("leave.emp@company.com");
        empReq.setMonthlySalary(BigDecimal.valueOf(35000));
        Employee emp = employeeService.createEmployee(empReq, "admin");

        LeaveRequestDto dto = new LeaveRequestDto();
        dto.setEmployeeId(emp.getId());
        dto.setStartDate(LocalDate.now().plusDays(1));
        dto.setEndDate(LocalDate.now().plusDays(3));
        dto.setLeaveType("CASUAL");
        dto.setReason("Family function");

        LeaveRequest req = leaveService.createLeaveRequest(dto, "admin");
        assertNotNull(req.getId());
        assertEquals("PENDING", req.getStatus());

        LeaveRequest approved = leaveService.updateStatus(req.getId(), "APPROVED", "admin");
        assertEquals("APPROVED", approved.getStatus());
    }

    @Test
    void testInvalidDatesRejection() {
        EmployeeRequest empReq = new EmployeeRequest();
        empReq.setEmployeeCode("LV-102");
        empReq.setName("Invalid Leave Emp");
        empReq.setEmail("invalid.leave@company.com");
        Employee emp = employeeService.createEmployee(empReq, "admin");

        LeaveRequestDto dto = new LeaveRequestDto();
        dto.setEmployeeId(emp.getId());
        dto.setStartDate(LocalDate.now().plusDays(5));
        dto.setEndDate(LocalDate.now().plusDays(2)); // end before start
        dto.setLeaveType("SICK");

        assertThrows(ResponseStatusException.class, () -> leaveService.createLeaveRequest(dto, "admin"));
    }
}
