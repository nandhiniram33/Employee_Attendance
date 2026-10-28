package com.employee.attendance.controller;

import com.employee.attendance.dto.ComplaintDto;
import com.employee.attendance.dto.ComplaintStatusUpdateDto;
import com.employee.attendance.entity.Complaint;
import com.employee.attendance.service.ComplaintService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping("/complaints")
    public ResponseEntity<Complaint> submitComplaint(@RequestBody ComplaintDto dto, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        return ResponseEntity.ok(complaintService.submitComplaint(dto, username));
    }

    @GetMapping("/complaints/my")
    public List<Complaint> getMyComplaints(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        return complaintService.getMyComplaints(username);
    }

    @GetMapping("/complaints")
    public List<Complaint> getComplaints(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return complaintService.getMyComplaints(authentication.getName());
        }
        return complaintService.getAllComplaints();
    }

    @PatchMapping("/complaints/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Complaint> updateStatus(@PathVariable Long id,
                                                   @RequestBody ComplaintStatusUpdateDto dto,
                                                   Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(complaintService.updateComplaintStatus(id, dto, adminUsername));
    }
}
