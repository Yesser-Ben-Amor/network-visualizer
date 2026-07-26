package com.networkninja.backend.auth;

public class LoginResponse {

    private String email;
    private String displayName;
    private boolean success;

    public LoginResponse(String email, String displayName, boolean success) {
        this.email = email;
        this.displayName = displayName;
        this.success = success;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isSuccess() {
        return success;
    }
}
