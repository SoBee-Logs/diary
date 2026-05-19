package com.sobee.sobee.domain.user.service;

import com.sobee.sobee.domain.user.dto.UserRequestDto;
import com.sobee.sobee.domain.user.entity.User;
import com.sobee.sobee.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public void register(UserRequestDto dto) {
        User user = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .gender(dto.getGender())
                .age(dto.getAge())
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);
    }

    public User login(String email, String password) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("이메일이 없습니다."));
    }
}