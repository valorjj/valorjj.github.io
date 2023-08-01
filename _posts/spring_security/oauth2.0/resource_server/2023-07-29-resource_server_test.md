---
title: OAuth 2.0 Resource Server 개념
date: 2023-07-29 18:10 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["Resource Server"]
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

> Keycloak 을 활용한 Client, Resource Server 의 전반적인 작동 원리를 알아본다.
{: .prompt-info }

![oidc explain](oidc/openid-connect-oidcexplained.png)

설정은 [여기]({% post_url spring_security/oauth2.0/resource_server/2023-07-28-resource_server_config %}) 를 참고한다.
또한 JWT 관한 내용은 [여기]({% post_url spring_security/jwt/2023-07-30-jwt %}) 를 참고한다.


> Keycloak 처럼 인가 서버를 따로 둔 경우, 인가 서버에 로그인이 되었을 때 어노테이션을 사용해서 access token 을 쉽게 가져올 수 있다. 
{: .prompt-warning }

```java
@GetMapping("/token")
public OAuth2AccessToken token(@RegisteredOAuth2AuthorizedClient("keycloak") OAuth2AuthorizedClient oAuth2AuthorizedClient) {
    // OAuth2AuthorizedClient 는 Authorization 에 관한 정보가 들어있다.
    // @RegisteredOAuth2AuthorizedClient 을 통해서
    // 인가된 객체인 OAuth2AuthorizedClient 에 포함된 파라미터에 대한
    // 접근 권한을 획득한다.
    return oAuth2AuthorizedClient.getAccessToken();
}
```

> Keycloak 서버에 로그인을 마친 후, localStorage 에 access token 을 저장한다. <br/>
> access token 을 저장하고 /home 경로로 이동한다. /home 에서는 서버에 요청을 보낸다.
{: .prompt-info }


```javascript
function token(){
    fetch("/token")
        .then(response => {
            response.json().then(function(data){
                window.localStorage.setItem("access_token", data.tokenValue);
                location.href = "/home";
            })
        });
}
```

> ResourceServer 에 자원을 요청한다. 
{: .prompt-info }


```java
/**
 * AccessToken 은 Keycloak 로그인 후, localStorage 에 저장되는 상황이다.
 * 해당 토큰을 사용해서 서버에 요청을 보낸다.
 * /
@GetMapping("/photos")
public List<Photo> photos(AccessToken accessToken) {
    HttpHeaders httpHeaders = new HttpHeaders();
    httpHeaders.add("Authorization", "Bearer " + accessToken.getToken());
    HttpEntity<?> entity = new HttpEntity<>(httpHeaders);

    // 서버 URL
    int resourceServerPort = 8088;
    String url = "http://localhost:" + resourceServerPort + "/photos";

    // port: 8088 인 인가 서버로 요청을 보낸다.
    // .exchange 메서드를 사용해 통신 결과를 ResponseEntity 에 담을 수 있다.
    ResponseEntity<List<Photo>> response = restTemplate.exchange(url, HttpMethod.GET, entity, new ParameterizedTypeReference<>() {
    });

    return response.getBody();
}
```

***GET 요청*** 을 보내는 간단한 스크립트이다. 

```javascript
function photos() {
    fetch("/photos?token=" + localStorage.getItem("access_token"),
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(response => {
            response.json().then(function (data) {
                for (const prop in data) {
                    // 확인을 위해서 화면에 정보를 뿌려준다.
                }
            })
        })
        .catch((error) => console.log("error:", error));
}
```

> [인프런 강의](https://inf.run/6BU4) 에서는 기능별로 나누어서 실습한다. <br/>
> 통합해서 적용하는 과정은 이후 강의에서 이어진다.
{: .prompt-danger }



## 출처
1. https://www.manageengine.com/products/self-service-password/openid-connect-oidcexplained.html
2. 인프런-정수원 강사님의 OAuth 2.0 강좌