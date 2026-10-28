package com.employee.attendance.controller;

import com.employee.attendance.dto.AttendanceRequest;
import com.employee.attendance.entity.Attendance;
import com.employee.attendance.entity.CompanyRule;
import com.employee.attendance.service.AttendanceService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/attendance")
    public List<Attendance> getAttendances(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return attendanceService.getMyAttendance(authentication.getName());
        }
        return attendanceService.getAllAttendance();
    }

    @GetMapping("/attendance/my")
    public List<Attendance> getMyAttendance(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return attendanceService.getMyAttendance(username);
    }

    @GetMapping("/attendance/my/summary")
    public ResponseEntity<java.util.Map<String, Object>> getMyWorkingHoursSummary(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(attendanceService.getMyWorkingHoursSummary(username));
    }

    @PostMapping("/attendance/recognize")
    public ResponseEntity<Attendance> recordAttendance(@RequestBody AttendanceRequest request, Authentication authentication) {
        return ResponseEntity.ok(attendanceService.recordAttendance(request, authentication));
    }

    @GetMapping("/attendance/export")
    public ResponseEntity<byte[]> exportCsv() {
        String csv = attendanceService.exportAttendanceCsv();
        byte[] bytes = csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }

    @GetMapping("/attendance/rule")
    public ResponseEntity<CompanyRule> getCompanyRule() {
        return ResponseEntity.ok(attendanceService.getCompanyRule());
    }

    @PutMapping("/attendance/rule")
    public ResponseEntity<CompanyRule> updateCompanyRule(@RequestBody CompanyRule rule, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(attendanceService.updateCompanyRule(rule, actor));
    }

    @PostMapping("/attendance/mark-absent")
    public ResponseEntity<java.util.Map<String, Object>> markDailyAbsentees(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        int marked = attendanceService.markDailyAbsentees(date);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("markedAbsentees", marked);
        response.put("date", date != null ? date.toString() : java.time.LocalDate.now().toString());
        return ResponseEntity.ok(response);
    }
}

