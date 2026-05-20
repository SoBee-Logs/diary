// domain/b_log/repository/PhotoMetadataRepository.java
package com.sobee.sobee.domain.b_log.repository;

import com.sobee.sobee.domain.b_log.entity.PhotoMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoMetadataRepository extends JpaRepository<PhotoMetadata, Long> {
}