---
title: 스프링부트 환경변수
date: 2023-01-01 00:00 +09:00
categories: ['algorithm']
tags:
  - 'tutorial'
image:
  path: spring.png
  alt: ''
---

<!-- @format -->

# 환경변수를 읽는 법

- Environment
- @Value
- @ConfigurationProperties

## Environment

Environment 객체 활용

```java
// 스프링부트에 기본적으로 여러가지 TypeConverter 가 등록되어 있다.
// Property Converions 검색
Environment.getProperty(key, Type);
```

### 단점

매번 `.getProperty` 를 통해 `@Bean` 으로 등록해줘야하는 과정을 반드시 거쳐야 하기 때문에 번거롭다.

## @Value

> 결국 Environment 객체를 사용하지만, 과정을 간소화 시켜준다.

```java
@Configuration
public class JwtTokenConfig {

    @Value("${jwt.exp_time}")
    public Integer tokenExpirationTime;
    @Value("${jwt.secret}")
    public String tokenSecret;
    @Value("${jwt.token_prefix}")
    public String tokenPrefix;
    @Value("${jwt.header}")
    public String tokenHeader;


    @Bean
    public JwtTokenVO jwtTokenConfig() {
        return new JwtTokenVO(tokenExpirationTime, tokenSecret, tokenPrefix, tokenHeader);
    }
}

```

```java
@Slf4j
@Data
@AllArgsConstructor
public class JwtTokenVO {

    private Integer tokenExpirationTime;
    private String tokenSecret;
    private String tokenPrefix;
    private String tokenHeader;
}

```

## @ConfigurationProperties

`Type-safe Configuration Properties`

환경변수를 읽어오면서 유효성 검사까지 끝낸채로 받아오면 어떨까? `@ConfigurationProperties` 를 통해서 환경변수를 읽어오는 설정 클래스를 Bean 으로 한번에 등록할 수 있다.
