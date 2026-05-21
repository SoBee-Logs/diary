package com.sobee.sobee.domain.group.service;

import com.sobee.sobee.domain.group.dto.GroupRequestDto;
import com.sobee.sobee.domain.group.dto.GroupResponseDto;
import com.sobee.sobee.domain.group.entity.Group;
import com.sobee.sobee.domain.group.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;

    public GroupResponseDto createGroup(GroupRequestDto dto) {
        String code = generateCode();
        Group group = Group.builder()
                .groupName(dto.getGroupName())
                .groupDescription(dto.getGroupDescription())
                .groupCode(code)
                .build();
        Group saved = groupRepository.save(group);
        return GroupResponseDto.builder()
                .groupId(saved.getGroupId())
                .groupName(saved.getGroupName())
                .groupDescription(saved.getGroupDescription())
                .groupCode(saved.getGroupCode())
                .build();
    }

    public GroupResponseDto joinGroup(String code) {
        Group group = groupRepository.findByGroupCode(code)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 코드입니다."));
        return GroupResponseDto.builder()
                .groupId(group.getGroupId())
                .groupName(group.getGroupName())
                .groupDescription(group.getGroupDescription())
                .groupCode(group.getGroupCode())
                .build();
    }

    private String generateCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}