---
title: OAuth2.0 인가 서버 설정
date: 2023-07-29 18:10 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["Resource Server"]
img_path: /assets/img/
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

`OAuth 2.0 Authorization Server` 의 권한 부여 흐름을 알아본다. 

인가서버가 클라이언트에게 권한을 부여하기 위해서는 리소스 소유자의 인증이 필요하다. 따라서 사용자 인증 로직을 구현해야 한다. 


##  클라이언트  구성

- Request 는 OAuth 2.0 Authorization Code Grant 타입으로 한다.
- OpenID Connect 가 실행되도록 scope 에 openid 를 포함한다.
- 클라이언트의 인증은 Basic 으로 한다.
- 클라이언트의 RedirectUri 는 http://localhost:8080 으로 한다.


## 인가서버 구성

> 간단한 설정으로 인가서버를 구성하는 것이 포인트

`AuthorizationServerConfig` 에 설정을 등록한다.

```java
@Configuration(proxyBeanMethods = false)
public class AuthorizationServerConfig {

}
```
ㄹ 

```java
@Bean
@Order(Ordered.HIGHEST_PRECEDENCE)
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
    OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
    http
            .exceptionHandling(exceptions ->
                    exceptions.authenticationEntryPoint(new LoginUrlAuthenticationEntryPoint("/login"))
            );
    http.oauth2ResourceServer().jwt();
    return http.build();
}
```

### 공급자 설정
```java
@Bean
public ProviderSettings providerSettings() {
    return ProviderSettings.builder().issuer("http://localhost:9000").build();
}
```

## RegistredClient

인가 서버에서 이루어지는 인증, 인가 과정에서 개발자가 개입할 수 있는 여지를 만들어 준다. 다양한 메서드를 제공해서 메타 데이터를 등록하고, 사용할 수 있다.

RegistredClient 의 사용 목적은 리소스에 대한 접근을 요청하는 것으로, 인가 서버에 인가를 요청한다. 인가 서버는 code 를 발급한다. code 를 사용해서 access token 을 획득 할 수 있다. 

```java
RegisteredClient.withId(UUID.randomUUID().toString())
        .clientId(clientId)
        .clientSecret(clientSecret)
        .clientName(clientId)
        .clientIdIssuedAt(Instant.now())
        .clientSecretExpiresAt(Instant.MAX)
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
        .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
        .redirectUri("http://127.0.0.1:8081")
        .scope(OidcScopes.OPENID)
        .scope(OidcScopes.PROFILE)
        .scope(OidcScopes.EMAIL)
        .scope(scope1)
        .scope(scope2)
        .clientSettings(ClientSettings.builder().requireAuthorizationConsent(true).build())
        .build();
```

## RegisteredClientRepository

클라이언트를 등록하고, 기존 클라이언트를 조회할 수 있는 저장소이다. 권한 부여 처리, 토큰 검사, 동적 클라이언트 등록 등의 상황에서 다른 곳에서 호출해서 사용한다.

