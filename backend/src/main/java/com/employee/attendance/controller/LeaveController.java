package com.employee.attendance.controller;

import com.employee.attendance.dto.LeaveRequestDto;
import com.employee.attendance.entity.LeaveRequest;
import com.employee.attendance.service.LeaveService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @GetMapping("/leaves")
    public List<LeaveRequest> getLeaves() {
        return leaveService.getAllLeaveRequests();
    }

    @GetMapping("/leaves/my")
    public List<LeaveRequest> getMyLeaves(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return leaveService.getMyLeaves(username);
    }

    @PostMapping("/leaves")
    public ResponseEntity<LeaveRequest> createLeave(@RequestBody LeaveRequestDto dto, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(leaveService.createLeaveRequest(dto, actor));
    }

    @PutMapping({"/leaves/{id}/status", "/admin/leaves/{id}/status"})
    public ResponseEntity<LeaveRequest> updateStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(leaveService.updateStatus(id, status, actor));
    }

    @PatchMapping({"/leaves/{id}/approve", "/admin/leaves/{id}/approve"})
    public ResponseEntity<LeaveRequest> approveLeave(@PathVariable Long id, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(leaveService.updateStatus(id, "APPROVED", actor));
    }

    @PatchMapping({"/leaves/{id}/reject", "/admin/leaves/{id}/reject"})
    public ResponseEntity<LeaveRequest> rejectLeave(@PathVariable Long id, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(leaveService.updateStatus(id, "REJECTED", actor));
    }
}

