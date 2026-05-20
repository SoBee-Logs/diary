package com.sobee.sobee.domain.b_log.controller;

import com.sobee.sobee.domain.b_log.dto.PhotoUploadRequest;
import com.sobee.sobee.domain.b_log.dto.PhotoUploadResponse;
import com.sobee.sobee.domain.b_log.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
            @RequestPart("image") MultipartFile image,
            @RequestPart("takenAt") String takenAt,
            @RequestPart("latitude") String latitude,
            @RequestPart("longitude") String longitude,
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "emoji", required = false) String emoji,
            @RequestPart(value = "groupId", required = false) String groupId
    ) {
        Long userId = 1L;

        List<Long> groupIds = null;
        if (groupId != null && !groupId.isEmpty()) {
            groupIds = Arrays.stream(groupId.split(","))
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
        }

        PhotoUploadRequest request = PhotoUploadRequest.builder()
                .image(image)
                .takenAt(takenAt)
                .latitude(Double.valueOf(latitude))
                .longitude(Double.valueOf(longitude))
                .text(text)
                .emoji(emoji)
                .groupId(groupIds)
                .build();

        PhotoUploadResponse response = photoService.uploadPhoto(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}