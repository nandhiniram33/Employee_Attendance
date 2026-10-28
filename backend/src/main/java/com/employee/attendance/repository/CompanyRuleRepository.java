package com.employee.attendance.repository;

import com.employee.attendance.entity.CompanyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyRuleRepository extends JpaRepository<CompanyRule, Long> {
}
