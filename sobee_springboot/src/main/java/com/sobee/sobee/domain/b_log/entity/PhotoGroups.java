// domain/b_log/entity/PhotoGroups.java
package com.sobee.sobee.domain.b_log.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "photo_groups")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class PhotoGroups {

    @EmbeddedId
    private PhotoGroupsId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("photoId")
    @JoinColumn(name = "photo_id")
    private Photo photo;

    @Column(name = "group_id", insertable = false, updatable = false)
    private Long groupId;
}