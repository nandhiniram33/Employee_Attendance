package com.employee.attendance.repository;

import com.employee.attendance.entity.Employee;
import com.employee.attendance.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Long> {
    Optional<Salary> findByEmployeeAndSalaryMonthAndSalaryYear(Employee employee, Integer month, Integer year);
    List<Salary> findByEmployee(Employee employee);
    List<Salary> findByEmployeeOrderBySalaryYearDescSalaryMonthDesc(Employee employee);
    List<Salary> findAllByOrderBySalaryYearDescSalaryMonthDesc();
}

