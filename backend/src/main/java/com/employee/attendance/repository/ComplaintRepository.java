package com.employee.attendance.repository;

import com.employee.attendance.entity.Complaint;
import com.employee.attendance.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findAllByOrderByCreatedAtDesc();
    List<Complaint> findByEmployeeOrderByCreatedAtDesc(Employee employee);
    long countByStatus(String status);
}
