package com.pacetrack.modules.auth.service;

import com.pacetrack.common.security.JwtService;
import com.pacetrack.modules.auth.dto.AuthResponse;
import com.pacetrack.modules.auth.dto.LoginRequest;
import com.pacetrack.modules.auth.dto.RegisterRequest;
import com.pacetrack.modules.user.dto.UserResponse;
import com.pacetrack.modules.user.entity.UserEntity;
import com.pacetrack.modules.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered: " + normalizedEmail);
        }

        String encodedPassword = passwordEncoder.encode(request.password());

        UserEntity user = new UserEntity(
                null,
                normalizedEmail,
                encodedPassword,
                request.firstName().trim(),
                request.lastName().trim(),
                "ROLE_USER"
        );

        UserEntity savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);

        return AuthResponse.of(
                token,
                jwtService.getExpirationMs(),
                UserResponse.fromEntity(savedUser)
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        UserEntity user = (UserEntity) authentication.getPrincipal();
        String token = jwtService.generateToken(user);

        return AuthResponse.of(
                token,
                jwtService.getExpirationMs(),
                UserResponse.fromEntity(user)
        );
    }
}
