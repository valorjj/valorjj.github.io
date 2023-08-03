---
title: OAuth 2.0 Login 구현
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

질문. React.js 로 프론트 서버를 구성하면 url 을 어떻게 보내야할까?

## Authorization Code 요청

`DefaultOAuth2AuthorizationRequestResolver`
- `OAuth2AuthorizationRequest` 를 최종적으로 완성시킨다. 
- `/oauth2/authorization/${registrationId}` 와 일치하면, ***${registrationId}*** 를 추출하고, 이를 사용해 ClientRegistration 을 가져온다.
  - OAuth2AuthorizationRequest 를 빌드한다.

`OAuth2AuthorizationRequest`
-  token endpoint 요청 파라미터를 가지고 있는 객체
-  인가 응답을 연계하고, 검증할 때 사용된다.

## Access Token 교환

## OAuth 2.0 User 모델 

## OAuth 2.0 Provider UserInfo 엔드포인트 요청

## OpenID Connect Provider OidcUserInfo 엔드포인트 요청

## OpenID Connect 로그아웃

## Spring MVC 인증 객체 참조

## API 커스텀 설정