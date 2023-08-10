---
title: OAuth 2.0 Login 구현 - 1
date: 2023-08-04 00:00 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["client", "login"]
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

순서
- OAuth 2.0 Loing Page 생성
- Authorization Code 요청
- Access Token 교환
- OAuth 2.0 User 모델 
- OAuth 2.0 Provider UserInfo 엔드포인트 요청
- OpenID Connect Provider OidcUserInfo 엔드포인트 요청
- OpenID Connect 로그아웃
- Spring MVC 인증 객체 참조
- API 커스텀 설정

## OAuth 2.0 Loing Page 생성

로그인 페이지는 별도로 지정하지 않아도 `DefaultLoginPageGeneratingFilter` 가 기본적으로 생성해준다. 

요청 URL
- `/oauth2/authorization/${registrationId}`

> 질문. React.js 로 프론트 서버를 구성하면 url 을 어떻게 보내야할까?
{: .prompt-warning }

## Authorization Code 요청

`DefaultOAuth2AuthorizationRequestResolver`
- `OAuth2AuthorizationRequest` 를 최종적으로 완성시킨다. 
- `/oauth2/authorization/${registrationId}` 와 일치하면, ***${registrationId}*** 를 추출하고, 이를 사용해 ClientRegistration 을 가져온다.
  - OAuth2AuthorizationRequest 를 빌드한다.

`OAuth2AuthorizationRequest`
-  token endpoint 요청 파라미터를 가지고 있는 객체
-  인가 응답을 연계하고, 검증할 때 사용된다.

`OAuth2AuthorizationRequestRepository`
- 인가 요청을 시작한 시점 ~ 인가 요청을 받는 시점
- (redirect) `OAuth2AuthorizationRequest` 를 유지한다.

![code](oauth2/code_request.png)

> vite 로 빌드한 localhost:5173 에서 요청을 보내고 인증을 받으려면 어떻게하지?
{: .prompt-warning }

> filter 에 지정된 url 이 아닌 경우
{: .prompt-tip }

`OAuth2AuthorizationRequest` -> `LoginUrlAuthenticationEntrypoint.java` 로 인해서 결국 `redirectUrl`(`http://localhost:8081/oauth2/login/code/keycloak`) 로 이동해서 인증을 받게 된다.

해당 방식은 ***authorization code*** 방식일 때만 redirectUrl 이 초기화된다. 
`/oauth2/authorization/${registrationId}`



## Access Token 교환

`OAuth2LoginAuthenticationFilter`
- `OAuth2LoginAuthenticationToken` 을 `AuthenticationManager` 에게 위임
- UserInfo 정보를 요청해서 최종 사용자에 로그인한다.
- `OAuth2AuthorizedClientRepository` 를 사용, `OAuth2AuthorizedClient` 를 저장한다.
- 인증에 성공한 경우
  - `OAuth2LoginAuthenticationToken` 이 `SecurityContext` 에 저장되어 인증 처리 완료
  - token 을 전역적으로 사용한다.
- **요청 매핑 url**
  - RequestMatcher: `/login/oauth2/code/*`

`OAuth2LoginAuthenticationProvider` 
- scope 에 openid 가 포함된 경우, `OidcAuthorizationCodeAuthenticationPRovider` 호출
- 아닌 경우 `OAuth2AuthorizationCodeAuthenticationProvider` 호출

`OAuth2AuthorizationCodeAuthenticationProvider`
- 권한 코드 부여 흐름을 처리한다.
- 인가서버에 Authorization Code 와 Access Token 교환을 담당한다.

`OidcAuthenticationCodeAuthenticationProvider` 
- OpenID Connect Core 1.0 권한 코드 부여 흐름을 처리하는 AuthenticationProvider 이다.
- scope 에 openid 가 포함된 경우 실행된다.

DefaultAuthorizationCodeTokenResponseClient
- 인가서버의 token 엔드 포인트로 통신을 담당한다.
- Access Token 을 받고, OAuth2AccessTokenResponse 에 저장하고 반환한다.

![oauth2_provider](oauth2/access_token_request.png)

![flow](oauth2/access_token_flow.png)

## OAuth 2.0 User 모델 

> Access Token 을 사용해서 UserInfo 엔드포인트 요청으로 <br/>
> 최종 사용자(= 리소스 소유자) 속성을 가져오며, OAuth2User 타입의 객체를 리턴한다.
{: .prompt-info }

`DefaultOAuth2UserService`
- 표준 OAuth 2.0 Provider 를 지원하는 OAuth2UserService 구현체이다.
- OAuth2UserRequest 에 Access Token 을 담아, 인가서버와 통신하고 사용자 속성을 가지고 온다.
- 최종 `OAuth2User` 타입의 객체를 반환한다

`OidcUserService`
- OpenID Connect 1.0 Provider 를 지원하는 OAuth2UserService 구현체이다.
- OidcUserRequest 에 있는 ID Token 을 통해서 인증처리를 한다.
- 필요 시 DefaultOAuth2UserService 를 사용해서 UserInfo 엔드포인트의 사용자 속성을 요청한다.
- 최종 `OidcUser` 타입의 객체를 반환한다.

![service](oauth2/oauth2_service_flow.png)


`OAuth2User`
- OAuth 2.0 Provider 에 연결된 사용자 주체를 나타낸다.
- 최종 사용자의 인증에 대한 정보인 `Attributes` 를 포함한다.
  - first name, middle name, last name, email, phone number, address 등
- 기본 구현체는 `DefaultOAuth2User`
  - Authentcation 의 principal 속성에 저장

`OidcUser`
- OAuth2User 를 상속한 인터페이스
  - OIDC Provider 에 연결된 사용자 주체
- 최종 사용자의 인증에 대한 정보인 `Claims` 를 포함
  - OidcIdToken 및 OidcUserInfo
- 기본 구현체는 `DefaultOidcUser`
  - Authentication 의 principal 속성에 저장

![user](oauth2/oauth2_user.png)

![user_st](oauth2/oauth2_user_structure.png)

OAuth 2.0 로그인을 통해 인증받은 사용자의 Principal 에는 OAuth2User 혹은 OidcUser 타입의 객체가 저장된다. 


> 스프링 시큐리티가 OAuth 2.0 로그인을 처리하는 내부적인 과정
{: .prompt-warning }

![flow](oauth2/oauth2_provider_userinfo.png)

`DefaultOAuth2User` 객체를 살펴보면,
- authorities
- attributes
- nameAttribueKey

위 3가지의 속성이 반드시 필요하다. 

소셜 로그인을 하면, google, naver, kakao, github 에서 받아오는 attributes, nameAttributeKey 가 모두 다른 형태를 띄고있다. 따라서 다양한 유저를 통합적으로 관리하기 위해서 위 3가지의 속성을 기준으로 묶어주는 작업이 필요하다. (추후 소셜 로그인 시 기술)

> 가장 큰 차이점
{: .prompt-tip }

`OidcUser` 는 `Claims` 과 `Id Token` 을 가지고 있다. 


토큰을 교환하는 과정은 스프링 시큐리티가 지원해주기 때문에 개발자가 직접 작성하지 않아도 이루어지지만, 학습 목적으로 기록한다.

```java

private final ClientRegistartionRepository clientRegistartionRepository;

@GetMapping("/user")
public OAuth2User user(String accessToken) {
  ClientRegistration clientRegistration = clientRegistrationRepository.findByRegistrationId("keycloak");
  OAuth2AccessToken accessToken = 
    new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, Instant.now(), Intstant.MAX);

  OAuth2UserRequest oauth2Request = new OAuth2UserRequest(clientRegistration, accessToken);
  DefaultOAuth2UserService oauth2Service = new DefaultOAuth2UserService();
  OAuth2User oauth2User = oauth2Service.loadUser(oauth2Request);

  return oauth2User;
}
```

```bash
# postman, swaggerui, 인텔리제이에서 지원하는 HttpRequest 등 본인이 편한대로 http 요청을 보내본다.
# 다만, 해당 과정은 로그인 화면에서 아이디, 비밀번호를 입력하지 않기 위함이므로
# keycloak -> realm -> client -> settings -> consent required 를 off 해줘야 진행가능하다.
curl -d "grant_type=password&client_id=클라이언트이름&client_serect=클라이언트시크릿&username=유저이름&password=유저패스워드&scope=profile email" \
-H "Content-Type: application/x-www-form-urlencoded" \
-X POST http://localhost:8080/realm/oauth2/protocol/openid-connect/token
```

```http
POST http://localhost:8080/realm/oauth2/protocol/openid-connect/token?grant_type=password&client_id=${클라이언트이름}&client_serect=${클라이언트시크릿}&username=${유저이름}&password=${유저비밀번호}&scope=profile email
```


위 요청을 날리면, 응답으로 *access_token* 을 받는다. 위에서 생성한 `/user` 로 요청을 보내보자. 

```http
GET http://localhost:8081/user?accessToken=${받아온 엑세스 토큰 값}
```

유저 정보를 받아오는데, `nameAttributeKey` 가 없으면 오류가 발생한다. 해당 값은 `provider.keycloak.user-name-attribute: preferred_useranme` 에서 설정한 값을 가져온다.

위와 동일한 요처엥서 scope=openid profile email 로 변경하면, 추가적으로 id_token 이 포함되어 있다. 

```java
@GetMapping("/oidc")
public OAuth2User oidc(String accessToken, String idToken) {

  ClientRegistration clientRegistration = clientRegistrationRepository.findByRegistrationId("keycloak");

  OAuth2AccessToken oauth2AccessToken = 
    new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, Instant.now(), Intstant.MAX);

  Map<String, Object> idTokenCliams = new HashMap<>();

  idTokenCliams.put(IdTokenClaims.ISS, "http://localhost:8080/realms/oauth2");
  idTokenCliams.put(IdTokenClaims.SUB, "OIDC");
  idTokenCliams.put("preferred_username", "user");

  OidcIdToken oidcIdTokne = new OidcIdToken(idToken, Instant.now(), Instant.MAX, idTokenCliams);

  OidcUserRequest oidcUserRequest = new OidcUserRequest(clientRegistration, oauth2AccessToken, oidcIdToken);
  OidcUserService oidcUserService = new OidcUserService();
  OAuth2User oauth2User = oidcUserService.loaduser(oauth2UserRequest);

  return oauth2User;
}
```

`OidcUserService`
```java
@Override
pulbic OidcUser loadUser(OidcUserRequest userRequest) throw OAuth2AuthenticationException {
  Assert.notNull(userRequest, "userRequest cannot be null");

  // id token 으로 다시 한번 인가 서버와 통신을 하는지 분기점
  if (this.shouldRetreiveUserInfo(userRequest)) {
    OAuth2User oauth2User = this.oauth2UserService.loadUser(userRequest);
    // Claim 들을 가져오기 위한 과정이라고 볼 수 있다.
    Map<String, Object> claims = getClaims(userRequest, oauth2User);
    userInfo = new OidcUserInfo(claims); 
  }

}
``` 


## OAuth 2.0 Provider UserInfo 엔드포인트 요청

![info](oauth2/oauth2_userinfo.png)


중요 클래스
`OAuth2AuthorizedClient`
`OAuth2AuthenticationToken`


## OpenID Connect Provider OidcUserInfo 엔드포인트 요청

![oidc](oauth2/oidc_userinfo.png)

*ID Token* 을 검증하는 단계에서 `JwtDecoder` 가 사용된다. 유효성 검증에 성공해야만 OidcIdToken 을 생성하고 `OidcUserService` 로 전달되는 인증 과정이 이어진다. 

`OidcUserService` 는 _OIDC 사양에 부합하는 Scope_ 가 포함되어 있는지 확인하고, 없다면 바로 인증을 진행한다. 만약 Scope 가 존재한다면 인가서버의 UserInfo 엔드포인트로 요청을 보낸다.


`DefaultOAuth2UserService` 는 UserInfo 엔드포인트에 요청을 날려서 user attributes 를 얻어오는 역할을 담당한다.

> Attributes names 가 표준이 없어, 서비스를 제공하는 어플리케이션의 API 문서를 잘 읽어보아야 한다고 경고를 날린다.
{: .prompt-danger }

`public OAuth2User loaduser(OAuth2UserReqeust userRequest){}` 메서드의 몇 가지만 살펴보자.

`userNameAttributeName` 을 가져오는 부분

```java
String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails().getUserInfoEndpoint()
    .getUserNameAttributeName();
if (!StringUtils.hasText(userNameAttributeName)) {
  OAuth2Error oauth2Error = new OAuth2Error(MISSING_USER_NAME_ATTRIBUTE_ERROR_CODE,
      "Missing required \"user name\" attribute name in UserInfoEndpoint for Client Registration: "
          + userRequest.getClientRegistration().getRegistrationId(),
      null);
  throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString());
}
```

OAuth2UserRequest 를 RequestEntity 로 변환 후 getResponse() 메서드를 통해 인가 서버에 UserInfo 를 요청한다. 받아온 정보는 다음 객체에 담긴다.

`Map<String, Object> userAttributes = response.getBody();`

아래는 이후에 이어지는 권한을 맵핑하는 코드이다. 

```java
Map<String, Object> userAttributes = response.getBody();
		Set<GrantedAuthority> authorities = new LinkedHashSet<>();
		authorities.add(new OAuth2UserAuthority(userAttributes));
		OAuth2AccessToken token = userRequest.getAccessToken();
		for (String authority : token.getScopes()) {
			authorities.add(new SimpleGrantedAuthority("SCOPE_" + authority));
		}
		return new DefaultOAuth2User(authorities, userAttributes, userNameAttributeName);
```


### OIDC Scope

scope | desc
--- | ---
openid | 필수
profile | 기본 프로필 클레임에 대한 엑세스 요청
email | 이메일 및 email verfied 클레임에 대한 엑세스 요청
address | 주소 클레임에 대한 요청
phone | phone_number 및 phone_number_verified 에 대한 엑세스 요청

![endpoint](oauth2/userinfo_endpoint.png)


## OpenID Connect 로그아웃

- 클라이언트는 로그아웃 엔드포인트를 통해서 웹 브라우저가 가지고 있는 세션, 쿠키를 지운다. 
- 클라이언트 로그아웃 이후 OidcConfidentialLogoutSuccessHandler 를 호출해서 OpenID Provider 세션 로그아웃 처리를 요청한다.
- OpenID Provider 로그아웃이 성공하면, 지정한 redirect url 로 이동한다.
- 인가서버 메타데이터 사양에는 end_session_endpoint 로 지정되어 있다.
  - `http://localhost:8080/realms/oauth2/protocol/openid-connect/logout`


```java
@Configuration
@RequiredArgsConstructor
public class OAuth2ClientConfig {

    private final ClientRegistrationRepository clientRegistrationRepository;
    private final CustomOAuth2MemberService customOAuth2MemberService;
    // private final CustomOidcMemberService customOidcMemberService;

    @Bean
    public SecurityFilterChain oauth2SecurityFilterChain(HttpSecurity http) throws Exception {

        http.oauth2Login(o -> o.userInfoEndpoint(u -> u.userService(customOAuth2MemberService)));
        http.logout(l -> l.logoutSuccessHandler(oidcLogoutSuccessHandler())
                .invalidateHttpSession(true).clearAuthentication(true)
                .deleteCookies("JSESSIONID"));

        return http.build();
    }

    private LogoutSuccessHandler oidcLogoutSuccessHandler() {

        OidcClientInitiatedLogoutSuccessHandler successHandler = new OidcClientInitiatedLogoutSuccessHandler(clientRegistrationRepository);
        successHandler.setPostLogoutRedirectUri("http://localhost:8081/login");

        return successHandler;
    }
}
```

## Spring MVC 인증 객체 참조

`Authentication`

`@AuthenticationPrincipal`
- AuthenticationPrincipalArgumentResovler 가 바인딩 작업을 담당한다.


```java

@GetMapping("/user")
public OAuth2User user(Authentication authentication) {
    OAuth2AuthenticationToken auth = (OAuth2AuthenticationToken) authentication;
    OAuth2User oAuth2User = (OAuth2User) auth.getPrincipal();
    return oAuth2User;

}


@GetMapping("/oauth2User")
public OAuth2User getOAuth2User(@AuthenticationPrincipal OAuth2User oAuth2User) {


  return oAuth2User;
}



@GetMapping("/oidcUser")
public OidcUser getOAuth2User(@AuthenticationPrincipal OidcUser oidcUser) {
  
  return oidcUser;

}
``` 



## API 커스텀 설정



## AuthorizationEndpoint

> 권한 부여 BaseURI 를 커스텀 한다.
{: .prompt-info }


## RedirectionEndpoint

OAuth2LoginAuthenticationFilter 에서 요청에 대한 매칭여부를 판단한다. 
- application.yml 에서 registration 의 redirect-uri 설정에 적용한다.
- 인가서버에서도 redirectUri 를 적용시켜야한다.
  
loginProcessingUrl("/login/v1/oauth2/code") 를 설정해도 결과는 동일하다. 하지만 redirectEndpoint.baseUri 가 우선적으로 적용된다. 


![redirect](oauth2/redirection.png)


## SecurityFilterChain - access 변경 사항

.access() 메서드에 관한 설명이 구글 검색이 부족해서, 스프링 시큐리티 공식 문서를 찾아보았다.

`authorizeHttpRequests` 가 String SpEL 을 지원하지 않기 때문에, `AuthorizationManager` 를 사용하거나 `WebExpressionAuthorizatioManager` 를 사용하라고 한다.

> access 내에서 anyOf, anyAll, anyOf(hasRole("...")) 등은 인텔리제이를 사용한다면 static import 를 하라고 알려준다.
{: .prompt-danger }

```java
// (1) AuthorizationManager
http
    .authorizeHttpRequests((authorize) -> authorize
        .shouldFilterAllDispatcherTypes(false)
        .mvcMatchers("/complicated/**").access(anyOf(hasRole("ADMIN"), hasAuthority("SCOPE_read"))
        // ...
        .anyRequest().denyAll()
    )
    // ...


// (2)  WebExpressionAuthorizationManager
http
    .authorizeRequests((authorize) -> authorize
        .filterSecurityInterceptorOncePerRequest(true)
        .mvcMatchers("/complicated/**").access(
			new WebExpressionAuthorizationManager("hasRole('ADMIN') || hasAuthority('SCOPE_read')")
        )
        // ...
        .anyRequest().denyAll()
    )
    // ...

```

스프링 시큐리티 기본적으로 권한은 ROLE_ 로 시작하도록 디폴트 값이 지정되어 있다. 이를 변경하는 방법은 `GrantedAuthorityDefauls` 을 수정하면 된다. 수정하면, hasRole 이 아니라 hasAuthority 를 사용한다. 

또한 OAuth 2.0 는 다양한 플랫폼의 유저의 인증, 인가 과정을 통합 관리하는 것이 목표인데, 저마다 scope 를 보내는 방식이 다르기 때문에 OAuth2User 혹은 OidcUser 로 인증 객체가 생성되는 과정에서, 권한 명칭을 수정해서 넣어주는 mapper 클래스가 꼭 필요하다.

```java

@Bean
public GrantedAuthorityDefaults grantedAuthorityDefaults() {
    return new GrantedAuthorityDefaults("MYPREFIX_");
}

```

그리고 아마 가장 최신 버전인 스프링 시큐리티를 사용한다면, path url 을 적는 곳에서 오류가 발생했을 확률이 있다. 에러 메시지를 살펴보면, 안에 적혀있는 값이 단순 스트링인지 mvc 패턴인지 확인할 수가 없다는 것이다.

공식 문서는 다음과 같이 샘플을 던져준다.

```java
@Configuration
@EnableWebSecurity
@EnableWebMvc
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, HandlerMappingIntrospector introspector) throws Exception {
        MvcRequestMatcher.Builder mvcMatcherBuilder = new MvcRequestMatcher.Builder(introspector).servletPath("/path");
        http
            .authorizeHttpRequests((authz) -> authz
                .requestMatchers(mvcMatcherBuilder.pattern("/admin")).hasRole("ADMIN")
                .requestMatchers(mvcMatcherBuilder.pattern("/user")).hasRole("USER")
                .anyRequest().authenticated()
            );
        return http.build();
    }

}
```

스택오버플로우에서는 아래와 같이 약간 수정해서 사용하는 걸 권하는 게시글을 발견했다.
```java

// prototype 으로 아예 bean 으로 등록해서 사용한다.
@Scope("prototype")
@Bean
public Builder mvc(HandlerMappingIntrospector introspector) {
    return new Builder(introspector);
}

@Bean
public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http, Builder mvc) throws Exception {

  // url 필터
  http.authorizeHttpRequests(r -> r
        
    // 모든 접근을 허용한다.
    .requestMatchers(
        mvc.pattern("/api/v1/member/register"),
        mvc.pattern("/api/v1/member/login"),
        mvc.pattern("/api/v1/member/find/*"),
        mvc.pattern("/"),
        mvc.pattern("/index"),
        mvc.pattern("/login")
    ).permitAll()

  );

}


```



## google 로그인 구현

google 은 이미 스프링 프레임워크에 필요한 정보가 있다.

`CommonOAuth2Provider.java` 를 열어보면 확인 가능하다. 해당 인가서버에 토큰 및 유저 정보를 요청하는 등 엔드 포인트를 개발자가 application.yml 에 매번 넣어주지 않아도 이미 정의된 값을 사용함을 알 수 있다. 

```java
public enum CommonOAuth2Provider {

	GOOGLE {

		@Override
		public Builder getBuilder(String registrationId) {
			ClientRegistration.Builder builder = getBuilder(registrationId,
					ClientAuthenticationMethod.CLIENT_SECRET_BASIC, DEFAULT_REDIRECT_URL);
			builder.scope("openid", "profile", "email");
			builder.authorizationUri("https://accounts.google.com/o/oauth2/v2/auth");
			builder.tokenUri("https://www.googleapis.com/oauth2/v4/token");
			builder.jwkSetUri("https://www.googleapis.com/oauth2/v3/certs");
			builder.issuerUri("https://accounts.google.com");
			builder.userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo");
			builder.userNameAttributeName(IdTokenClaimNames.SUB);
			builder.clientName("Google");
			return builder;
		}

	},

	GITHUB {

		@Override
		public Builder getBuilder(String registrationId) {
			ClientRegistration.Builder builder = getBuilder(registrationId,
					ClientAuthenticationMethod.CLIENT_SECRET_BASIC, DEFAULT_REDIRECT_URL);
			builder.scope("read:user");
			builder.authorizationUri("https://github.com/login/oauth/authorize");
			builder.tokenUri("https://github.com/login/oauth/access_token");
			builder.userInfoUri("https://api.github.com/user");
			builder.userNameAttributeName("id");
			builder.clientName("GitHub");
			return builder;
		}

	},

	FACEBOOK {

		@Override
		public Builder getBuilder(String registrationId) {
			ClientRegistration.Builder builder = getBuilder(registrationId,
					ClientAuthenticationMethod.CLIENT_SECRET_POST, DEFAULT_REDIRECT_URL);
			builder.scope("public_profile", "email");
			builder.authorizationUri("https://www.facebook.com/v2.8/dialog/oauth");
			builder.tokenUri("https://graph.facebook.com/v2.8/oauth/access_token");
			builder.userInfoUri("https://graph.facebook.com/me?fields=id,name,email");
			builder.userNameAttributeName("id");
			builder.clientName("Facebook");
			return builder;
		}

	},

	OKTA {

		@Override
		public Builder getBuilder(String registrationId) {
			ClientRegistration.Builder builder = getBuilder(registrationId,
					ClientAuthenticationMethod.CLIENT_SECRET_BASIC, DEFAULT_REDIRECT_URL);
			builder.scope("openid", "profile", "email");
			builder.userNameAttributeName(IdTokenClaimNames.SUB);
			builder.clientName("Okta");
			return builder;
		}

	};

	private static final String DEFAULT_REDIRECT_URL = "{baseUrl}/{action}/oauth2/code/{registrationId}";

	protected final ClientRegistration.Builder getBuilder(String registrationId, ClientAuthenticationMethod method,
			String redirectUri) {
		ClientRegistration.Builder builder = ClientRegistration.withRegistrationId(registrationId);
		builder.clientAuthenticationMethod(method);
		builder.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE);
		builder.redirectUri(redirectUri);
		return builder;
	}

	/**
	 * Create a new
	 * {@link org.springframework.security.oauth2.client.registration.ClientRegistration.Builder
	 * ClientRegistration.Builder} pre-configured with provider defaults.
	 * @param registrationId the registration-id used with the new builder
	 * @return a builder instance
	 */
	public abstract ClientRegistration.Builder getBuilder(String registrationId);

}

```

로그인 요청 시, 아래 클래스가 가장 처음 받는다.

```java
public class OAuth2AuthorizationRequestRedirectFilter extends OncePerRequestFilter {

  // 구글로 요청 시, /oauth2/authorization/google
  // 키클록 요청 시, /oauth2/authorization/keycloak
  // 네이버 요청 시, /oauth2/authorization/naver
  // 깃허브 요청 시, /oauth2/authorization/github
  // 카카오 요청 시, /oauth2/authorization/kakao

  public static final String DEFAULT_AUTHORIZATION_REQUEST_BASE_URI 
    = "/oauth2/authorization";

  private OAuth2AuthorizationRequestResolver authorizationRequestResolver;

  private AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository = new HttpSessionOAuth2AuthorizationRequestRepository();

  private RequestCache requestCache = new HttpSessionRequestCache();

}
```

`/oauth2/authorization` 인 url 요청을 받을 시 필터가 동작한다. `doFilterInternal` 은 다음과 같다.

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
    throws ServletException, IOException {
  try {
    OAuth2AuthorizationRequest authorizationRequest = this.authorizationRequestResolver.resolve(request);
    if (authorizationRequest != null) {
      // 해당 메서드로 요청을 보낸다.
      this.sendRedirectForAuthorization(request, response, authorizationRequest);
      return;
    }
  }
  catch (Exception ex) {
    this.unsuccessfulRedirectForAuthorization(request, response, ex);
    return;
  }
  try {
    filterChain.doFilter(request, response);
  }

  // ..
}
```

`sendRedirectForAuthorization` 가 요청을 받아서 처리하는데, 

```java
private void sendRedirectForAuthorization(HttpServletRequest request, HttpServletResponse response,
    OAuth2AuthorizationRequest authorizationRequest) throws IOException {
  if (AuthorizationGrantType.AUTHORIZATION_CODE.equals(authorizationRequest.getGrantType())) {
    this.authorizationRequestRepository.saveAuthorizationRequest(authorizationRequest, request, response);
  }
  this.authorizationRedirectStrategy.sendRedirect(request, response,
      authorizationRequest.getAuthorizationRequestUri());
}
```

`AuthorizationGrantType.AUTHORIZATION_CODE` 는
```java
public static final AuthorizationGrantType AUTHORIZATION_CODE = new AuthorizationGrantType("authorization_code");
```
이고, `application.yml` 에서 설정한 값이 authorization_code 인지 확인한다.

userRequest 는 `application.yml` 에 설정한 값이 포함되어 http request 를 인가서버에 전송한다. 인가서버는 정상적으로 처리되면 클라이언트에게 인증 정보(=Id Token)를 담아서 redirect uri 로 응답한다.

`AbstractAuthenticationProcessingFilter` 가 인가서버의 응답(=id token)을 받는다. 해당 필터는 다시 인가서버에 _access token_ 을 요청한다. 이는 `OAuth2LoginAuthenticationFilter` 로 전달된다. 그리고  `OAuth2LoginAuthenticationProvider` 로 전달된다. 

그리고 JWT 안에 담긴 정보를 `JwtDecoder` 에서 검증하게 된다. 스프링 시큐리티에서는 `NimbusJwtDecoder` 를 기본적으로 사용한다.

`createOidcToken`
```java
private OidcIdToken createOidcToken(ClientRegistration clientRegistration,
    OAuth2AccessTokenResponse accessTokenResponse) {
  JwtDecoder jwtDecoder = this.jwtDecoderFactory.createDecoder(clientRegistration);
  Jwt jwt = getJwt(accessTokenResponse, jwtDecoder);
  OidcIdToken idToken = new OidcIdToken(jwt.getTokenValue(), jwt.getIssuedAt(), jwt.getExpiresAt(),
      jwt.getClaims());
  return idToken;
}
```

`getJwt`

```java
private Jwt getJwt(OAuth2AccessTokenResponse accessTokenResponse, JwtDecoder jwtDecoder) {
  try {
    Map<String, Object> parameters = accessTokenResponse.getAdditionalParameters();
    return jwtDecoder.decode((String) parameters.get(OidcParameterNames.ID_TOKEN));
  }
  catch (JwtException ex) {
    OAuth2Error invalidIdTokenError = new OAuth2Error(INVALID_ID_TOKEN_ERROR_CODE, ex.getMessage(), null);
    throw new OAuth2AuthenticationException(invalidIdTokenError, invalidIdTokenError.toString(), ex);
  }
}
```

`JwtDecoder` 의 구현체로 `NimbusJwtDecoder` 가 사용된다. `decode`, `parse`, `validate` 등의 중요한 로직을 확인할 수 있다.

```java
public final class NimbusJwtDecoder implements JwtDecoder {

  // (1)
  @Override
  public Jwt decode(String token) throws JwtException {
    JWT jwt = parse(token);
    if (jwt instanceof PlainJWT) {
      this.logger.trace("Failed to decode unsigned token");
      throw new BadJwtException("Unsupported algorithm of " + jwt.getHeader().getAlgorithm());
    }
    Jwt createdJwt = createJwt(token, jwt);
    return validateJwt(createdJwt);
  }
}
  // (2)
	private JWT parse(String token) {
		try {
			return JWTParser.parse(token);
		}
		catch (Exception ex) {
			this.logger.trace("Failed to parse token", ex);
			throw new BadJwtException(String.format(DECODING_ERROR_MESSAGE_TEMPLATE, ex.getMessage()), ex);
		}
	}


  // (3)
  private Jwt createJwt(String token, JWT parsedJwt) {
		try {
			// Verify the signature
			JWTClaimsSet jwtClaimsSet = this.jwtProcessor.process(parsedJwt, null);
			Map<String, Object> headers = new LinkedHashMap<>(parsedJwt.getHeader().toJSONObject());
			Map<String, Object> claims = this.claimSetConverter.convert(jwtClaimsSet.getClaims());
			// @formatter:off
			return Jwt.withTokenValue(token)
					.headers((h) -> h.putAll(headers))
					.claims((c) -> c.putAll(claims))
					.build();
			// @formatter:on
		} catch ( ... ) {}


  // (4)
  private Jwt validateJwt(Jwt jwt) {
		OAuth2TokenValidatorResult result = this.jwtValidator.validate(jwt);
		if (result.hasErrors()) {
			Collection<OAuth2Error> errors = result.getErrors();
			String validationErrorString = getJwtValidationExceptionMessage(errors);
			throw new JwtValidationException(validationErrorString, errors);
		}
		return jwt;
	}
```


`JWTParser`
```java
public static JWT parse(final String s)
  throws ParseException {

  final int firstDotPos = s.indexOf(".");
  
  if (firstDotPos == -1)
    throw new ParseException("Invalid JWT serialization: Missing dot delimiter(s)", 0);
    
  Base64URL header = new Base64URL(s.substring(0, firstDotPos));
  
  Map<String, Object> jsonObject;

  try {
    jsonObject = JSONObjectUtils.parse(header.decodeToString());

  } catch (ParseException e) {

    throw new ParseException("Invalid unsecured/JWS/JWE header: " + e.getMessage(), 0);
  }

  Algorithm alg = Header.parseAlgorithm(jsonObject);

  // 알고리즘에 따라서 parse 전략이 나뉜다.
  if (alg.equals(Algorithm.NONE)) {
    return PlainJWT.parse(s);
  } else if (alg instanceof JWSAlgorithm) {
    return SignedJWT.parse(s);
  } else if (alg instanceof JWEAlgorithm) {
    return EncryptedJWT.parse(s);
  } else {
    throw new AssertionError("Unexpected algorithm type: " + alg);
  }
}

```

`SignedJWT`
헤더(parts[0]), 페이로드(parts[1]), 시그니처(parts[2])가 담긴다.

```java
@ThreadSafe
public class SignedJWT extends JWSObject implements JWT {

	public static SignedJWT parse(final String s)
		throws ParseException {

		Base64URL[] parts = JOSEObject.split(s);

		if (parts.length != 3) {
			throw new ParseException("Unexpected number of Base64URL parts, must be three", 0);
		}

		return new SignedJWT(parts[0], parts[1], parts[2]);
	}

}

```

(회원가입인 경우) `JwtDecoder` 를 통해서 검증이 끝난 뒤 인가서버에서 보낸 정보가 담긴 `OAuth2User` 혹은 `OidcUser` 등 관련 객체에서 정보를 빼내서 사용할 수 있다.

`OAuth2User.getAttributes()` 로 Map 으로 받아서 분기점을 나뉘어 필요한 DB 에 저장, 프론트에 보낼 데이터 가공 등의 필요한 비즈니스 로직을 작성하면 된다. 



### github 추가

> google, naver, keycloak 작동확인 후 github 를 추가해보았다.
{: .prompt-info }

1. application.yml 에 `security/oauth2/client/registration` 에 필요한 정보를 등록한다.
  - client-id, client-name, client-secret, redirect-uri, scope 이다.
  - scope 가 조금 특이한데, github oauth2 app 관련 문서를 꼼꼼하게 읽어봐야 한다.
  - 단순히 user 에 대한 정보를 가져오는 경우 read:user
  - 디버깅하며 체크해보니 email 정보가 없어 user:email 스코프를 추가했다.
  - common provider 에 등록되어 있기 때문에 provider 는 설정할 필요가 없다.
2. 통합 관리를 위해 회원 객체를 추상화 시키고, Id 를 Object 로 변경했다.
  - google, keycloak 만 했을 때는 String 으로 id 를 받아도 문제가 없었다.
  - github 를 추가하니, Integer 값으로 받아와서 String 으로 받으니 에러가 발생했다.
3. claim 이 담겨 있는 attributes 에 key 값이 sub 가 아니라 id 로 지정해야한다.

```yaml
## GITHUB
# https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app
github:
client-id: ${OAUTH2_GIT_CLIENT_ID}
client-name: social_github
client-secret: ${OAUTH2_GIT_CLIENT_SECRET}
redirect-uri: http://localhost:8081/login/oauth2/code/github
scope:
  - read:user
  - user:email
```

```java
// (1)
public interface MemberProvider {
    // ...
    public Object getId();
    // ...
}

// (2)
@Data
public abstract class OAuth2MemberProvider implements MemberProvider {
  // ...
  @Override
  public Object getId() {
      Object id = attributes.get("id");
      if (id instanceof String) {
          return String.valueOf(id);
      }

      return id;
  }
  // ...
}


// (3)
public class GithubMember extends OAuth2MemberProvider {
    public GithubMember(OAuth2User oAuth2User, ClientRegistration clientRegistration) {
        super(oAuth2User.getAttributes(), oAuth2User, clientRegistration);
    }

    @Override
    public Integer getId() {
        return (Integer) getAttributes().get("id");
    }

    @Override
    public String getUsername() {
        return String.valueOf(getAttributes().get("email"));
    }

}

```

![debug](2023-08-07/1.png)

log 한땀 한땀 찍는 것 보다 debug 하는게 훨씬 편하다는 걸 느끼고 있다. email 항목은 본인이 깃허브 세팅에서 private 으로 해놓았다면 null 값만을 보게된다.


## 정리 

> 일단 큰 줄기만 다시 살펴보자
{: .prompt-warning }

1. `application.yml` 에서 oauth2 provider, client 를 등록한다. 
2. `SecurityFilterChain` 에서 oauth2Login 설정을 추가한다.
3. `GrantedAuthoritiesMapper` 의 구현체를 생성한다.
4. `OAuth2UserService` 인터페이스를 상속받아서 `loadUser` 를 구현한다.



> 이제 구체적인 클래스, 메서드 등을 더해보자.
{: .prompt-info }


1. `application.yml` 에서 oauth2 provider, client 를 등록한다. 
   * client-id, client-secret, client-name, redirect-uri, scope
2. `SecurityFilterChain` 에서 oauth2Login 설정을 추가한다.
   * OAuth2UserService 를 상속받아 loadUser 를 구현하는 구현체를 작성한다.
   * OAuth2User, OidcUser 2개를 생성해서 bean 으로 등록하고, userInfoEndpoint/userServce, oidcUserService 에 등록한다.
3. `GrantedAuthoritiesMapper` 의 구현체를 생성한다.
   - `Collection<? extends GrantedAuthority>` 를 파싱한다.
   - 인가서버마다 표준이 없고 authority 를 모두 다른 형태로 전송한다.
   - xxxxx.READ, xxxxx:READ, READ, x.READ 등 다양한 형태로 받기 때문에 이를 if 문으로 처리해서 ROLE_YYYY 로 맞춰야 한다. 
   - ROLE_ 로 시작하는 _prefix_ 는 변경할 수 있다.
4. `OAuth2UserService` 인터페이스를 상속받아서 `loadUser` 를 구현한다.
   - `google`, `naver`, `github`, `keycloak`, `kakao` 등 여러가지 서비스 제공업체에서 토큰을 주고 받으며, 회원 정보를 가져와야 한다. 따라서 인터페이스와 추상 클래스로 추상화 작업을 거친다. 서비스 제공 업체에 따라서 _attributeName_ 등 필수적으로 가져와야 하는 정보의 _key_ 값이 다르기 때문에 해당 부분만 다르게 구현해주면 된다.
   - 이 부분은 OAuth 2.0 를 사용하지 않고, 스프링 시큐리티만을 사용할 때 `UserDetails` 를 상속받아서 `User` 엔티티를 생성하는 경우와 유사하다.
     - `UserDetailsService` 를 사용해야하고, `loadUserByUsername` 이라는 메서드를 구현한다.

