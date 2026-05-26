package com.sobee.sobee.domain.b_log.controller;

import com.sobee.sobee.domain.b_log.dto.DiaryFeedItemResponse;
import com.sobee.sobee.domain.b_log.dto.DiaryGenerateRequest;
import com.sobee.sobee.domain.b_log.dto.DiaryGenerateResponse;
import com.sobee.sobee.domain.b_log.dto.DiarySaveRequest;
import com.sobee.sobee.domain.b_log.service.DiaryService;
import com.sobee.sobee.global.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/diary")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("토큰이 없습니다.");
        }
        return jwtUtil.getUserId(authHeader.substring(7));
    }

    // POST /api/diary/generate
    // 모임방 + 날짜 기준으로 사진 수집 → FastAPI LLM 호출 → 일기 결과 반환 (DB 저장 전)
    @PostMapping("/generate")
    public ResponseEntity<DiaryGenerateResponse> generateDiary(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody DiaryGenerateRequest request
    ) {
        Long userId = extractUserId(authHeader);
        DiaryGenerateResponse response = diaryService.generateDiary(request, userId);
        return ResponseEntity.ok(response);
    }

    // POST /api/diary/save
    // 사용자가 DiaryResult 화면에서 "선택하기" + "확인" 후 diary + diary_photos 저장
    @PostMapping("/save")
    public ResponseEntity<Void> saveDiary(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody DiarySaveRequest request
    ) {
        Long userId = extractUserId(authHeader);
        diaryService.saveDiary(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // GET /api/diary/list?groupId=xxx
    // 특정 모임방의 일기 목록 최신순 조회 — 피드 화면 DB 연동용
    @GetMapping("/list")
    public ResponseEntity<List<DiaryFeedItemResponse>> getDiaryList(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long groupId
    ) {
        extractUserId(authHeader); // 인증 확인만 수행
        List<DiaryFeedItemResponse> response = diaryService.getDiaryList(groupId);
        return ResponseEntity.ok(response);
    }
}