package com.clinic.booking.infrastructure.config;

import com.clinic.booking.application.repository.UserRepository;
import com.clinic.booking.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordMigrationService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting password migration check...");

        Iterable<User> users = userRepository.findAll();
        boolean migrated = false;

        for (User user : users) {
            String passwordHash = user.getPasswordHash();

            if (passwordHash != null && !passwordHash.startsWith("$2a$") && !passwordHash.startsWith("$2b$") && !passwordHash.startsWith("$2y$")) {
                log.info("Migrating password for user: {}", user.getEmail());
                String encodedPassword = passwordEncoder.encode(passwordHash);
                user.setPasswordHash(encodedPassword);
                userRepository.save(user);
                migrated = true;
            }
        }

        if (migrated) {
            log.info("Password migration completed");
        } else {
            log.info("No passwords needed migration");
        }
    }
}
