package com.employee.attendance.service;

import com.employee.attendance.dto.EmployeeRequest;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.User;
import com.employee.attendance.repository.EmployeeRepository;
import com.employee.attendance.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuditLogService auditLogService) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Employee createEmployee(EmployeeRequest request, String actor) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (request.getEmployeeCode() == null || request.getEmployeeCode().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee code is required");
        }
        if (employeeRepository.findByEmail(request.getEmail().trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee with email " + request.getEmail() + " already exists");
        }
        if (employeeRepository.findByEmployeeCode(request.getEmployeeCode().trim()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Employee code " + request.getEmployeeCode() + " already exists");
        }

        Employee employee = new Employee();
        employee.setEmployeeCode(request.getEmployeeCode().trim());
        employee.setName(request.getName() != null ? request.getName().trim() : "Unknown");
        employee.setEmail(request.getEmail().trim());
        employee.setPhone(request.getPhone());
        employee.setDepartment(request.getDepartment());
        employee.setDesignation(request.getDesignation());
        employee.setJoiningDate(request.getJoiningDate());
        employee.setMonthlySalary(request.getMonthlySalary() == null ? BigDecimal.ZERO : request.getMonthlySalary());
        employee.setWorkingHoursPerDay(request.getWorkingHoursPerDay() == null ? 8 : request.getWorkingHoursPerDay());
        employee.setFaceEmbedding(request.getFaceEmbedding());
        employee.setStatus("ACTIVE");
        Employee saved = employeeRepository.save(employee);

        // Also create user login for employee if not exists
        if (userRepository.findByUsername(saved.getEmail()).isEmpty()) {
            User user = new User();
            user.setUsername(saved.getEmail());
            user.setPassword(passwordEncoder.encode("emp123"));
            user.setRole(User.Role.EMPLOYEE);
            userRepository.save(user);
        }

        auditLogService.log(actor, "CREATE_EMPLOYEE", "EMPLOYEE", saved.getId(), "Created employee " + saved.getName() + " (" + saved.getEmployeeCode() + ")");
        return saved;
    }

    public Employee createEmployee(EmployeeRequest request) {
        return createEmployee(request, "admin");
    }

    @Transactional
    public Employee updateEmployee(Long id, EmployeeRequest request, String actor) {
        Employee employee = findById(id);
        if (request.getName() != null) employee.setName(request.getName());
        if (request.getPhone() != null) employee.setPhone(request.getPhone());
        if (request.getDepartment() != null) employee.setDepartment(request.getDepartment());
        if (request.getDesignation() != null) employee.setDesignation(request.getDesignation());
        if (request.getMonthlySalary() != null) employee.setMonthlySalary(request.getMonthlySalary());
        if (request.getWorkingHoursPerDay() != null) employee.setWorkingHoursPerDay(request.getWorkingHoursPerDay());
        if (request.getFaceEmbedding() != null) employee.setFaceEmbedding(request.getFaceEmbedding());
        Employee updated = employeeRepository.save(employee);
        auditLogService.log(actor, "UPDATE_EMPLOYEE", "EMPLOYEE", updated.getId(), "Updated details for " + updated.getName());
        return updated;
    }

    @Transactional
    public Employee updateStatus(Long id, String status, String actor) {
        Employee employee = findById(id);
        employee.setStatus(status.toUpperCase());
        Employee saved = employeeRepository.save(employee);
        auditLogService.log(actor, "UPDATE_STATUS", "EMPLOYEE", saved.getId(), "Status updated to " + status);
        return saved;
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee findById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found: " + id));
    }

    public Employee findByEmployeeCode(String employeeCode) {
        return employeeRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with code: " + employeeCode));
    }
}

