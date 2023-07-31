---
title: OAuth2.0 인가 서버 구성
date: 2023-07-29 18:10 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["Resource Server"]
img_path: /assets/img/
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

`Keycloak` 등 외부 인가 서버가 아닌 스프링 시큐리티에서 지원하는 `Spring Authorization  Server` 를 구성한다.

- OAuth 2.1
- OpenID Connect 1.0 

을 지원한다.

## Architecture

![architecture](../../assets/img/oauth2/OAuth2AuthorizationResourceServerConfiguration.png)


## 의존성 추가

```groovy
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-authorization-server'
```


## OAuth2AuthorizationServerConfigurer

`OAuth2AuthorizationServerConfigurer` 는 어떤 설정 클래스들을 제공하는지 살펴본다.

> 클라이언트의 인증 엔드포인트를 설정한다.
{: .prompt-tip }
- [ ] `OAuth2ClientAuthenticationConfigurer`
    - [ ] `OAuth2ClientAuthenticationFilter`
    - [ ] `OAuth2ClientAuthenticationProvider`

> 권한을 부여하는 엔드포인트를 설정한다.
{: .prompt-tip }
- [ ] `OAuth2AuthorizationEndpointConfigurer`
    - [ ] `OAuth2AuthorizationEndpointFilter`
    - [ ] `OAuth2AuthorizationCodeRequestAuthenticationProvider`

> Token 에 관련된 엔트포인트를 설정한다.
{: .prompt-tip }
- [ ] `OAuth2TokenEndpointConfigurer`
    - [ ] `OAuth2TokenEndpointFilter` 
    - [ ] `OAuth2AuthorizationCodeAuthenticationProvider`
    - [ ] `OAuth2RefreshTokenAuthenticationProvider`
    - [ ] `OAuth2ClientCredentialsAuthenticationProvider`

> Opaque 토큰을 검사하는 엔드포인트를 설정한다.
{: .prompt-tip }
- [ ] `OAuth2TokenIntrospectionEndpointConfigurer`
    - [ ] `OAuth2TokenInrospectionEndpointFilter`
    - [ ] `OAuth2TokenInrospectionAuthenticationProvider`


> Token 을 취소하는 엔드포인트를 설정한다.
{: .prompt-tip }
- [ ] `OAuth2TokenRevocationEndpointConfigurer`

> OpenID Connect 의 엔드포인트를 설정한다.
{: .prompt-tip }
- [ ] `OidcConfigurer`
  - [ ] `OidcProviderConfigurationEndpointFilter`


> UserInfo 엔드포인트를 설정한다.
{: .prompt-tip }
- [ ] `OidcUserInfoEndpointConfigurer`
    - [ ] `OidcUserInfoEndpointFilter`
    - [ ] `OidcUserInfoAuthenticationProvider`

> Client 를 등록하는 엔드포인트를 설정한다.
{: .prompt-tip }
- [ ] `OidcClientRegistrationEndpointConfigurer`
    - [ ] `OidcClientRegistrationEndpointFilter`
    - [ ] `OidcClientRegistrationAuthenticationProvider`



