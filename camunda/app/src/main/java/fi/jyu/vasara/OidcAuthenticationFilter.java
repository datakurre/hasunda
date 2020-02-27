package fi.jyu.vasara;

import org.camunda.bpm.engine.IdentityService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


class OidcAuthenticationFilter implements Filter {

    private static final Logger LOG = LoggerFactory.getLogger(OidcAuthenticationFilter.class);

    @Value("${hasura.camunda.secret}")
    private String secret;

    private IdentityService identityService;
    private ClientRegistration clientRegistration;

    private OidcUserService oidcUserService;


    public OidcAuthenticationFilter(ClientRegistration clientRegistration, IdentityService identityService) {
        this.clientRegistration = clientRegistration;
        this.identityService = identityService;

        this.oidcUserService = new OidcUserService();
        this.oidcUserService.setAccessibleScopes(new HashSet<>());  // force UserInfo retrieval
    }

    @Override
    public void doFilter(final ServletRequest request, final ServletResponse response, final FilterChain chain)
            throws IOException, ServletException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof AnonymousAuthenticationToken || authentication == null) {

            HttpServletRequest httpRequest = (HttpServletRequest) request;
            String secret = httpRequest.getHeader("X-Hasura-Camunda-Secret");

            if (!secret.equals(this.secret)) {

                LOG.debug("Approved system user with valid X-Hasura-Camunda-Secret");
                chain.doFilter(request, response);

            } else {

                identityService.clearAuthentication();
                ((HttpServletResponse) response).sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication.");
            }

        } else if (authentication instanceof JwtAuthenticationToken) {
            JwtAuthenticationToken jwtAuthenticationToken = (JwtAuthenticationToken) authentication;
            Jwt token = jwtAuthenticationToken.getToken();

            OAuth2AccessToken accessToken = new OAuth2AccessToken(
                    OAuth2AccessToken.TokenType.BEARER,
                    token.getTokenValue(), token.getIssuedAt(), token.getExpiresAt());

            OidcIdToken idToken = new OidcIdToken(token.getTokenValue(), token.getIssuedAt(), token.getExpiresAt(),
                    token.getClaims());

            // Refresh userInfo from IDP
            OidcUserRequest oidcUserRequest = new OidcUserRequest(this.clientRegistration, accessToken, idToken);
            OidcUser user = this.oidcUserService.loadUser(oidcUserRequest);
            OidcUserInfo userInfo = user.getUserInfo();
            String userId = userInfo.getPreferredUsername();

            LOG.debug("Resolved userId from bearer token: {}", userId);
            identityService.setAuthentication(userId, getUserGroups(userId));
            chain.doFilter(request, response);

        } else if (authentication instanceof OAuth2AuthenticationToken) {

            OAuth2AuthenticationToken oauth2AuthenticationToken  = (OAuth2AuthenticationToken) authentication;
            DefaultOidcUser userAuthentication = (DefaultOidcUser) oauth2AuthenticationToken.getPrincipal();

            OidcUserInfo userInfo = userAuthentication.getUserInfo();
            String userId = userInfo.getPreferredUsername();

            LOG.debug("Extracted userId from bearer token: {}", userId);
            identityService.setAuthentication(userId, getUserGroups(userId));
            chain.doFilter(request, response);

        }
    }

    /**
     * Queries the groups of a given user.
     *
     * @param userId the user's ID
     * @return list of groups the user belongs to
     */
    private List<String> getUserGroups(String userId) {
        List<String> groupIds = new ArrayList<>();
        // query groups using KeycloakIdentityProvider plugin
        identityService.createGroupQuery().groupMember(userId).list()
                .forEach(g -> groupIds.add(g.getId()));
        return groupIds;
    }
}
