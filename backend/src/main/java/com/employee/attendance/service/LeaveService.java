package com.employee.attendance.service;

import com.employee.attendance.dto.LeaveRequestDto;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.LeaveRequest;
import com.employee.attendance.entity.User;
import com.employee.attendance.repository.EmployeeRepository;
import com.employee.attendance.repository.LeaveRequestRepository;
import com.employee.attendance.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        EmployeeService employeeService,
                        EmployeeRepository employeeRepository,
                        UserRepository userRepository,
                        AuditLogService auditLogService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeService = employeeService;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public LeaveRequest createLeaveRequest(LeaveRequestDto dto, String actor) {
        if (dto.getStartDate() == null || dto.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start and end dates are required");
        }
        if (dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }

        Employee employee;
        if (dto.getEmployeeId() != null) {
            employee = employeeService.findById(dto.getEmployeeId());
        } else {
            employee = employeeRepository.findByEmail(actor)
                    .or(() -> employeeRepository.findByEmployeeCode(actor))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No employee record associated with " + actor));
        }

        // Check overlapping leave
        List<LeaveRequest> existing = leaveRequestRepository.findByEmployee(employee);
        boolean overlap = existing.stream()
                .filter(l -> !"REJECTED".equalsIgnoreCase(l.getStatus()))
                .anyMatch(l -> !(dto.getEndDate().isBefore(l.getStartDate()) || dto.getStartDate().isAfter(l.getEndDate())));

        if (overlap) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An active leave request already exists for the selected date range");
        }

        LeaveRequest request = new LeaveRequest();
        request.setEmployee(employee);
        request.setStartDate(dto.getStartDate());
        request.setEndDate(dto.getEndDate());
        request.setReason(dto.getReason() != null ? dto.getReason().trim() : "Personal leave");
        request.setLeaveType(dto.getLeaveType() != null ? dto.getLeaveType().toUpperCase() : "CASUAL");
        request.setStatus("PENDING");

        LeaveRequest saved = leaveRequestRepository.save(request);
        auditLogService.log(actor, "APPLY_LEAVE", "LEAVE_REQUEST", saved.getId(), "Applied for " + saved.getLeaveType() + " from " + saved.getStartDate() + " to " + saved.getEndDate());
        return saved;
    }

    public LeaveRequest createLeaveRequest(LeaveRequestDto dto) {
        return createLeaveRequest(dto, "admin");
    }

    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<LeaveRequest> getMyLeaves(String username) {
        Employee employee = employeeRepository.findByEmail(username)
                .or(() -> employeeRepository.findByEmployeeCode(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No employee record linked to user " + username));
        return leaveRequestRepository.findByEmployeeOrderByCreatedAtDesc(employee);
    }

    @Transactional
    public LeaveRequest updateStatus(Long id, String status, String actor) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave request not found: " + id));

        String upperStatus = status.toUpperCase();
        if (!"APPROVED".equals(upperStatus) && !"REJECTED".equals(upperStatus) && !"PENDING".equals(upperStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + status);
        }

        request.setStatus(upperStatus);
        if (actor != null) {
            User approver = userRepository.findByUsername(actor).orElse(null);
            request.setApprovedBy(approver);
        }

        LeaveRequest saved = leaveRequestRepository.save(request);
        auditLogService.log(actor, "LEAVE_" + upperStatus, "LEAVE_REQUEST", saved.getId(), "Leave request was " + upperStatus + " for " + saved.getEmployee().getName());
        return saved;
    }
}

