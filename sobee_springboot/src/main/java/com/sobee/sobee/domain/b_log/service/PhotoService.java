package com.sobee.sobee.domain.b_log.service;

import com.sobee.sobee.domain.b_log.dto.PhotoListResponse;
import com.sobee.sobee.domain.b_log.dto.PhotoResponse;
import com.sobee.sobee.domain.b_log.dto.PhotoUploadRequest;
import com.sobee.sobee.domain.b_log.dto.PhotoUploadResponse;
import com.sobee.sobee.domain.b_log.entity.EmotionsText;
import com.sobee.sobee.domain.b_log.entity.MoodType;
import com.sobee.sobee.domain.b_log.entity.Photo;
import com.sobee.sobee.domain.b_log.entity.PhotoGroups;
import com.sobee.sobee.domain.b_log.entity.PhotoGroupsId;
import com.sobee.sobee.domain.b_log.entity.PhotoMetadata;
import com.sobee.sobee.domain.b_log.repository.EmotionsTextRepository;
import com.sobee.sobee.domain.b_log.repository.PhotoGroupsRepository;
import com.sobee.sobee.domain.b_log.repository.PhotoMetadataRepository;
import com.sobee.sobee.domain.b_log.repository.PhotoRepository;
import com.sobee.sobee.global.s3.S3Uploader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final PhotoMetadataRepository photoMetadataRepository;
    private final EmotionsTextRepository emotionsTextRepository;
    private final PhotoGroupsRepository photoGroupsRepository;
    private final S3Uploader s3Uploader;

    private static final DateTimeFormatter TAKEN_AT_FORMATTER = new DateTimeFormatterBuilder()
            .append(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            .optionalStart().appendOffsetId().optionalEnd()
            .toFormatter();

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");

    private LocalDateTime parseTakenAt(String takenAt) {
        try {
            return LocalDateTime.parse(takenAt, TAKEN_AT_FORMATTER);
        } catch (Exception e) {
            return LocalDateTime.parse(takenAt.replace("Z", "").replaceAll("\\.\\d+$", ""));
        }
    }

    @Transactional
    public PhotoUploadResponse uploadPhoto(PhotoUploadRequest request, Long userId) {

        if (request.getLatitude() == null || request.getLongitude() == null || request.getTakenAt() == null) {
            throw new IllegalArgumentException("사진 메타데이터가 없습니다. 다시 촬영해주세요.");
        }

        String imageUrl = s3Uploader.upload(request.getImage());

        Photo photo = Photo.builder()
                .userId(userId)
                .imageUrl(imageUrl)
                .fileName(request.getImage().getOriginalFilename())
                .build();
        photoRepository.save(photo);

        LocalDateTime takenAt = parseTakenAt(request.getTakenAt());
        PhotoMetadata metadata = PhotoMetadata.builder()
                .photo(photo)
                .takenAt(takenAt)
                .latitude(BigDecimal.valueOf(request.getLatitude()))
                .longitude(BigDecimal.valueOf(request.getLongitude()))
                .build();
        photoMetadataRepository.save(metadata);

        if (request.getText() != null || request.getEmoji() != null) {
            MoodType moodType = null;
            if (request.getEmoji() != null) {
                moodType = MoodType.valueOf(request.getEmoji());
            }
            EmotionsText emotionsText = EmotionsText.builder()
                    .photo(photo)
                    .text(request.getText())
                    .emoji(moodType)
                    .build();
            emotionsTextRepository.save(emotionsText);
        }

        if (request.getGroupId() != null && !request.getGroupId().isEmpty()) {
            for (Long groupId : request.getGroupId()) {
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

    @Transactional(readOnly = true)
    public PhotoListResponse getPhotosByDate(Long userId, LocalDate date) {

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        List<Photo> photos = photoRepository.findByUserIdAndDate(userId, startOfDay, endOfDay);

        List<PhotoResponse> responses = photos.stream().map(photo -> {

            // takenAt, date, time 추출
            PhotoMetadata metadata = photoMetadataRepository.findByPhoto(photo).orElse(null);
            String photoDate = metadata != null
                    ? metadata.getTakenAt().format(DATE_FORMATTER) : "";
            String photoTime = metadata != null
                    ? metadata.getTakenAt().format(TIME_FORMATTER) : "";

            // emoji, text 추출
            EmotionsText emotionsText = emotionsTextRepository.findByPhoto(photo).orElse(null);
            String emoji = emotionsText != null && emotionsText.getEmoji() != null
                    ? emotionsText.getEmoji().getEmoji() : null;
            String text = emotionsText != null ? emotionsText.getText() : null;

            // group 목록 추출
            List<Long> groupIds = photoGroupsRepository.findByPhoto(photo)
                    .stream()
                    .map(pg -> pg.getId().getGroupId())
                    .collect(Collectors.toList());

            return PhotoResponse.builder()
                    .id(photo.getPhotoId())
                    .url(photo.getImageUrl())
                    .date(photoDate)
                    .time(photoTime)
                    .emoji(emoji)
                    .text(text)
                    .group(groupIds)
                    .build();

        }).collect(Collectors.toList());

        return PhotoListResponse.builder()
                .photos(responses)
                .build();
    }
}