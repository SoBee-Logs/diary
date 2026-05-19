// domain/b_log/entity/EmotionsText.java
package com.sobee.sobee.domain.b_log.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "emotions_text")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class EmotionsText {

    @Id
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id", nullable = false)
    private Photo photo;

    @Column(name = "text", length = 100)
    private String text;

    @Column(name = "emoji", length = 50)
    private String emoji;
}