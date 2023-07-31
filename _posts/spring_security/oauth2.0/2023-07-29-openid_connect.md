---
title: OpenID Connect(OIDC) 에 관해서
date: 2023-07-29 18:10 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["OIDC"]
image:
    path: spring_security_logo.png
    alt: ""
---

> OAuth 2.0 맨 앞단에서 활약하는 layer 이다.
> IETF RFC 6749 & 6750
{: .prompt-info }

`OpenID Connect(OIDC)` 는 쉽게 말해 인증이 필요한 다양한 형태의 사용자 요청을 '표준화' 시키는 역할을 한다. OAuth 2.0 의 부족한 부분을 채워주는 _조력자_ 역할이다.

`Identity Layer` 를 추가해줌으로서 인증 과정에 개입할 수 있는 길을 열어준다. 인증이 필요한 요청에 `parameters` 를 포함시켜서 서버에서 활용한다. 섬세한 보안 설정을 할 수 있는 것이다.

![how oidc works](../../assets/img/oidc/what-is-openid-connect-1.png)
![how oidc works](../../assets/img/oidc/what-is-openid-connect-2.png)


`OpenID Connect` 를 사용하면, `Scope` 를 통해서 접근 권한을 설정할 수 있다. 스프링 시큐리티가 기본적으로 제공하는 _ROLE_ADMIN_ 이 아니라 좀 더 세세한 접근 제한이 가능하다. 스프링 시큐리티에서는 OAuth 2.0, 그리고 OIDC 를 좀 더 쉽게 사용할 수 있는 API 를 제공한다.



## 출처

1. https://curity.io/resources/learn/openid-connect-overview/
2. https://openid.net/specs/openid-connect-core-1_0.html#RFC6749
3. https://www.keycloak.org/docs/latest/server_admin/#keycloak-features-and-concepts
4. https://developers.onelogin.com/openid-connect
5. https://www.loginradius.com/blog/identity/what-is-openid-connect/
6. https://www.manageengine.com/products/self-service-password/openid-connect-oidcexplained.html