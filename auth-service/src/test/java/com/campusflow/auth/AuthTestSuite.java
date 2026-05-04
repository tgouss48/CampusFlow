package com.campusflow.auth;

import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

@Suite
@SuiteDisplayName("Auth Service Full Test Suite")
@SelectPackages("com.campusflow.auth")
public class AuthTestSuite {
}
