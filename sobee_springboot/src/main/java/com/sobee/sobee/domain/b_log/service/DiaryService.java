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
    private final ObjectMapper objectMapper;

    private static final String FASTAPI_DIARY_URL = "http://localhost:8000/api/diary/generate";
    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional(readOnly = true)
    public DiaryGenerateResponse generateDiary(DiaryGenerateRequest req, Long userId) {

        Group group = groupRepository.findById(req.getGroupId())
                .orElseThrow(() -> new RuntimeException("모임방을 찾을 수 없습니다. groupId=" + req.getGroupId()));

        LocalDate targetDate = LocalDate.parse(req.getDate(), DateTimeFormatter.ISO_LOCAL_DATE);

        List<PhotoGroups> pgList = photoGroupsRepository.findByIdGroupId(req.getGroupId());

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

        List<String> imageUrls = todayPhotos.stream()
                .map(Photo::getImageUrl)
                .collect(Collectors.toList());
        List<Long> photoIds = todayPhotos.stream()
                .map(Photo::getPhotoId)
                .collect(Collectors.toList());

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

        EmotionsText latestEmotion = todayPhotos.stream()
                .map(p -> emotionsTextRepository.findByPhoto(p).orElse(null))
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        String moodEmoji = latestEmotion != null && latestEmotion.getEmoji() != null
                ? latestEmotion.getEmoji().getEmoji()
                : null;

        List<Long> matchedPhotoIds = photoIds.stream()
                .filter(pid -> personaTransactionRepository.existsByPhotoId(pid))
                .collect(Collectors.toList());
        boolean matched = !matchedPhotoIds.isEmpty();

        FastApiDiaryRequest faReq = FastApiDiaryRequest.builder()
                .item_name(bestVlm != null ? bestVlm.getVlmItemName() : null)
                .category(bestVlm != null ? bestVlm.getVlmCategory() : null)
                .price(bestVlm != null && bestVlm.getVlmPriceEstimate() != null
                        ? bestVlm.getVlmPriceEstimate().intValue() : null)
                .store_name(bestVlm != null ? bestVlm.getVlmStoreName() : null)
                .description(bestVlm != null ? bestVlm.getVlmDescription() : null)
                .matched(matched)
                .mood(moodEmoji)
                .emotion_text(latestEmotion != null ? latestEmotion.getText() : null)
                .tags(Collections.singletonList("#" + group.getGroupName()))
                .group_description(group.getGroupDescription())
                .build();

        FastApiDiaryResponse faRes;
        try {
            faRes = callFastApiDiary(faReq);
        } catch (Exception e) {
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

    @Transactional
    public void saveDiary(DiarySaveRequest req, Long userId) {

        Diary diary = Diary.builder()
                .userId(userId)
                .groupId(req.getGroupId())
                .diaryContent(req.getDiaryContent())
                .build();
        diaryRepository.save(diary);

        if (req.getPhotoIds() != null && !req.getPhotoIds().isEmpty()) {
            for (Long photoId : req.getPhotoIds()) {
                DiaryPhoto diaryPhoto = DiaryPhoto.builder()
                        .id(new DiaryPhotoId(photoId, diary.getDiaryId(), userId))
                        .build();
                diaryPhotoRepository.save(diaryPhoto);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<DiaryFeedItemResponse> getDiaryList(Long groupId) {

        List<Diary> diaries = diaryRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        Group group = groupRepository.findById(groupId).orElse(null);

        return diaries.stream().map(diary -> {

            User author = userRepository.findById(diary.getUserId()).orElse(null);
            String authorName = author != null ? author.getName() : "익명";

            List<DiaryPhoto> diaryPhotos = diaryPhotoRepository
                    .findByIdDiaryId(diary.getDiaryId());
            List<String> imageUrls = diaryPhotos.stream()
                    .map(dp -> photoRepository.findById(dp.getId().getPhotoId())
                            .map(Photo::getImageUrl)
                            .orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

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
                } catch (Exception ignored) {}
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

    @Transactional
    public void toggleLike(Long diaryId) {
        Diary diary = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new RuntimeException("일기를 찾을 수 없습니다."));
        int current = diary.getLikes() != null ? diary.getLikes() : 0;
        diary.setLikes(current + 1);
        diaryRepository.save(diary);
    }

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
        private Boolean matched;
        private String mood;
        private String emotion_text;
        private List<String> tags;
        private String group_description;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    static class FastApiDiaryResponse {
        private String title;
        private String subtitle;
        private List<String> diary_lines;
        private List<String> tags;
    }
}