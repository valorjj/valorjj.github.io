---
title: OAuth 2.0 Client/Resource Server 연동 - 설정
date: 2023-07-28 22:45 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["Resource Server"]
img_path: /assets/img/
image:
    path: spring_security_logo.png
    alt: ""
---

# Introduction

> OAuth 2.0 Client + OAuth 2.0 Resource Server + Keycloak
{: .prompt-warning }

## 필요지식

- OAuth 2.0
- Client - Authorization Server - Authentication Server - DB 의 관계
- JWT 의 작동방식
- Keycloak 설정


## Client - application.yml

> OAuth 2.0 Client 설정
{: .prompt-info }

```yaml
server:
  port: 8081

spring:
  security:
    oauth2:
      client:
        ## Authorization Server 의 항목
        provider:
          keycloak:
            ## http://localhost:8080/realms/${생성한 client 아이디}/.well-known/openid-configuration 로 접근하면 나오는 endpoint 에 관한 정보이다.
            ## 해당 url 명칭과 application.yml 에 적어야 하는 명칭이 다른 것을 주의하자.

            # issuer
            issuer-uri: http://localhost:8080/realms/${client}
            # authorization_endpoint
            authorization-uri: http://localhost:8080/realms/${client}/protocol/openid-connect/auth
            # token_endpoint
            token-uri: http://localhost:8080/realms/${client}/protocol/openid-connect/token
            # userinfo_endpoint
            user-info-uri: http://localhost:8080/realms/${client}/protocol/openid-connect/userinfo
            # jwks_uri
            jwk-set-uri: http://localhost:8080/realms/${client}/protocol/openid-connect/certs
            # claims_supported 중 하나
            user-name-attribute: preferred_username

        ## Client 에 해당하는 항목    
        registration:
          keycloak:
            # grant_types_supported 중 하나
            authorization-grant-type: authorization_code
            # Keycloak 에서 생성한 client 의 ID
            client-id: ${client 아이디}
            # Keycloak 에서 생성한 client 의 name
            client-name: ${client 이름}
            # Clients -> Credentials 에서 확인
            client-secret: ${client 의 Secret}
            # Client 에 설정한 valid redirectUri
            # 인가 서버에서 JWT 를 획득하는 과정에서 해당 uri 를 적어주어야 한다.
            # Keycloak 서버에 인가 과정을 위임하는 것이기 때문에,
            # 인가 서버에 허용 가능한 uri 로만 접근할 수 있다.
            redirect-uri: http://localhost:8081/login/oauth2/code/keycloak
            # 자원에 대한 접근을 허용할 권한을 명시한다.
            # client 는 openid 로 로그인을 하며, email 과 photo 에 대해 접근 권한을 가지게 된다.
            # 인증 관련 필터에서 SCOPE_${권한명} 으로 검증을 한다.
            # 만약 name 이라는 곳에 접근을 할 시, 현재는 권한이 없기 때문에
            # 403 에러를 보게 된다.
            scope: openid,email,photo
```

## Client - SecurityConfig

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
  http.authorizeHttpRequests(r -> r.requestMatchers("/").permitAll()
          .anyRequest().authenticated()
  );

  http.oauth2Login(l -> l.defaultSuccessUrl("/"));

  return http.build();
}

@Bean
public RestTemplate restTemplate() {
    return new RestTemplate();
}

```

## Resource Server - application.yml 

> OAuth 2.0 Resource Server 설정
{: .prompt-info }

```java
server:
  port: 8088

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://localhost:8080/realms/${client}/protocol/openid-connect/certs
```

## Resource Server - SecurityConfig

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

  http.authorizeHttpRequests(r -> 
    r.requestMatchers("/photos").hasAuthority("SCOPE_photo")
      .anyRequest().authenticated()
  );

  http.oauth2ResourceServer(config -> config.jwt(withDefaults()));

  http.cors(config -> config.configurationSource(customCorsConfigurationSource()));

  return http.build();
}



/**
* 8081 <-> 8088
* */
@Bean
public CorsConfigurationSource customCorsConfigurationSource() {
  CorsConfiguration configuration = new CorsConfiguration();
  configuration.addAllowedOrigin("*");
  configuration.addAllowedHeader("*");
  configuration.addAllowedMethod("*");
  configuration.setMaxAge(3600L);

  UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
  source.registerCorsConfiguration("/**", configuration);

  return source;
}
```
{{ page.path }}