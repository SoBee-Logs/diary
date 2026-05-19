// domain/b_log/controller/PhotoController.java
package com.sobee.sobee.domain.b_log.controller;

import com.sobee.sobee.domain.b_log.dto.PhotoUploadRequest;
import com.sobee.sobee.domain.b_log.dto.PhotoUploadResponse;
import com.sobee.sobee.domain.b_log.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
            @RequestPart("image") MultipartFile image,
            @RequestPart("takenAt") String takenAt,
            @RequestPart("latitude") String latitude,
            @RequestPart("longitude") String longitude,
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "emoji", required = false) String emoji,
            @RequestPart(value = "groupId", required = false) List<Long> groupId
    ) {
        // 임시 userId (추후 JWT 인증으로 교체)
        Long userId = 1L;

        PhotoUploadRequest request = PhotoUploadRequest.builder()
                .image(image)
                .takenAt(takenAt)
                .latitude(Double.valueOf(latitude))
                .longitude(Double.valueOf(longitude))
                .text(text)
                .emoji(emoji)
                .groupId(groupId)
                .build();

        PhotoUploadResponse response = photoService.uploadPhoto(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}