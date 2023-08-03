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

![client_registration](oauth2/client_registration.png)
![client_registration](oauth2/client_registration_detail.png)



