---
title: OAuth 2.0 Client
date: 2023-07-29 18:10 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["client"]
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

> OAuth 2.0 프레임워크에서 인가서버, 리소스서버와의 통신을 담당하는 모듈 <br/>
> 필터 기반으로 구현되어 있다.
{: .prompt-warning }


의존성 추가

`spring-boot-starter-oauth2-client`

## OAuth 2.0 Login, OAuth 2.0 Client

### OAuth2Login

- OAuth 2.0 f/w 의 grant code type 중 authorization code 방식을 사용한다.
- global provider 인 google, github 등으로의 OAuth 2.0 로그인 기능을 지원한다.
  - google, github, facebook 등은 이미 관련 설정이 선언되어 있다.
  - naver, kakako 등은 정보를 추가적으로 제공해주어야 한다. 

### OAuth2Client

- 인가 서버의 endpoint 과 직접 통신하는 API 를 제공한다.
  - 지원하는 API 를 사용해서 리소스 서버에 접근하는 기능을 구현한다.

![oauth2_client](oauth2/oauth2_client.png)

## OAuth2Client

![yml](oauth2/yml.png)

![oauth2_client_properties](oauth2/oauth2_client_properties.png)

application.yml 에 설정한 값이 OAuth2ClientProperties 객체의 ClientRegistration 클래스의 필드에 바인딩된다.


## ClientRegistration


해당 객체는 OpendID Connect Provider, Authorization Server 의 endpoint 를 찾아서 데이터를 가져온다. 

```java
// (1)
ClientRegistration clientRegistration = ClientRegistration.fromIssuerLocation("https://sample.example.com/issuer").build();
```

`https://sample.example.com/issuer/.well-known/openid-configuration`
`https://sample.example.com/issuer/.well-known/authorization-server`

에 200 (OK) 응답을 받을 때 까지 요청한다.


![client_registration](oauth2/client_registration.png)
![client_registration](oauth2/client_registration_detail.png)

> NameAttributes 는 UserInfo 안에 있는 정보이다. <br/>
> 최종 사용자의 이름, 식별자 등의 정보가 들어있는데 Provider 에 따라서 다르게 작성되어 있다. <br/>
> 따라서 Map 의 내용을 파싱할 클래스를 별도로 만들어야 한다.
{: .prompt-danger }

### Common OAuth2.0 Provider

이미 알려진 OAuth 2.0 Provider 들이 존재한다. 

![oauth2_provider](oauth2/common_oauth2_provider.png)

Naver, Kakao 는 아니다. 따라서 위의 모든 항목을 직접 서버에 등록해야한다.


### 작동원리

> application.yml 에 설정한 값이 아래 항목들에 바인딩 된다.
{: .prompt-tip }

1. `OAuth2ClientRegistrationRepositoryConfiguration`
2. `OAuth2ClientRepositoryRegistrationAdapter`
3. GET `ClientRegistrations`
4. `fromIssuerLocation`
   1. `OIDC`
      1. `/.well-known/openid-configuration` (OpenID Connect Discovery 1.0)
   2. `AUTH`
      1. `/.well-known/oauth-authorization-server` (RFC 8414)
5. `OIDC`
   1. `RestTemplate`
   2. `Map Configuration`
   3. `OIDCProviderMetadata`
   4. `ClientRegistration`


## oauth2Login()
[내용이 많아서 정리 중]


`OAuth2LoginAuthenticationFilter`
- `/login/oauth2/code/*` 가 여기 정의되어 있다.
  - `loginProcessingUrl`
  - 해당 url 로 요청이 오면, 필터가 작동한다.
- ***Access Token 교환*** 및 ***UserInfo endpoint 요청*** 필터
- access token 을 발급받기 위해 거치는 단계로, code 값이 필요하다. 
  - ProviderDetails
  - ClientRegistrationRepository 등의 정보가 담겨있다.

`client -> authorization server -> code -> redirecturi (${host} + /oauth2/login/code/${registrationId}) client`



`OAuth2LoginAuthenticationProvider`
- 실질적인 인증 처리를 담당하는 클래스

`OidcAuthorizationCodeAuthenticationProvider`
- id token 으로 인증을 처리하는 클래스

`DefaultLoginPageGeneratingFilter`

`configure`
- `OAuth2AuthorizationRequestRedirectFilter`
  - 임시 코드를 발급하는 endpoint 요청 필터
  - authorization code 방식인 경우, 가장 먼저 실행되는 필터


`OAuth2LoignConfigurer`
- `AuthorizationEndpointConfig`
- `RedirectionEndpointConfig`
- `TokenEndpointConfig`
- `UserInfoEndpointConfig`



`OAuth2UserService`
- access token 가지고 사용자 정보를 가지고 오도록 요청하는 클래스


- _Oidc 관련 검증_ 하는 경우 `JwtDecoder` 가 반드시 사용된다.


client -> user -> [버튼 클릭] Login (/oauth2/authorization) -> `OAuth2AuthorizationRequestRedirectFilter`



## 필터 관련 요약

1. .init() 에서 필터 생성
2. 특정 조건에서 필터 실행
3. Entrypoint 로 default 대체


## 출처