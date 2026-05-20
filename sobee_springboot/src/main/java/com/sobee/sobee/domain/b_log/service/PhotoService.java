package com.sobee.sobee.domain.b_log.service;

import com.sobee.sobee.domain.b_log.dto.PhotoUploadRequest;
import com.sobee.sobee.domain.b_log.dto.PhotoUploadResponse;
import com.sobee.sobee.domain.b_log.entity.EmotionsText;
import com.sobee.sobee.domain.b_log.entity.Photo;
import com.sobee.sobee.domain.b_log.entity.PhotoGroups;
import com.sobee.sobee.domain.b_log.entity.PhotoGroupsId;
import com.sobee.sobee.domain.b_log.entity.MoodType;
import com.sobee.sobee.domain.b_log.entity.PhotoMetadata;
import com.sobee.sobee.domain.b_log.repository.EmotionsTextRepository;
import com.sobee.sobee.domain.b_log.repository.PhotoMetadataRepository;
import com.sobee.sobee.domain.b_log.repository.PhotoRepository;
import com.sobee.sobee.domain.b_log.repository.PhotoGroupsRepository;
import com.sobee.sobee.global.s3.S3Uploader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final PhotoMetadataRepository photoMetadataRepository;
    private final EmotionsTextRepository emotionsTextRepository;
    private final S3Uploader s3Uploader;
    private final PhotoGroupsRepository photoGroupsRepository;

    // Z 포함한 ISO 8601 형식 처리
    private static final DateTimeFormatter TAKEN_AT_FORMATTER = new DateTimeFormatterBuilder()
            .append(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            .optionalStart().appendOffsetId().optionalEnd()
            .toFormatter();

    private LocalDateTime parseTakenAt(String takenAt) {
        try {
            return LocalDateTime.parse(takenAt, TAKEN_AT_FORMATTER);
        } catch (Exception e) {
            // Z 제거 후 재시도
            return LocalDateTime.parse(takenAt.replace("Z", "").replaceAll("\\.\\d+$", ""));
        }
    }

    @Transactional
    public PhotoUploadResponse uploadPhoto(PhotoUploadRequest request, Long userId) {

        // 메타데이터 검증
        if (request.getLatitude() == null || request.getLongitude() == null || request.getTakenAt() == null) {
            throw new IllegalArgumentException("사진 메타데이터가 없습니다. 다시 촬영해주세요.");
        }

        // S3 업로드
        String imageUrl = s3Uploader.upload(request.getImage());

        // Photo 저장
        Photo photo = Photo.builder()
                .userId(userId)
                .imageUrl(imageUrl)
                .fileName(request.getImage().getOriginalFilename())
                .build();
        photoRepository.save(photo);

        // PhotoMetadata 저장
        LocalDateTime takenAt = parseTakenAt(request.getTakenAt());
        PhotoMetadata metadata = PhotoMetadata.builder()
                .photo(photo)
                .takenAt(takenAt)
                .latitude(BigDecimal.valueOf(request.getLatitude()))
                .longitude(BigDecimal.valueOf(request.getLongitude()))
                .build();
        photoMetadataRepository.save(metadata);

        // EmotionsText 저장 (nullable)
        if (request.getText() != null || request.getEmoji() != null) {
            MoodType moodType = null;
            if (request.getEmoji() != null) {
                moodType = MoodType.valueOf(request.getEmoji());  // "HAPPY" → MoodType.HAPPY
            }
            EmotionsText emotionsText = EmotionsText.builder()
                    .photo(photo)
                    .text(request.getText())
                    .emoji(moodType)
                    .build();
            emotionsTextRepository.save(emotionsText);
        }

        if (request.getGroupId() != null && !request.getGroupId().isEmpty()) {
            for (Long groupId : request.getGroupId()) {  // groupIds → request.getGroupId()
                PhotoGroups photoGroups = PhotoGroups.builder()
                        .id(new PhotoGroupsId(photo.getPhotoId(), groupId))
                        .photo(photo)
                        .build();
                photoGroupsRepository.save(photoGroups);
            }
        }

        return PhotoUploadResponse.builder()
                .photoId(photo.getPhotoId())
                .imageUrl(imageUrl)
                .takenAt(takenAt)
                .createdAt(photo.getCreatedAt())
                .build();
    }
}