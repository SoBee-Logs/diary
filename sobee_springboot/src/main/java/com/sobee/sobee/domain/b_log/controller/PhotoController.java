package com.sobee.sobee.domain.b_log.controller;

import com.sobee.sobee.domain.b_log.dto.PhotoListResponse;
import com.sobee.sobee.domain.b_log.dto.PhotoUploadRequest;
import com.sobee.sobee.domain.b_log.dto.PhotoUploadResponse;
import com.sobee.sobee.domain.b_log.service.PhotoService;
import com.sobee.sobee.global.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("토큰이 없습니다.");
        }
        String token = authHeader.substring(7);
        return jwtUtil.getUserId(token);
    }

    @PostMapping
    public ResponseEntity<PhotoUploadResponse> uploadPhoto(
            @RequestHeader("Authorization") String authHeader,
            @RequestPart("image") MultipartFile image,
            @RequestPart("takenAt") String takenAt,
            @RequestPart("latitude") String latitude,
            @RequestPart("longitude") String longitude,
            @RequestPart(value = "text", required = false) String text,
            @RequestPart(value = "emoji", required = false) String emoji,
            @RequestPart(value = "groupId", required = false) String groupId
    ) {
        Long userId = extractUserId(authHeader);

        List<Long> groupIdList = null;
        if (groupId != null && !groupId.isEmpty()) {
            groupIdList = Arrays.stream(groupId.split(","))
                    .map(String::trim)
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
                .groupId(groupIdList)
                .build();

        PhotoUploadResponse response = photoService.uploadPhoto(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PhotoListResponse> getPhotos(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("date") String date
    ) {
        Long userId = extractUserId(authHeader);
        LocalDate localDate = LocalDate.parse(date);
        PhotoListResponse response = photoService.getPhotosByDate(userId, localDate);
        return ResponseEntity.ok(response);
    }
}