package com.employee.attendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EmployeeAttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmployeeAttendanceApplication.class, args);
    }
}
