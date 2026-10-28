package com.employee.attendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "company_rules")
public class CompanyRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_start_time", nullable = false)
    private LocalTime companyStartTime = LocalTime.of(9, 0);

    @Column(name = "company_end_time", nullable = false)
    private LocalTime companyEndTime = LocalTime.of(18, 0);

    @Column(name = "required_working_hours", nullable = false)
    private Integer requiredWorkingHours = 8;

    @Column(name = "late_threshold_minutes", nullable = false)
    private Integer lateThresholdMinutes = 15;

    @Column(name = "half_day_threshold_minutes", nullable = false)
    private Integer halfDayThresholdMinutes = 240;

    @Column(name = "overtime_threshold_minutes", nullable = false)
    private Integer overtimeThresholdMinutes = 60;

    @Column(name = "working_days_per_month", nullable = false)
    private Integer workingDaysPerMonth = 26;

    @Column(name = "paid_leave_days", nullable = false)
    private Integer paidLeaveDays = 10;

    @Column(name = "unpaid_leave_days", nullable = false)
    private Integer unpaidLeaveDays = 5;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalTime getCompanyStartTime() {
        return companyStartTime;
    }

    public void setCompanyStartTime(LocalTime companyStartTime) {
        this.companyStartTime = companyStartTime;
    }

    public LocalTime getCompanyEndTime() {
        return companyEndTime;
    }

    public void setCompanyEndTime(LocalTime companyEndTime) {
        this.companyEndTime = companyEndTime;
    }

    public Integer getRequiredWorkingHours() {
        return requiredWorkingHours;
    }

    public void setRequiredWorkingHours(Integer requiredWorkingHours) {
        this.requiredWorkingHours = requiredWorkingHours;
    }

    public Integer getLateThresholdMinutes() {
        return lateThresholdMinutes;
    }

    public void setLateThresholdMinutes(Integer lateThresholdMinutes) {
        this.lateThresholdMinutes = lateThresholdMinutes;
    }

    public Integer getHalfDayThresholdMinutes() {
        return halfDayThresholdMinutes;
    }

    public void setHalfDayThresholdMinutes(Integer halfDayThresholdMinutes) {
        this.halfDayThresholdMinutes = halfDayThresholdMinutes;
    }

    public Integer getOvertimeThresholdMinutes() {
        return overtimeThresholdMinutes;
    }

    public void setOvertimeThresholdMinutes(Integer overtimeThresholdMinutes) {
        this.overtimeThresholdMinutes = overtimeThresholdMinutes;
    }

    public Integer getWorkingDaysPerMonth() {
        return workingDaysPerMonth;
    }

    public void setWorkingDaysPerMonth(Integer workingDaysPerMonth) {
        this.workingDaysPerMonth = workingDaysPerMonth;
    }

    public Integer getPaidLeaveDays() {
        return paidLeaveDays;
    }

    public void setPaidLeaveDays(Integer paidLeaveDays) {
        this.paidLeaveDays = paidLeaveDays;
    }

    public Integer getUnpaidLeaveDays() {
        return unpaidLeaveDays;
    }

    public void setUnpaidLeaveDays(Integer unpaidLeaveDays) {
        this.unpaidLeaveDays = unpaidLeaveDays;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
