package com.bidstream.controller;

import com.bidstream.dto.LoginRequestDto;
import com.bidstream.dto.LoginResponseDto;
import com.bidstream.dto.UserRegistrationDto;
import com.bidstream.entity.User;
import com.bidstream.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final com.bidstream.service.AuthService authService;

    public AuthController(UserService userService, com.bidstream.service.AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody UserRegistrationDto registrationDto) {
        User user = userService.registerUser(registrationDto);
        return new ResponseEntity<>(user, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequest) {
        String token = authService.authenticate(loginRequest);
        User user = userService.getUserByEmail(loginRequest.getEmail()).orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(new LoginResponseDto(token, user));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(@Valid @RequestBody com.bidstream.dto.PasswordResetDto resetDto) {
        userService.resetPassword(resetDto);
        return ResponseEntity.ok(java.util.Map.of("message", "Password reset successfully. You can now login."));
    }
}
