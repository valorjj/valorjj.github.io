---
title: swagger ui (openAPI)
date: 2023-10-22 00:00 +09:00
categories: ["springboot"]
tags: 
- "swagger"
image:
    path: swagger.png
    alt: ""
---

> 개발자가 아니여도 API 를 쉽게 테스트 할 수 있도록 OpenAPI 를 제공하는 오픈소스 프레임워크
> swagger 가 아니라 springdoc-openapi 라이브러리가 본체이며, API 명세화 기능을 제공한다.
> 런타임 시점에 프로젝트의 설정, 클래스, 어노테이션 등을 분석하여 API 명세서를 HTML 형태로 만든다.

# 설정법
> maven 혹은 gradle 의존성을 추가하면 작동한다.

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.2.0</version>
</dependency>
```

```groovy
implementation('org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0')
```



---

## 출처
1. [springdoc 공식문서](https://springdoc.org/)