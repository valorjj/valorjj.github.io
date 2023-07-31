---
title: Opaque 토큰 이해
date: 2023-07-28 18:42 +09:00
categories: ["Spring Security","OAuth2.0"]
tags: ["jwt", "opaque"]
image:
    path: jwt_logo.png
    alt: ""
---

<!-- @format -->

# Opaque 토큰이란?

> JWT 토큰에 active 상태를 확인할 수 있는 boolean 값이 추가된다.
{: .prompt-tip }

## Security Config 에 추가

> SecurityFilterChain 에 jwt 가 아닌 opaque 토큰을 사용한다고 명시해야 한다.
{: .prompt-tip }


> Spring Security 에는 default 값이 정해져 있으며,
> @Bean 을 새롭게 등록하면 Custom 한 설정이 사용된다.
{: .prompt-warning }

```java

// ...
http.oauth2ResourceServer(OAuth2ResourceServerConfigurer::opaqueToken);

// ...
@Bean
public OpaqueTokenIntrospector opaqueTokenIntroSpector(
    OAuth2ResourceServerProperties properties
) {
    return new CustomOpaqueTokenIntrospector();
}
```

이제 `CustomOpaqueTokenIntrospector()` 를 구현하면 된다.

## CustomOpaqueTokenIntrospector

> Nimbus JOSE 라이브러리를 활용한다.
{: .prompt-info }


```java
@RequiredArgsConstructor
public cliass CustomOpaqueTokenIntrospector implements OpaqueTokenIntrospector {

    // application.yml 에 설정한 정보를 읽어온다.
    @Autowired
    private final OAuth2ResourceServerProperties properties;

    private OpaueTokenIntrospector delegate;
    
    private OpaueTokenIntrospector(OAuth2ResourceServerProperties properties) {
        delegate = new NimbusOpaqueTokenIntrospector(
            properties.getOpaquetoken().getIntropectionUri(),
            properties.getOpaquetoken().getClientId(),
            properties.getOpaquetoken().getClientSecret(),
        );
    }

    @Override
    public OAuth2AuthenticatedPrincipal introspect(String token) {
        // delete 통해서 auth server 와 통신한다.
        OAuth2AuthenticatedPrincipal principal = delete.intropect(token);

        // principal 에 담긴 권한 정보를 수정한다.
        return new DefaultOAuth2AuthenticatedPrincipal(
            principal.getName(),
            principal.getAttributes(), 
            extractAuthorities(principal)
        );
    }

    /**
     * principal 에서 권한 정보를 추출해서
     * ROLE_ 이라는 prefix 를 붙인다.
     * 
     * /
    private Collection<GrantedAuthority> extractAuthorities(
        OAuth2AuthenticatedPrincipal principal
    ) {
        List<String> scopes = 
            principal.getAttributes(OAuth2TokenIntropectionClaimNames.SCOPE);

        return scopes.stream().map(scope -> "ROLE_" + scope.toUpperCase())
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    }

}

```

`JWT` 를 사용할 때, 스프링 시큐리티에서는 authority 관련해서 'ROLE_' 의 prefix 가 필요하다. 

```javascript
{
    "authorities": [
        {
            "authority": "ROLE_OPENID"
        },
        {
            "authority": "ROLE_EMAIL"
        },
        {
            "authority": "ROLE_PHOTO"
        },
    ]
}

```

