---
title: Spring Security
date: 2023-10-19 00:00 +09:00
categories: ["springboot", "springsecurity"]
image:
    path: spring.png
    alt: ""
---

# 스프링 시큐리티 구조

![image](https://user-images.githubusercontent.com/30681841/281915263-95634e4a-5d12-4379-be0e-da174a72dc20.png)

기본적인 구조는 위와 같다. 

Thread-Safe 한 Authentication 객체가 SecurityContext 에 저장 된 다음, Session 으로 유지된다. 

![image](https://user-images.githubusercontent.com/30681841/281915841-ed346ab1-6b03-4caa-b4a2-e5f4e984deec.png)

또한, 이미 세션이 있는지 여부를 판단하는 필터를 거친다. 세션이 없다면 새로 생성하고, 있다면 기존 세션값을 사용한다.


스프링 시큐리티는 디폴트로 등록된 13개 필터, 그리고 개발자가 등록한 커스텀 필터를 거쳐서 각종 검사를 진행한다. 해당 과정에서 기본으로는 세션으로 데이터를 보관한다. 

스프링 시큐리티는 클래스 단위로도 설정할 수 있지만, 메서드 단위로도 설정할 수 있다. 

이 때, `프록시 + AOP` 방식을 적용한다. (스프링 프레임워크가 이 방식을 선호하는 것 같다.)

아래의 어노테이션에 해당한다.

```java
@PreAuthorize
@PostAuthorize
@Secured
@RolesAllowed

// 사용하기 위해서는 설정 파일에 선언이 필요하다.
@EnableGlobalMethodSecurity(
  prePostEnabled = ture, 
  securedEnabled = true
)
```

![image](https://user-images.githubusercontent.com/30681841/281917336-2afb6bd7-bfe3-4536-9f91-f25723226a1e.png)

## CORS 설정

다른 도메인에서 자원을 주고 받는 경우, CORS 설정이 필수이다. 

```java
@Configuration
@RequiredArgsConstructor
@Slf4j
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*"); // GET, POST, PUT, DELETE
        // setAllowedOrigins 보다 더 간편한 방법
        // configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.addAllowedOriginPattern("http://localhost:[*]");
        configuration.setAllowCredentials(true);
        configuration.addExposedHeader("Authorization");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
```

`CorsConfigurationSource` 빈을 정의하고,
- `CorsConfiguration` 를 생성해서 헤더, 메서드에 관한 설정을 추가하고
- `UrlBasedCorsConfigurationSource` 에 등록한다.
- 그리고 SecurityFilterChain 에 해당 빈을 등록하면 완성

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(
        securedEnabled = true,
        jsr250Enabled = true
)
@RequiredArgsConstructor
public class SecurityConfig {

    private final CorsConfig corsConfig;
    private final AuthTokenProvider authTokenProvider;
    private final CustomJwtProperties customJwtProperties;
    private final CustomOAuth2Properties customOAuth2Properties;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOidcUserService customOidcUserService;
    private final CustomAuthoritiesMapper customAuthoritiesMapper;
    private final CustomUserDetailsService customUserDetailsService;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
    private final UserRefreshTokenRepository userRefreshTokenRepository;


    @Bean
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {

        // (1) CSRF / disabled
        http.csrf(AbstractHttpConfigurer::disable);

        // (2) CORS
        http.cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()));

        // (3)
        http.authorizeHttpRequests(
                requests -> requests
                        .requestMatchers(
                                "/",
                                "/login"
                        ).permitAll()
                        .anyRequest().authenticated()
        );

        // (4) Session / stateless
        http.sessionManagement(sessionManagementConfigurer ->
                sessionManagementConfigurer
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        // (5) Configure OAuth 2.0 login
        http.oauth2Login(
                login -> login
                        // (5-1) Configure userinfo endpoint provided by the authorization server
                        .userInfoEndpoint(
                                userInfoEndpointConfig ->
                                        userInfoEndpointConfig
                                                .userService(customOAuth2UserService)
                                                .oidcUserService(customOidcUserService)
                                                .userAuthoritiesMapper(customAuthoritiesMapper)
                        )
                        // (5-2) Authorization Endpoint is customizable, currently set to default
                        .authorizationEndpoint(
                                authorizationEndpointConfig ->
                                        authorizationEndpointConfig
                                                // (5-2-1)
                                                .baseUri("/oauth2/authorization")
                                                // (5-2-2) Cookie based authorization respository
                                                .authorizationRequestRepository(oAuth2AuthorizationRequestBasedOnCookieRepository())
                        )
                        // (5-3) Redirection Endpoint is customizable, currently set to default
                        .redirectionEndpoint(
                                redirectionEndpointConfig ->
                                        redirectionEndpointConfig
                                                // (5-3-1)
                                                .baseUri("/*/oauth2/code/*")
                        )
                        // (5-4)
                        // .loginPage("/login")
                        // (5-5) Register success handler
                        .successHandler(oAuth2AuthenticationSuccessHandler())
                        // (5-6) Register failure handler
                        .failureHandler(oAuth2AuthenticationFailureHandler())
        );

        // (6) UserDetailsService
        http.userDetailsService(customUserDetailsService);

        // (7) Logout
//        http.logout(httpSecurityLogoutConfigurer -> httpSecurityLogoutConfigurer
//                .logoutSuccessUrl("/").permitAll()
//                .deleteCookies("JSESSIONID")
//                .invalidateHttpSession(true)
//                .clearAuthentication(true)
//        );

        // (8) Exception Handling
        http.exceptionHandling(httpSecurityExceptionHandler -> httpSecurityExceptionHandler
                // (8-1)
                .accessDeniedHandler(customAccessDeniedHandler)
                // (8-2)
                .authenticationEntryPoint(customAuthenticationEntryPoint)
        );

        // (9) Form Login
        // Can`t find a way to disable this
        http.formLogin(Customizer.withDefaults());

        // (10) Add Filters
        http.addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        // (11) Http Basic / disabled
        http.httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    /**
     * Cookie 기반 Authorization Repository
     */
    @Bean
    public OAuth2AuthorizationRequestBasedOnCookieRepository oAuth2AuthorizationRequestBasedOnCookieRepository() {
        return new OAuth2AuthorizationRequestBasedOnCookieRepository(customJwtProperties);
    }

    /**
     * @return
     */
    @Bean
    public TokenAuthenticationFilter tokenAuthenticationFilter() {
        return new TokenAuthenticationFilter(authTokenProvider);
    }

    /**
     * @return
     */
    @Bean
    public OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler() {
        return new OAuth2AuthenticationSuccessHandler(authTokenProvider,
                userRefreshTokenRepository,
                oAuth2AuthorizationRequestBasedOnCookieRepository(),
                customJwtProperties,
                customOAuth2Properties
        );
    }

    /**
     * @return
     */
    @Bean
    public OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler() {
        return new OAuth2AuthenticationFailureHandler(oAuth2AuthorizationRequestBasedOnCookieRepository(),
                customJwtProperties
        );
    }

}
```


---
## 번외

스프링 시큐리티는 세션을 이용한 보안에 특화되어 있으며, jwt 를 사용하기 위해서는 여러 설정을 바꿔야 한다. 
만약, 외부 인가서버를 둔 채로 jwt 로 모든 인증 정보를 주고 받는다면, 굳이 스프링 시큐리티를 사용할 이유는 없다. 

([관련 실습 깃허브 주소](https://github.com/valorjj/oauth2-backend))