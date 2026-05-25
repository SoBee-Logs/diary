package com.sobee.sobee.domain.b_log.service;

import com.sobee.sobee.domain.b_log.dto.DiaryGenerateRequest;
import com.sobee.sobee.domain.b_log.dto.DiaryGenerateResponse;
import com.sobee.sobee.domain.b_log.dto.DiarySaveRequest;
import com.sobee.sobee.domain.b_log.entity.*;
import com.sobee.sobee.domain.b_log.repository.*;
import com.sobee.sobee.domain.group.entity.Group;
import com.sobee.sobee.domain.group.repository.GroupRepository;
import lombok.*;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiaryService {

    private final GroupRepository groupRepository;
    private final PhotoGroupsRepository photoGroupsRepository;
    private final PhotoMetadataRepository photoMetadataRepository;
    private final EmotionsTextRepository emotionsTextRepository;
    private final PhotoVlmResultRepository photoVlmResultRepository;
    private final DiaryRepository diaryRepository;
    private final DiaryPhotoRepository diaryPhotoRepository;

    // FastAPI 서버 주소 — Spring Boot → FastAPI 서버 간 내부 HTTP 통신
    private static final String FASTAPI_DIARY_URL = "http://localhost:8000/api/diary/generate";

    private final RestTemplate restTemplate = new RestTemplate();

    // ──────────────────────────────────────────────
    // ① 일기 생성: 그룹 사진 수집 → LLM 호출 → 결과 반환 (DB 저장은 사용자 확인 후)
    // ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public DiaryGenerateResponse generateDiary(DiaryGenerateRequest req, Long userId) {

        // 모임방 조회 (group_description, group_name 필요)
        Group group = groupRepository.findById(req.getGroupId())
                .orElseThrow(() -> new RuntimeException("모임방을 찾을 수 없습니다. groupId=" + req.getGroupId()));

        // 요청 날짜 파싱
        LocalDate targetDate = LocalDate.parse(req.getDate(), DateTimeFormatter.ISO_LOCAL_DATE);

        // 해당 그룹에 속한 모든 photo_groups 조회
        List<PhotoGroups> pgList = photoGroupsRepository.findByIdGroupId(req.getGroupId());

        // 오늘 날짜에 찍힌 사진만 필터링 (photo_metadata.taken_at 기준 + 본인 사진만)
        List<Photo> todayPhotos = pgList.stream()
                .map(PhotoGroups::getPhoto)
                .filter(photo -> photo.getUserId().equals(userId))  // 본인 사진만
                .filter(photo -> {
                    return photoMetadataRepository
                            .findByPhotoPhotoId(photo.getPhotoId())
                            .map(meta -> meta.getTakenAt() != null
                                    && meta.getTakenAt().toLocalDate().equals(targetDate))
                            .orElse(false);
                })
                .collect(Collectors.toList());

        // 사진이 없으면 기본 일기 반환
        if (todayPhotos.isEmpty()) {
            return DiaryGenerateResponse.builder()
                    .title("조용한 하루")
                    .subtitle("오늘은 소비 기록이 없어요")
                    .diaryLines(Arrays.asList("기록 없는 하루도 있지", "지갑이 쉬어가는 날", "내일을 위한 아낌", "이런 날이 가끔 필요해"))
                    .tags(Collections.singletonList("#" + group.getGroupName()))
                    .roomId(req.getGroupId())
                    .roomLabel(group.getGroupName())
                    .imageUrls(Collections.emptyList())
                    .photoIds(Collections.emptyList())
                    .build();
        }

        // 사진 URL 및 ID 목록
        List<String> imageUrls = todayPhotos.stream()
                .map(Photo::getImageUrl)
                .collect(Collectors.toList());
        List<Long> photoIds = todayPhotos.stream()
                .map(Photo::getPhotoId)
                .collect(Collectors.toList());

        // VLM 결과 수집 — category가 있는 것 우선, 없으면 첫 번째 결과 사용
        PhotoVlmResult bestVlm = todayPhotos.stream()
                .map(p -> photoVlmResultRepository
                        .findFirstByPhotoIdOrderByVlmIdDesc(p.getPhotoId())
                        .orElse(null))
                .filter(vlm -> vlm != null && vlm.getVlmCategory() != null)
                .findFirst()
                .orElse(
                        todayPhotos.stream()
                                .map(p -> photoVlmResultRepository
                                        .findFirstByPhotoIdOrderByVlmIdDesc(p.getPhotoId())
                                        .orElse(null))
                                .filter(Objects::nonNull)
                                .findFirst()
                                .orElse(null)
                );

        // 감정 데이터 — 가장 최근 사진의 감정 사용
        EmotionsText latestEmotion = todayPhotos.stream()
                .map(p -> emotionsTextRepository.findByPhoto(p).orElse(null))
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        // 소비 기분 이모지 결정 (요청 파라미터 우선, 없으면 DB emotions 사용)
        String moodEmoji = req.getMood() != null ? req.getMood()
                : (latestEmotion != null && latestEmotion.getEmoji() != null
                ? latestEmotion.getEmoji().getEmoji()
                : null);

        // FastAPI 요청 객체 구성
        FastApiDiaryRequest faReq = FastApiDiaryRequest.builder()
                .item_name(bestVlm != null ? bestVlm.getVlmItemName() : null)
                .category(bestVlm != null ? bestVlm.getVlmCategory() : null)
                .price(bestVlm != null && bestVlm.getVlmPriceEstimate() != null
                        ? bestVlm.getVlmPriceEstimate().intValue() : null)
                .store_name(bestVlm != null ? bestVlm.getVlmStoreName() : null)
                .description(bestVlm != null ? bestVlm.getVlmDescription() : null)
                .mood(moodEmoji)
                .tags(Collections.singletonList("#" + group.getGroupName()))
                .group_description(group.getGroupDescription())
                .build();

        // FastAPI 호출 (서버 간 내부 HTTP 통신)
        // FastAPI가 다운되거나 오류 시 폴백 일기를 반환해 프론트가 빈 diaries 배열이 되지 않도록 방지
        FastApiDiaryResponse faRes;
        try {
            faRes = callFastApiDiary(faReq);
        } catch (Exception e) {
            // FastAPI 호출 실패 — 간단한 폴백 일기로 대체
            return DiaryGenerateResponse.builder()
                    .title("오늘의 소비 기록")
                    .subtitle("AI 일기 생성에 실패했어요")
                    .diaryLines(Arrays.asList("잠시 서버가 바빠요", "나중에 다시 시도해보세요", "오늘의 소비는 기억 속에 남겨두기로", "잠깐의 쉼도 좋은 법이야"))
                    .tags(Collections.singletonList("#" + group.getGroupName()))
                    .roomId(req.getGroupId())
                    .roomLabel(group.getGroupName())
                    .imageUrls(imageUrls)
                    .photoIds(photoIds)
                    .build();
        }

        return DiaryGenerateResponse.builder()
                .title(faRes.getTitle())
                .subtitle(faRes.getSubtitle())
                .diaryLines(faRes.getDiary_lines())
                .tags(faRes.getTags())
                .roomId(req.getGroupId())
                .roomLabel(group.getGroupName())
                .imageUrls(imageUrls)
                .photoIds(photoIds)
                .build();
    }

    // ──────────────────────────────────────────────
    // ② 일기 저장: 사용자가 "선택하기" + "확인" 후 diary + diary_photos 저장
    // ──────────────────────────────────────────────
    @Transactional
    public void saveDiary(DiarySaveRequest req, Long userId) {

        Diary diary = Diary.builder()
                .userId(userId)
                .groupId(req.getGroupId())
                .diaryContent(req.getDiaryContent())
                .build();
        diaryRepository.save(diary);

        // diary_photos 에 사진 연결 저장
        if (req.getPhotoIds() != null) {
            for (Long photoId : req.getPhotoIds()) {
                DiaryPhoto diaryPhoto = DiaryPhoto.builder()
                        .id(new DiaryPhotoId(photoId, diary.getDiaryId(), userId))
                        .build();
                diaryPhotoRepository.save(diaryPhoto);
            }
        }
    }

    // ──────────────────────────────────────────────
    // FastAPI 내부 호출 헬퍼
    // ──────────────────────────────────────────────
    private FastApiDiaryResponse callFastApiDiary(FastApiDiaryRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<FastApiDiaryRequest> entity = new HttpEntity<>(req, headers);

        ResponseEntity<FastApiDiaryResponse> response = restTemplate.exchange(
                FASTAPI_DIARY_URL,
                HttpMethod.POST,
                entity,
                FastApiDiaryResponse.class
        );

        if (response.getBody() == null) {
            throw new RuntimeException("FastAPI 일기 생성 응답이 비어있습니다.");
        }
        return response.getBody();
    }

    // ──────────────────────────────────────────────
    // FastAPI 통신용 내부 DTO (snake_case로 직렬화 필요)
    // ──────────────────────────────────────────────

    // FastAPI DiaryRequest 스키마에 대응하는 요청 DTO
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    static class FastApiDiaryRequest {
        private String item_name;
        private String category;
        private Integer price;
        private String store_name;
        private String description;
        private String mood;
        private List<String> tags;
        private String group_description;
    }

    // FastAPI DiaryResponse 스키마에 대응하는 응답 DTO
    // @Setter 필수 — RestTemplate이 Jackson으로 역직렬화할 때 private 필드에 값을 주입하려면 setter가 있어야 함
    @Getter
    @Setter
    @NoArgsConstructor
    static class FastApiDiaryResponse {
        private String title;
        private String subtitle;
        private List<String> diary_lines; // FastAPI snake_case 그대로 수신
        private List<String> tags;
    }
}