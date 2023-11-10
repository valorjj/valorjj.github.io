---
title: Spring Security
date: 2023-10-19 00:00 +09:00
categories: ["springboot", "springsecurity"]
image:
    path: spring.png
    alt: ""
---

# 스프링 시큐리티 구조

![image](https://user-images.githubusercontent.com/30681841/281915263-95634e4a-5d12-4379-be0e-da174a72dc20.png)

기본적인 구조는 위와 같다. 

Thread-Safe 한 Authentication 객체가 SecurityContext 에 저장 된 다음, Session 으로 유지된다. 

![image](https://user-images.githubusercontent.com/30681841/281915841-ed346ab1-6b03-4caa-b4a2-e5f4e984deec.png)

또한, 이미 세션이 있는지 여부를 판단하는 필터를 거친다. 세션이 없다면 새로 생성하고, 있다면 기존 세션값을 사용한다.


스프링 시큐리티는 디폴트로 등록된 13개 필터, 그리고 개발자가 등록한 커스텀 필터를 거쳐서 각종 검사를 진행한다. 해당 과정에서 기본으로는 세션으로 데이터를 보관한다. 

스프링 시큐리티는 클래스 단위로도 설정할 수 있지만, 메서드 단위로도 설정할 수 있다. 

이 때, `프록시 + AOP` 방식을 적용한다. (스프링 프레임워크가 이 방식을 선호하는 것 같다.)

아래의 어노테이션에 해당한다.

```java
@PreAuthorize
@PostAuthorize
@Secured
@RolesAllowed

// 사용하기 위해서는 설정 파일에 선언이 필요하다.
@EnableGlobalMethodSecurity(
  prePostEnabled = ture, 
  securedEnabled = true
)
```

![image](https://user-images.githubusercontent.com/30681841/281917336-2afb6bd7-bfe3-4536-9f91-f25723226a1e.png)

---

스프링 시큐리티는 세션을 이용한 보안에 특화되어 있으며, jwt 를 사용하기 위해서는 여러 설정을 바꿔야 한다. 

만약, 외부 인가서버를 두고 jwt 로 모든 인증 정보를 주고 받는다면, 굳이 스프링 시큐리티를 사용할 이유는 없다. 

([관련 실습 깃허브 주소](https://github.com/valorjj/oauth2-backend))