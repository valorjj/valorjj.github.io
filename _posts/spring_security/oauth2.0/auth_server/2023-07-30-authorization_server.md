---
title: OAuth2.0 인가 서버 테스트
date: 2023-07-29 18:10 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["Resource Server"]
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

![architecture](oauth2/OAuth2AuthorizationResourceServerConfiguration.png)


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



## 테스트

> 실전에 적용하지 않는다면 의미가 없다. <br/>
> OAuth 2.0 Authorization Server + RegisteredClient + RegisteredClientRepository 로 토큰을 요청받는 barebone 코드를 작성한다.
{: .prompt-info }

인가 서버 설정은 [여기]({% post_url spring_security/oauth2.0/auth_server/2023-07-30-authorization_server_config %}) 를 참고하면 된다.


### postman 으로 요청 보내기

현재 커스텀 로그인 페이지가 없으므로 keycloak 에서 제공하는 로그인 페이지에서 생성한 유저로 로그인을 해야한다.

![postman](2023-07-31/postman.png)

`http://localhost:9000/oauth2/authorize?response_type=code&client_id=oauth2-client-app1&scope=openid read write&redirect_uri=http://127.0.0.1:8081`

```http
http://localhost:${서버에서 설정한 포트번호}/oauth2/authorize?response_type=${설정한 타입}&client_id=${RegisteredClient 에 설정한 이름}&scope=${RegisteredClient 에 설정한 scope}&redirect_uri=${RegisteredClient 에 설정한 uri}
```

RegisteredClient 설정에서 동의 화면 출력을 true 로 설정한 경우, 다음과 같은 화면이 뜬다.

![consent](2023-07-31/consent.png)

값을 제대로 설정했다면 인가 서버에서 인증 토큰을 보내준다.

![code](2023-07-31/code.png)
![auth_token](2023-07-31/auth_token.png)

해당 값을 사용해서 다시 인가서버에 토큰을 요청한다. 토큰을 확인하기 위한 컨트롤러는 다음과 같다.

```java
@Autowired
private OAuth2AuthorizationService oAuth2AuthorizationService;

@GetMapping("/authorization")
public OAuth2Authorization oAuth2Authorization(String token){
    return oAuth2AuthorizationService.findByToken(token, OAuth2TokenType.ACCESS_TOKEN);
}
```

요청을 보내면 access_token, refresh_token 을 받아올 수 있다.

![postman_jwt](2023-07-31/postman_jwt.png)

이제서야 자원에 대한 요청을 할 수 있다. access_token 을 사용해서 요청을 보내보자.
(테스트 환경은 리소스 서버, 인가 서버가 동일함)

`http://localhost:9000/authorization?token=${access_token}`

![authorization_token](2023-07-31/authorization_token.png)



## Conclude

