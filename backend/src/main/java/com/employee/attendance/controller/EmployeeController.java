package com.employee.attendance.controller;

import com.employee.attendance.dto.EmployeeRequest;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.service.EmployeeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping("/employees")
    public List<Employee> getEmployees() {
        return employeeService.getAllEmployees();
    }

    @PostMapping({"/employees", "/admin/employees"})
    public ResponseEntity<Employee> createEmployee(@RequestBody EmployeeRequest request, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(employeeService.createEmployee(request, actor));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<Employee> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.findById(id));
    }

    @PutMapping({"/employees/{id}", "/admin/employees/{id}"})
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody EmployeeRequest request, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(employeeService.updateEmployee(id, request, actor));
    }

    @PatchMapping({"/employees/{id}/status", "/admin/employees/{id}/status"})
    public ResponseEntity<Employee> updateStatus(@PathVariable Long id, @RequestParam String status, Authentication authentication) {
        String actor = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(employeeService.updateStatus(id, status, actor));
    }
}

