package com.employee.attendance.service;

import com.employee.attendance.dto.AttendanceRequest;
import com.employee.attendance.dto.EmployeeRequest;
import com.employee.attendance.entity.Attendance;
import com.employee.attendance.entity.Employee;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AttendanceServiceTest {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private EmployeeService employeeService;

    @Test
    void testCheckInAndCheckOut() {
        EmployeeRequest empReq = new EmployeeRequest();
        empReq.setEmployeeCode("ATT-101");
        empReq.setName("Attendance Test User");
        empReq.setEmail("att.test@company.com");
        empReq.setMonthlySalary(BigDecimal.valueOf(30000));
        Employee emp = employeeService.createEmployee(empReq, "admin");

        // First swipe: Check-in at 09:00
        AttendanceRequest checkInReq = new AttendanceRequest();
        checkInReq.setEmployeeId(emp.getId());
        LocalDateTime inTime = LocalDateTime.now().withHour(9).withMinute(0).withSecond(0);
        checkInReq.setCheckIn(inTime);

        Attendance checkIn = attendanceService.recordAttendance(checkInReq);
        assertNotNull(checkIn.getId());
        assertEquals("PRESENT", checkIn.getStatus());
        assertFalse(checkIn.isLate());

        // Second swipe: Check-out at 17:30 (8.5 hours)
        AttendanceRequest checkOutReq = new AttendanceRequest();
        checkOutReq.setEmployeeId(emp.getId());
        LocalDateTime outTime = inTime.plusHours(8).plusMinutes(30);
        checkOutReq.setCheckOut(outTime);

        Attendance checkOut = attendanceService.recordAttendance(checkOutReq);
        assertEquals(new BigDecimal("8.50"), checkOut.getWorkingHours());
        assertNotNull(checkOut.getCheckOut());
    }

    @Test
    void testLateArrivalCheckIn() {
        EmployeeRequest empReq = new EmployeeRequest();
        empReq.setEmployeeCode("ATT-102");
        empReq.setName("Late Employee");
        empReq.setEmail("late.emp@company.com");
        Employee emp = employeeService.createEmployee(empReq, "admin");

        // Check-in at 09:45 (past 09:15 threshold)
        AttendanceRequest req = new AttendanceRequest();
        req.setEmployeeId(emp.getId());
        req.setCheckIn(LocalDateTime.now().withHour(9).withMinute(45).withSecond(0));

        Attendance att = attendanceService.recordAttendance(req);
        assertTrue(att.isLate());
        assertEquals("LATE", att.getStatus());
    }
}
