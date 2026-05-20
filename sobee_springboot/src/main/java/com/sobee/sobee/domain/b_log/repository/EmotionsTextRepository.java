// domain/b_log/repository/EmotionsTextRepository.java
package com.sobee.sobee.domain.b_log.repository;

import com.sobee.sobee.domain.b_log.entity.EmotionsText;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmotionsTextRepository extends JpaRepository<EmotionsText, Long> {
}