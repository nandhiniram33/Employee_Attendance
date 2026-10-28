package com.employee.attendance.service;

import com.employee.attendance.dto.ComplaintDto;
import com.employee.attendance.dto.ComplaintStatusUpdateDto;
import com.employee.attendance.entity.Complaint;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.User;
import com.employee.attendance.repository.ComplaintRepository;
import com.employee.attendance.repository.EmployeeRepository;
import com.employee.attendance.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public ComplaintService(ComplaintRepository complaintRepository,
                            EmployeeRepository employeeRepository,
                            UserRepository userRepository,
                            AuditLogService auditLogService) {
        this.complaintRepository = complaintRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Complaint submitComplaint(ComplaintDto dto, String username) {
        if (dto.getSubject() == null || dto.getSubject().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is required");
        }
        if (dto.getDescription() == null || dto.getDescription().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }

        Employee employee = employeeRepository.findByEmail(username)
                .or(() -> employeeRepository.findByEmployeeCode(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee record associated with " + username));

        Complaint complaint = new Complaint();
        complaint.setEmployee(employee);
        complaint.setCategory(dto.getCategory() != null ? dto.getCategory().toUpperCase() : "GENERAL");
        complaint.setSubject(dto.getSubject().trim());
        complaint.setDescription(dto.getDescription().trim());
        complaint.setStatus("SUBMITTED");

        Complaint saved = complaintRepository.save(complaint);
        auditLogService.log(username, "SUBMIT_COMPLAINT", "COMPLAINT", saved.getId(), "Submitted complaint: " + saved.getSubject());
        return saved;
    }

    public List<Complaint> getMyComplaints(String username) {
        Employee employee = employeeRepository.findByEmail(username)
                .or(() -> employeeRepository.findByEmployeeCode(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee record associated with " + username));
        return complaintRepository.findByEmployeeOrderByCreatedAtDesc(employee);
    }

    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public Complaint updateComplaintStatus(Long id, ComplaintStatusUpdateDto dto, String adminUsername) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found: " + id));

        String newStatus = dto.getStatus() != null ? dto.getStatus().toUpperCase() : complaint.getStatus();
        if (!"SUBMITTED".equals(newStatus) && !"IN_PROGRESS".equals(newStatus) && !"RESOLVED".equals(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + dto.getStatus() + ". Must be SUBMITTED, IN_PROGRESS, or RESOLVED.");
        }

        complaint.setStatus(newStatus);
        if (dto.getAdminNote() != null) {
            complaint.setAdminNote(dto.getAdminNote().trim());
        }

        if (adminUsername != null) {
            User resolver = userRepository.findByUsername(adminUsername).orElse(null);
            complaint.setResolvedBy(resolver);
        }

        Complaint saved = complaintRepository.save(complaint);
        auditLogService.log(adminUsername, "UPDATE_COMPLAINT_STATUS", "COMPLAINT", saved.getId(),
                "Updated complaint #" + saved.getId() + " status to " + newStatus);
        return saved;
    }
}
