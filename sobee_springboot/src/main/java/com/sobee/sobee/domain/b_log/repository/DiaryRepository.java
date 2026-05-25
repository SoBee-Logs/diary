package com.sobee.sobee.domain.b_log.repository;

import com.sobee.sobee.domain.b_log.entity.Diary;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiaryRepository extends JpaRepository<Diary, Long> {
}