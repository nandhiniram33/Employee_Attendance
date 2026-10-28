package com.employee.attendance.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/live")
    public ResponseEntity<Map<String, String>> liveness() {
        return ResponseEntity.ok(Map.of("status", "UP", "component", "attendance-api"));
    }

    @GetMapping({"", "/ready"})
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "attendance-api");

        try (Connection connection = dataSource.getConnection()) {
            boolean valid = connection.isValid(2);
            if (valid) {
                status.put("status", "UP");
                status.put("database", "CONNECTED");
                return ResponseEntity.ok(status);
            } else {
                status.put("status", "DOWN");
                status.put("database", "CONNECTION_INVALID");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(status);
            }
        } catch (Exception e) {
            status.put("status", "DOWN");
            status.put("database", "ERROR: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(status);
        }
    }
}
