package com.employee.attendance.service;

import com.employee.attendance.dto.AuthRequest;
import com.employee.attendance.dto.AuthResponse;
import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.User;
import com.employee.attendance.repository.EmployeeRepository;
import com.employee.attendance.repository.UserRepository;
import com.employee.attendance.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       EmployeeRepository employeeRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
        ));

        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> employeeRepository.findByEmployeeCode(request.getUsername())
                        .flatMap(emp -> userRepository.findByUsername(emp.getEmail())))
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtService.generateToken(user.getUsername());
        return new AuthResponse(token, user.getRole().name(), user.getUsername());
    }

    public Map<String, Object> getCurrentUserInfo(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Not authenticated");
        }
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());

        // Find linked employee if exists
        employeeRepository.findByEmail(user.getUsername())
                .or(() -> employeeRepository.findByEmployeeCode(user.getUsername()))
                .ifPresent(emp -> {
                    response.put("employeeId", emp.getId());
                    response.put("employeeCode", emp.getEmployeeCode());
                    response.put("name", emp.getName());
                    response.put("department", emp.getDepartment());
                    response.put("designation", emp.getDesignation());
                });

        return response;
    }

    public void createDefaultAdmin() {
        userRepository.findByUsername("admin").ifPresentOrElse(
                user -> {
                    user.setPassword(passwordEncoder.encode("admin123"));
                    user.setRole(User.Role.ADMIN);
                    user.setEnabled(true);
                    userRepository.save(user);
                },
                () -> {
                    User user = new User();
                    user.setUsername("admin");
                    user.setPassword(passwordEncoder.encode("admin123"));
                    user.setRole(User.Role.ADMIN);
                    user.setEnabled(true);
                    userRepository.save(user);
                }
        );
    }
}

