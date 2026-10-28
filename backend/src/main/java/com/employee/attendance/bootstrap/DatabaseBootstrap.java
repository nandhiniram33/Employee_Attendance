package com.employee.attendance.bootstrap;

import com.employee.attendance.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseBootstrap implements CommandLineRunner {

    private final AuthService authService;

    public DatabaseBootstrap(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void run(String... args) {
        authService.createDefaultAdmin();
    }
}
