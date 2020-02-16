package org.pandala.hasunda;

import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.webapp.impl.security.auth.ContainerBasedAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.util.matcher.*;
import org.springframework.web.context.request.RequestContextListener;

import javax.inject.Inject;
import java.util.Collections;

@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class WebAppSecurityConfig extends WebSecurityConfigurerAdapter {

    @Value("${spring.security.oauth2.client.provider.oidc.issuer-uri}")
    private String issuerUri;

    @Value("${hasura.camunda.secret}")
    private String secret;

    @Inject
    private IdentityService identityService;

    @Inject
    private ClientRegistrationRepository clientRegistrationRepository;

    @Override
    public void configure(WebSecurity web) {
        // Hasura needs to access Camunda GraphQL endpoint without Authorization header
        // during remote schema configuration, but beyond that, requests through Hasura
        // should require Authorization header with Bearer token.
        RequestHeaderRequestMatcher authorizationHeaderRequestMatcher = new RequestHeaderRequestMatcher("Authorization");
        RequestHeaderRequestMatcher secretHeaderRequestMatcher = new RequestHeaderRequestMatcher("X-Hasura-Camunda-Secret", secret);
        RequestHeaderRequestMatcher anonymousRoleHeaderRequestMatcher = new RequestHeaderRequestMatcher("X-Hasura-Role", "anonymous");
        NegatedRequestMatcher noAuthorizationHeaderMatcher = new NegatedRequestMatcher(authorizationHeaderRequestMatcher);
        NegatedRequestMatcher notAnonymousRoleHeaderMatcher = new NegatedRequestMatcher(anonymousRoleHeaderRequestMatcher);
        AntPathRequestMatcher restAntPathRequestMatcher = new AntPathRequestMatcher("/rest/**");
        AntPathRequestMatcher graphqlAntPathRequestMatcher = new AntPathRequestMatcher("/graphql");
        OrRequestMatcher orRequestMatcher = new OrRequestMatcher(restAntPathRequestMatcher, graphqlAntPathRequestMatcher);
        AndRequestMatcher andRequestMatcher = new AndRequestMatcher(noAuthorizationHeaderMatcher, notAnonymousRoleHeaderMatcher, secretHeaderRequestMatcher, orRequestMatcher);
        web
                .ignoring()
                .requestMatchers(andRequestMatcher);
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .csrf().ignoringAntMatchers("/api/**", "/rest/**", "/graphql")
                .and()
                .antMatcher("/**")
                .authorizeRequests()
                .antMatchers("/app/**", "/rest/**", "/graphql")
                .authenticated()
                .and()
                .oauth2Login()
                .and()
                .oauth2ResourceServer()
                .jwt()
                .and()
                .and()
                .oauth2Client();
    }

    @Bean
    JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = (NimbusJwtDecoder) JwtDecoders.fromOidcIssuerLocation(issuerUri);
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
        jwtDecoder.setJwtValidator(withIssuer);
        return jwtDecoder;
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    @Bean
    public FilterRegistrationBean containerBasedAuthenticationFilter() {
        FilterRegistrationBean filterRegistration = new FilterRegistrationBean();
        filterRegistration.setFilter(new ContainerBasedAuthenticationFilter());
        filterRegistration.setInitParameters(Collections.singletonMap("authentication-provider", "org.pandala.hasunda.OidcAuthenticationProvider"));
        filterRegistration.setOrder(101);  // make sure the filter is registered after the Spring Security Filter Chain
        filterRegistration.addUrlPatterns("/app/*");
        return filterRegistration;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    @Bean
    public FilterRegistrationBean tokenBasedAuthenticationFilter() {
        ClientRegistration clientRegistration = this.clientRegistrationRepository.findByRegistrationId("oidc");
        FilterRegistrationBean filterRegistration = new FilterRegistrationBean();
        filterRegistration.setFilter(new OidcAuthenticationFilter(clientRegistration, identityService));
        filterRegistration.setOrder(102); // make sure the filter is registered after the Spring Security Filter Chain
        filterRegistration.addUrlPatterns("/rest/*", "/graphql");
        return filterRegistration;
    }

    @Bean
    public RequestContextListener requestContextListener() {
        return new RequestContextListener();
    }
}
