package com.sobee.sobee.domain.user.controller;

import com.sobee.sobee.domain.user.dto.UserRequestDto;
import com.sobee.sobee.domain.user.entity.User;
import com.sobee.sobee.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserRequestDto dto) {
        userService.register(dto);
        return ResponseEntity.ok("회원가입 성공");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserRequestDto dto) {
        User user = userService.login(dto.getEmail(), null);
        return ResponseEntity.ok("로그인 성공: " + user.getEmail());
    }
}