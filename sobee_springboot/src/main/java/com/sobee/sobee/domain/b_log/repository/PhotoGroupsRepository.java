// domain/b_log/repository/PhotoGroupsRepository.java
package com.sobee.sobee.domain.b_log.repository;

import com.sobee.sobee.domain.b_log.entity.PhotoGroups;
import com.sobee.sobee.domain.b_log.entity.PhotoGroupsId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoGroupsRepository extends JpaRepository<PhotoGroups, PhotoGroupsId> {
}