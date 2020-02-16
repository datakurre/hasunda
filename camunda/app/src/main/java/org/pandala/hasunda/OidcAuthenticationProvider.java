package org.pandala.hasunda;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.rest.security.auth.AuthenticationResult;
import org.camunda.bpm.engine.rest.security.auth.impl.ContainerBasedAuthenticationProvider;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;

/**
 * OAuth2 Authentication Provider for usage with Keycloak and KeycloakIdentityProviderPlugin.
 */
public class OidcAuthenticationProvider extends ContainerBasedAuthenticationProvider {

    @Override
    public AuthenticationResult extractAuthenticatedUser(HttpServletRequest request, ProcessEngine engine) {

        // Extract authentication details
        OAuth2AuthenticationToken authentication = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return AuthenticationResult.unsuccessful();
        }
        DefaultOidcUser userAuthentication = (DefaultOidcUser) authentication.getPrincipal();
        if (userAuthentication == null || userAuthentication.getUserInfo() == null) {
            return AuthenticationResult.unsuccessful();
        }

        // Extract user ID from Keycloak authentication result - which is part of the requested user info
        @SuppressWarnings("unchecked")
        String userId = (userAuthentication.getUserInfo()).getPreferredUsername(); // useUsernameAsCamundaUserId = true
        if (StringUtils.isEmpty(userId)) {
            return AuthenticationResult.unsuccessful();
        }

        // Authentication successful
        AuthenticationResult authenticationResult = new AuthenticationResult(userId, true);
        authenticationResult.setGroups(getUserGroups(userId, engine));

        return authenticationResult;
    }

    private List<String> getUserGroups(String userId, ProcessEngine engine) {
        List<String> groupIds = new ArrayList<>();
        // query groups using KeycloakIdentityProvider plugin
        engine.getIdentityService().createGroupQuery().groupMember(userId).list()
                .forEach(g -> groupIds.add(g.getId()));
        return groupIds;
    }

}

