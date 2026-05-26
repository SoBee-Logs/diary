package com.sobee.sobee.domain.b_log.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sobee.sobee.domain.b_log.dto.DiaryFeedItemResponse;
import com.sobee.sobee.domain.b_log.dto.DiaryGenerateRequest;
import com.sobee.sobee.domain.b_log.dto.DiaryGenerateResponse;
import com.sobee.sobee.domain.b_log.dto.DiarySaveRequest;
import com.sobee.sobee.domain.b_log.entity.*;
import com.sobee.sobee.domain.b_log.repository.*;
import com.sobee.sobee.domain.group.entity.Group;
import com.sobee.sobee.domain.group.repository.GroupRepository;
import com.sobee.sobee.domain.user.entity.User;
import com.sobee.sobee.domain.user.repository.UserRepository;
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
    private final PersonaTransactionRepository personaTransactionRepository;
    private final DiaryRepository diaryRepository;
    private final DiaryPhotoRepository diaryPhotoRepository;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;  // diaryContent JSON 파싱용

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

        // 오늘 날짜 + 본인 사진 + 결제 매핑된(persona_transaction 존재) 사진만 필터링
        // → 일기는 결제가 확인된 소비 기록만을 소재로 써야 하므로 매핑 여부로 필터
        List<Photo> todayPhotos = pgList.stream()
                .map(PhotoGroups::getPhoto)
                .filter(photo -> photo.getUserId().equals(userId))
                .filter(photo -> photoMetadataRepository
                        .findByPhotoPhotoId(photo.getPhotoId())
                        .map(meta -> meta.getTakenAt() != null
                                && meta.getTakenAt().toLocalDate().equals(targetDate))
                        .orElse(false))
                .filter(photo -> personaTransactionRepository.existsByPhotoId(photo.getPhotoId()))
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

        // 소비 기분 이모지 — navigation state 아닌 DB emotions_text에서만 읽음
        String moodEmoji = latestEmotion != null && latestEmotion.getEmoji() != null
                ? latestEmotion.getEmoji().getEmoji()
                : null;

        // 결제 매핑된 사진 ID 목록 (DiaryResult 💳 배지 + FastAPI matched 여부에 활용)
        List<Long> matchedPhotoIds = photoIds.stream()
                .filter(pid -> personaTransactionRepository.existsByPhotoId(pid))
                .collect(Collectors.toList());
        boolean matched = !matchedPhotoIds.isEmpty();

        // FastAPI 요청 객체 구성 (3가지 핵심 재료 포함)
        FastApiDiaryRequest faReq = FastApiDiaryRequest.builder()
                // 재료 1: VLM 분석 결과 + 결제 매핑 여부
                .item_name(bestVlm != null ? bestVlm.getVlmItemName() : null)
                .category(bestVlm != null ? bestVlm.getVlmCategory() : null)
                .price(bestVlm != null && bestVlm.getVlmPriceEstimate() != null
                        ? bestVlm.getVlmPriceEstimate().intValue() : null)
                .store_name(bestVlm != null ? bestVlm.getVlmStoreName() : null)
                .description(bestVlm != null ? bestVlm.getVlmDescription() : null)
                .matched(matched)
                // 재료 2: 사용자 감정 데이터 (이모지 + 텍스트)
                .mood(moodEmoji)
                .emotion_text(latestEmotion != null ? latestEmotion.getText() : null)
                // 재료 3: 모임방 특징 정보
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
                    .matchedPhotoIds(matchedPhotoIds)
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
                .matchedPhotoIds(matchedPhotoIds)
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

        // diary_photos에 사진 연결 저장 (photoIds가 null이거나 비어있어도 안전하게 처리)
        if (req.getPhotoIds() != null && !req.getPhotoIds().isEmpty()) {
            for (Long photoId : req.getPhotoIds()) {
                DiaryPhoto diaryPhoto = DiaryPhoto.builder()
                        .id(new DiaryPhotoId(photoId, diary.getDiaryId(), userId))
                        .build();
                diaryPhotoRepository.save(diaryPhoto);
            }
        }
    }

    // ──────────────────────────────────────────────
    // ③ 피드 조회: groupId 기준으로 저장된 일기 목록 반환 (최신순)
    // ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DiaryFeedItemResponse> getDiaryList(Long groupId) {

        List<Diary> diaries = diaryRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        Group group = groupRepository.findById(groupId).orElse(null);

        return diaries.stream().map(diary -> {

            // 작성자 이름 조회 (없으면 기본값)
            User author = userRepository.findById(diary.getUserId()).orElse(null);
            String authorName = author != null ? author.getName() : "익명";

            // diary_photos → photos 조회로 사진 URL 목록 구성
            List<DiaryPhoto> diaryPhotos = diaryPhotoRepository
                    .findByIdDiaryId(diary.getDiaryId());
            List<String> imageUrls = diaryPhotos.stream()
                    .map(dp -> photoRepository.findById(dp.getId().getPhotoId())
                            .map(Photo::getImageUrl)
                            .orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // diaryContent JSON 파싱 ({"title":"...","subtitle":"...","lines":[...]})
            String title    = "";
            String subtitle = "";
            List<String> lines = Collections.emptyList();
            if (diary.getDiaryContent() != null) {
                try {
                    JsonNode node = objectMapper.readTree(diary.getDiaryContent());
                    title    = node.path("title").asText("");
                    subtitle = node.path("subtitle").asText("");
                    JsonNode linesNode = node.path("lines");
                    if (linesNode.isArray()) {
                        lines = new ArrayList<>();
                        for (JsonNode ln : linesNode) lines.add(ln.asText());
                    }
                } catch (Exception ignored) {
                    // JSON 파싱 실패 시 빈 값으로 처리
                }
            }

            return DiaryFeedItemResponse.builder()
                    .diaryId(diary.getDiaryId())
                    .title(title)
                    .subtitle(subtitle)
                    .diaryLines(lines)
                    .date(diary.getCreatedAt() != null
                            ? diary.getCreatedAt().toLocalDate().toString() : "")
                    .authorName(authorName)
                    .authorId(diary.getUserId())
                    .imageUrls(imageUrls)
                    .imageUrl(imageUrls.isEmpty() ? null : imageUrls.get(0))
                    .roomId(diary.getGroupId())
                    .roomLabel(group != null ? group.getGroupName() : "")
                    .likes(diary.getLikes() != null ? diary.getLikes() : 0)
                    .build();

        }).collect(Collectors.toList());
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
        // 재료 1: VLM 분석 결과 + 결제 매핑 여부
        private String item_name;
        private String category;
        private Integer price;
        private String store_name;
        private String description;
        private Boolean matched;       // 결제 내역 매핑 성공 여부
        // 재료 2: 사용자 감정 데이터
        private String mood;
        private String emotion_text;   // 사용자가 사진과 함께 입력한 텍스트
        // 재료 3: 모임방 특징 정보
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