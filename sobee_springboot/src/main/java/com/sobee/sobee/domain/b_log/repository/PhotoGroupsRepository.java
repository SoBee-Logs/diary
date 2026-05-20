// domain/b_log/repository/PhotoGroupsRepository.java
package com.sobee.sobee.domain.b_log.repository;

import com.sobee.sobee.domain.b_log.entity.Photo;
import com.sobee.sobee.domain.b_log.entity.PhotoGroups;
import com.sobee.sobee.domain.b_log.entity.PhotoGroupsId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoGroupsRepository extends JpaRepository<PhotoGroups, PhotoGroupsId> {
    List<PhotoGroups> findByPhoto(Photo photo);
}