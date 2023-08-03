---
title: OpenID Connect(OIDC) 에 관해서
date: 2023-07-29 18:10 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["OIDC"]
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

> OAuth 2.0 맨 앞단에서 활약하는 '인증' layer 이다.<br/>
> IETF RFC 6749 & 6750
{: .prompt-info }

`OpenID Connect(OIDC)` 는 쉽게 말해 인증이 필요한 다양한 형태의 사용자 요청을 _표준화_ 시키는 역할을 한다. OAuth 2.0 의 부족한 부분을 채워주는 _조력자_ 역할이다.

`Identity Layer` 를 추가해줌으로서 인증 과정에 개입할 수 있는 길을 열어준다. 인증이 필요한 요청에 `parameters` 를 포함시켜서 서버에서 활용한다. 섬세한 보안 설정을 할 수 있는 것이다.

![how oidc works](oidc/what-is-openid-connect-1.png)
![how oidc works](oidc/what-is-openid-connect-2.png)


`OpenID Connect` 를 사용하면, `Scope` 를 통해서 접근 권한을 설정할 수 있다. 스프링 시큐리티 기본값인 `ROLE_XXXX` 가 아니라 `SCOPE_XXXX` 로 권한 정보가 맵핑된다.

`GrantedAuthority` 에 정보가 담기는데, 특정 요구사항이 존재한다면 *prefix* 를 요구 사항에 맞게 바꿀수도 있다. JWT 를 읽어 `SCOPE_EMAIL` 로 받아온 정보를 `ROLE_EMAIL` 로 변환할 수 있다. 

인가 서버에 JWT 를 요청할 때, `scope` 에 `openid` 를 포함시키면 OIDC 를 사용할 수 있다. 스프링 시큐리티에서 OAuth 2.0 를 추가하면 OIDC 관련한 다양한 클래스를 제공한다. (OidcProvider, OidcFilter, OidcToken, OidcUser 등등)

또한, _인증을 요청한 사용자의 Id 를 확인할 수 있는 보안 토큰_ 인 `ID Token` 을 제공한다.

### OpenID Connect Discovery 1.0 Provider Metadata

`https://${base-server-url}/.well-known/openid-configuration` 에서 OpenID 공급자에 대한 정보를 확인할 수 있다.

해당 문서를 열어보면 response_types_supported 를 확인해보면 `id_token` 이 포함되어 있다.
```javascript
{
    "response_types_supported": [
        "code", "token", "id_token"
    ]
}
```

### ID Token

> 사용자가 인증된 상태임을 증명한다.<br/>
> OIDC 요청 시, Access Token 과 함게 Client 에게 전달된다. 
{: .prompt-info }

ID Token vs Access Token

![id_token](2023-08-03/id_token_access_token.png)

1. ID Token 은 API 요청에 사용하지 않고, 신원확인 용도로 사용한다.
2. Access Token 은 인증 요청에 사용하지 않고, 리소스 접근에 사용한다.

![oidc_request](2023-08-03/oidc_scope.png)


## OIDC 로그인 요청

> 코드부터 확인하자.
{: .prompt-warning }

GET 요청 예시는 다음과 같다.
```HTTP
GET http://[base-server-url]/oauth2/auth?
client_id=6731de76-14a6-49ae-97bc-6eba6914391e
&response_type=id_token
&redirect_uri=http://localhost:8080
&scope=openid
&state=12345
&nonce=678910
```


응답 예시는 다음과 같다.
```javascript
{
    "access_token": "eyJraWQiOiJzZWNyZXQtandrLWtpZCIsImFsZyI6IkhTMjU2In0.eyJzdWIiOiJvbmpzZG5qcyIsImF1ZCI6Im1lc3NhZ2luZy1jbGllbnQiLCJuYmYiOjE2NTMyMTc1NTYsInNjb3BlIjpbIm9wZW5pZCJdLCJpc3MiOiJodHRwOlwvXC9hdXRoLXNlcnZlcjo5MDAwIiwiZXhwIjoxNjUzMjE3ODU2LCJpYXQiOjE2NTMyMTc1NTZ9.lRorxPWNsCcNKN4VbBj76BTTEu9E3Chxm0LPf9WDp_E",
    "refresh_token": "tQbCBd7adqFK5VAjvZml_Mqaqf9Q5DPRFyQILSBP4GNs4Hg_Cupd8bKPzHFKR2R2P-UUlsTm4BJX9h9LyD0BI6jQf1eSAIRVpzyJmfAETH39XhdzpokwHdVndGmI0b1K",
    "scope": "openid",
    "id_token": "eyJraWQiOiJzZWNyZXQtandrLWtpZCIsImFsZyI6IkhTMjU2In0.eyJzdWIiOiJvbmpzZG5qcyIsImF1ZCI6Im1lc3NhZ2luZy1jbGllbnQiLCJhenAiOiJtZXNzYWdpbmctY2xpZW50IiwiaXNzIjoiaHR0cDpcL1wvYXV0aC1zZXJ2ZXI6OTAwMCIsImV4cCI6MTY1MzIxOTM1NiwiaWF0IjoxNjUzMjE3NTU2fQ.Q4fhp5ujf4EVZKBsw1VL9fDWRVk-gy26w_wA3JMfYa0",
    "token_type": "Bearer",
    "expires_in": 300
}

```

OpendId Connect 를 사용할 때 몇 가지를 알아야 한다.

1. OpenId Provider
2. Relying Party

`OpenId Provider` -> `OP`
- 사용자를 인증, 인증 결과를 전달하는 OAuth 2.0 서버를 의미한다.
- 만약 Google 소셜 로그인을 구현한다면, OP 는 Google 이 됩니다.

`Relying Party` -> `RP`
- OAuth 2.0 Client


로그인을 요청하는 흐름은 다음과 같다.


1. `RP` 는 `OP` 에 권한을 요구하는 요청을 보낸다.
2. `OP` 는 ***최종 사용자*** 를 인증하고, 권한을 획득한다.
3. `OP` 는 `Id Token`, `Access Token` 을 포함시켜 `RP` 에게 응답한다.
4. `RP` 는 `Access Token` 을 사용하여 `UserInfo Endpoint` 에 요청을 보낸다.
5. `UserInfo Endpoint` 는 요청을 받고 ***최종 사용자*** 에 대한 ***Claim 을 반환*** 한다.



[OAuth 2.0 Client]({% post_url spring_security/oauth2.0/2023-08-03-oauth2_client %}) 에서 확인할 수 있다. 실질적인 설정, 사용법은 해당 포스팅에서 이어간다.
## 출처

1. https://curity.io/resources/learn/openid-connect-overview/
2. https://openid.net/specs/openid-connect-core-1_0.html#RFC6749
3. https://www.keycloak.org/docs/latest/server_admin/#keycloak-features-and-concepts
4. https://developers.onelogin.com/openid-connect
5. https://www.loginradius.com/blog/identity/what-is-openid-connect/
6. https://www.manageengine.com/products/self-service-password/openid-connect-oidcexplained.html
7. https://devocean.sk.com/blog/techBoardDetail.do?ID=165131&boardType=techBlog