package com.campusflow.auth.security;

import com.campusflow.auth.entity.UserAccount;

public record AuthenticatedUser(UserAccount user) {
}
