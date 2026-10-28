package com.employee.attendance.service;

import com.employee.attendance.entity.AuditLog;
import com.employee.attendance.entity.User;
import com.employee.attendance.repository.AuditLogRepository;
import com.employee.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    public void log(String actorUsername, String actionType, String targetType, Long targetId, String details) {
        AuditLog auditLog = new AuditLog();
        if (actorUsername != null) {
            User user = userRepository.findByUsername(actorUsername).orElse(null);
            auditLog.setActor(user);
            auditLog.setActorName(actorUsername);
        } else {
            auditLog.setActorName("SYSTEM");
        }
        auditLog.setActionType(actionType);
        auditLog.setTargetType(targetType);
        auditLog.setTargetId(targetId);
        auditLog.setDetails(details);
        auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }
}
