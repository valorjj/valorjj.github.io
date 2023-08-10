---
title: Rest Template
date: 2023-08-09 00:00 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["rest-template"]
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

- 스프링부트에서 Rest API 를 호출하는 ***내장*** 라이브러리 (스프링 3.x.x 부터)
- JSON, XML 모두 사용 가능
- 멀티 스레드 지원


스프링 시큐리티 내부적으로 인가서버 통신에 Rest Template 을 사용하기에 간단한 기록을 남긴다.

## How to Use?

1. RestTemplate 객체 생성
2. HttpHeader 세팅
3. HttpBody 세팅
4. HttpEntity 생성
5. API 호출
6. Response 파싱


```java
// (1)
RestTemplate restTemplate = new RestTemplate();

// (2)
HttpHeaders headers = new HttpHeaders();
headers.setContentType(MediaType.APPLICATION_JSON);


// (3-1)
// MultiValueMap 방식으로 body 를 생성하는 경우,
// ContentType 의 default 값이 application/x-www-form-urlencoded 
MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
body.add("foo", "bar");

// (3-2)
// Class 인 경우, application/json
UserDTO userDTO = new UserDTO();
userDTO.setUserId("1L");
userDTO.setUserFirstName("foo");
userDTO.setUserLastName("bar");

// (4)
HttpEntity<?> requestMessage = new HttpEntity<>(body, httpHeaders);

// (5)
// postForEntity 메서드는 데이터 URL 에 POST 방식으로 요청을 보내고, 응답 본문에서
// 매핑된 개체를 포함하는 ResponseEntity 를 반환한다.
ResponseEntity<CommonResponse> response = restTemplate.postForEntity(url, requestMessage, String.class);

// (6)
return repsonse.getBody();

```


## 출처
1. https://yjh5369.tistory.com/entry/Spring-boot-Restful-API-%EC%89%BD%EA%B2%8C-%ED%98%B8%EC%B6%9C%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-by-using-RestTemplate
