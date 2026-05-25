package com.sobee.sobee.domain.b_log.repository;

import com.sobee.sobee.domain.b_log.entity.DiaryPhoto;
import com.sobee.sobee.domain.b_log.entity.DiaryPhotoId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiaryPhotoRepository extends JpaRepository<DiaryPhoto, DiaryPhotoId> {
}